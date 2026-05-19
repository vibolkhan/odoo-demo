import { CapacitorHttp } from "@capacitor/core";
import { odooHttp } from "@/api/http";
import {
  DEFAULT_ALLOWED_COMPANY_IDS,
  DEFAULT_COMPANY_ID,
  buildUrl,
  containsSessionExpiredText,
  createSessionExpiredError,
  handleExpiredSession,
  isNativePlatform,
  isSessionExpiredError,
} from "@/api/auth.api";

const leaveTypeSpecification = {
  sequence: {},
  display_name: {},
};

const getRequiredUserId = (userId) => {
  const normalizedUserId = Number(userId);

  if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
    throw new Error("SESSION_EXPIRED");
  }

  return normalizedUserId;
};

const getLeaveTypeContext = (userId, extraContext = {}) => ({
  lang: "en_US",
  tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Phnom_Penh",
  uid: userId,
  allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
  ...extraContext,
});

const buildOdooDateTime = (date, fallbackTime) =>
  `${date || new Date().toISOString().slice(0, 10)} ${fallbackTime}`;

const buildLeaveTypePayload = (input) => ({
  name: input.name.trim(),
});

const getCrudContext = (userId) =>
  getLeaveTypeContext(userId, {
    current_company_id: DEFAULT_COMPANY_ID,
  });

const ensureSuccess = (response) => {
  if (response.error) {
    throw new Error(response.error.data?.message || response.error.message);
  }
};

const mapLeaveTypeRecord = (record) => ({
  id: record.id,
  name: record.display_name ?? "",
});

const buildPaginatedResult = (response, offset, limit) => {
  const records = (response.result?.records ?? []).map(mapLeaveTypeRecord);
  const total = response.result?.length;

  return {
    records,
    total,
    hasMore:
      typeof total === "number"
        ? offset + records.length < total
        : records.length === limit,
  };
};

export const fetchLeaveTypes = async (userId, options = {}) => {
  const storedUserId = getRequiredUserId(userId);
  const limit = options.limit ?? 200;
  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: "hr.leave.type",
      method: "web_search_read",
      args: [],
      kwargs: {
        specification: {
          sequence: {},
          display_name: {},
          code: {},
          leave_validation_type: {},
          responsible_ids: {
            fields: {
              display_name: {},
            },
          },
          requires_allocation: {},
          allocation_validation_type: {},
          employee_requests: {},
          color: {},
        },
        offset: 0,
        order: "sequence ASC, id ASC",
        limit,
        context: getLeaveTypeContext(storedUserId, {
          hide_employee_name: 1,
          employee_id: options.employeeId ?? false,
          default_date_from: buildOdooDateTime(options.dateFrom, "00:30:00"),
          default_date_to: buildOdooDateTime(options.dateTo, "10:30:00"),
          current_company_id: DEFAULT_COMPANY_ID,
          bin_size: true,
        }),
        count_limit: 10001,
        domain: [
          "|",
          ["requires_allocation", "=", "no"],
          "&",
          ["has_valid_allocation", "=", true],
          "|",
          ["allows_negative", "=", true],
          "&",
          ["virtual_remaining_leaves", ">", 0],
          ["allows_negative", "=", false],
        ],
      },
    },
    id: 1,
  };
  let response;

  try {
    if (isNativePlatform()) {
      const result = await CapacitorHttp.post({
        url: buildUrl("/web/dataset/call_kw/hr.leave.type/web_search_read"),
        headers: {
          "Content-Type": "application/json",
        },
        data: body,
      });

      if (result.status < 200 || result.status >= 300) {
        throw new Error(`Request failed with status ${result.status}.`);
      }

      response = result.data;
    } else {
      const result = await odooHttp.post(
        buildUrl("/web/dataset/call_kw/hr.leave.type/web_search_read"),
        body,
      );
      response = result.data;
    }

    if (isSessionExpiredError(response.error)) {
      await handleExpiredSession();
      throw createSessionExpiredError();
    }
  } catch (error) {
    if (error instanceof Error && containsSessionExpiredText(error.message)) {
      await handleExpiredSession();
      throw createSessionExpiredError();
    }

    throw error;
  }

  ensureSuccess(response);

  return (response.result?.records ?? []).map(mapLeaveTypeRecord);
};

export const fetchLeaveTypeCatalog = async (userId, options = {}) => {
  const storedUserId = getRequiredUserId(userId);
  const query = options.query?.trim() ?? "";
  const limit = options.limit ?? 25;
  const offset = options.offset ?? 0;
  const domain = query ? [["name", "ilike", query]] : [];

  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: "hr.leave.type",
      method: "web_search_read",
      args: [],
      kwargs: {
        specification: leaveTypeSpecification,
        limit,
        offset,
        order: "sequence ASC, id ASC",
        context: getLeaveTypeContext(storedUserId, {
          bin_size: true,
          current_company_id: DEFAULT_COMPANY_ID,
        }),
        count_limit: 10001,
        domain,
      },
    },
    id: 1,
  };
  let response;

  try {
    if (isNativePlatform()) {
      const result = await CapacitorHttp.post({
        url: buildUrl("/web/dataset/call_kw/hr.leave.type/web_search_read"),
        headers: {
          "Content-Type": "application/json",
        },
        data: body,
      });

      if (result.status < 200 || result.status >= 300) {
        throw new Error(`Request failed with status ${result.status}.`);
      }

      response = result.data;
    } else {
      const result = await odooHttp.post(
        buildUrl("/web/dataset/call_kw/hr.leave.type/web_search_read"),
        body,
      );
      response = result.data;
    }

    if (isSessionExpiredError(response.error)) {
      await handleExpiredSession();
      throw createSessionExpiredError();
    }
  } catch (error) {
    if (error instanceof Error && containsSessionExpiredText(error.message)) {
      await handleExpiredSession();
      throw createSessionExpiredError();
    }

    throw error;
  }

  ensureSuccess(response);

  return buildPaginatedResult(response, offset, limit);
};

export const createLeaveType = async (userId, input) => {
  const storedUserId = getRequiredUserId(userId);
  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: "hr.leave.type",
      method: "create",
      args: [buildLeaveTypePayload(input)],
      kwargs: {
        context: getCrudContext(storedUserId),
      },
    },
    id: 1,
  };
  let response;

  try {
    if (isNativePlatform()) {
      const result = await CapacitorHttp.post({
        url: buildUrl("/web/dataset/call_kw/hr.leave.type/create"),
        headers: {
          "Content-Type": "application/json",
        },
        data: body,
      });

      if (result.status < 200 || result.status >= 300) {
        throw new Error(`Request failed with status ${result.status}.`);
      }

      response = result.data;
    } else {
      const result = await odooHttp.post(
        buildUrl("/web/dataset/call_kw/hr.leave.type/create"),
        body,
      );
      response = result.data;
    }

    if (isSessionExpiredError(response.error)) {
      await handleExpiredSession();
      throw createSessionExpiredError();
    }
  } catch (error) {
    if (error instanceof Error && containsSessionExpiredText(error.message)) {
      await handleExpiredSession();
      throw createSessionExpiredError();
    }

    throw error;
  }

  ensureSuccess(response);

  return response.result;
};

export const updateLeaveType = async (userId, leaveTypeId, input) => {
  const storedUserId = getRequiredUserId(userId);
  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: "hr.leave.type",
      method: "write",
      args: [[leaveTypeId], buildLeaveTypePayload(input)],
      kwargs: {
        context: getCrudContext(storedUserId),
      },
    },
    id: 1,
  };
  let response;

  try {
    if (isNativePlatform()) {
      const result = await CapacitorHttp.post({
        url: buildUrl("/web/dataset/call_kw/hr.leave.type/write"),
        headers: {
          "Content-Type": "application/json",
        },
        data: body,
      });

      if (result.status < 200 || result.status >= 300) {
        throw new Error(`Request failed with status ${result.status}.`);
      }

      response = result.data;
    } else {
      const result = await odooHttp.post(
        buildUrl("/web/dataset/call_kw/hr.leave.type/write"),
        body,
      );
      response = result.data;
    }

    if (isSessionExpiredError(response.error)) {
      await handleExpiredSession();
      throw createSessionExpiredError();
    }
  } catch (error) {
    if (error instanceof Error && containsSessionExpiredText(error.message)) {
      await handleExpiredSession();
      throw createSessionExpiredError();
    }

    throw error;
  }

  ensureSuccess(response);

  return response.result;
};

export const deleteLeaveType = async (userId, leaveTypeId) => {
  const storedUserId = getRequiredUserId(userId);
  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: "hr.leave.type",
      method: "unlink",
      args: [[leaveTypeId]],
      kwargs: {
        context: getCrudContext(storedUserId),
      },
    },
    id: 1,
  };
  let response;

  try {
    if (isNativePlatform()) {
      const result = await CapacitorHttp.post({
        url: buildUrl("/web/dataset/call_kw/hr.leave.type/unlink"),
        headers: {
          "Content-Type": "application/json",
        },
        data: body,
      });

      if (result.status < 200 || result.status >= 300) {
        throw new Error(`Request failed with status ${result.status}.`);
      }

      response = result.data;
    } else {
      const result = await odooHttp.post(
        buildUrl("/web/dataset/call_kw/hr.leave.type/unlink"),
        body,
      );
      response = result.data;
    }

    if (isSessionExpiredError(response.error)) {
      await handleExpiredSession();
      throw createSessionExpiredError();
    }
  } catch (error) {
    if (error instanceof Error && containsSessionExpiredText(error.message)) {
      await handleExpiredSession();
      throw createSessionExpiredError();
    }

    throw error;
  }

  ensureSuccess(response);

  return response.result;
};
