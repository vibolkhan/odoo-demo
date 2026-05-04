import { CapacitorHttp } from "@capacitor/core";
import axios from "axios";
import { odooAxios } from "@/api/axios";
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

const LEAVE_LIST_ENDPOINT = "/web/dataset/call_kw/hr.leave/web_search_read";
const LEAVE_ALLOCATION_ENDPOINT =
  "/web/dataset/call_kw/hr.leave.allocation/web_search_read";
const LEAVE_SAVE_ENDPOINT = "/web/dataset/call_kw/hr.leave/web_save";
const LEAVE_APPROVE_ENDPOINT =
  "/web/dataset/call_button/hr.leave/action_approve";
const LEAVE_REFUSE_ENDPOINT = "/web/dataset/call_button/hr.leave/action_refuse";
const LEAVE_TYPE_CATALOG_ENDPOINT =
  "/web/dataset/call_kw/hr.leave.type/web_search_read";
const LEAVE_TYPE_CREATE_ENDPOINT = "/web/dataset/call_kw/hr.leave.type/create";
const LEAVE_TYPE_WRITE_ENDPOINT = "/web/dataset/call_kw/hr.leave.type/write";
const LEAVE_TYPE_DELETE_ENDPOINT = "/web/dataset/call_kw/hr.leave.type/unlink";
const CALL_KW_ENDPOINT = "/web/dataset/call_kw/";
const DEFAULT_TZ = "Asia/Phnom_Penh";
const DEFAULT_DATE_FROM_TIME = "00:30:00";
const DEFAULT_DATE_TO_TIME = "10:30:00";

const leaveSpecification = {
  employee_id: {
    fields: {
      display_name: {},
    },
  },
  department_id: {
    fields: {
      display_name: {},
    },
  },
  holiday_status_id: {
    fields: {
      id: {},
      display_name: {},
    },
  },
  name: {},
  date_from: {},
  date_to: {},
  duration_display: {},
  number_of_days: {},
  state: {},
  active_employee: {},
  user_id: {
    fields: {},
  },
  message_needaction: {},
  request_unit_half: {},
  company_id: {
    fields: {
      display_name: {},
    },
  },
  activity_exception_decoration: {},
  activity_exception_icon: {},
};

const allocationSpecification = {
  employee_id: {
    fields: {
      display_name: {},
    },
  },
  department_id: {
    fields: {
      display_name: {},
    },
  },
  holiday_status_id: {
    fields: {
      display_name: {},
    },
  },
  name: {},
  duration_display: {},
  number_of_days: {},
  date_from: {},
  date_to: {},
  allocation_type: {},
  accrual_plan_id: {
    fields: {
      display_name: {},
    },
  },
  notes: {},
  message_needaction: {},
  active_employee: {},
  state: {},
  activity_exception_decoration: {},
  activity_exception_icon: {},
};

const leaveSaveSpecification = {
  can_reset: {},
  can_approve: {},
  can_cancel: {},
  has_mandatory_day: {},
  state: {},
  tz: {},
  tz_mismatch: {},
  leave_type_request_unit: {},
  display_name: {},
  leave_type_increases_duration: {},
  employee_id: {
    fields: {},
  },
  employee_company_id: {
    fields: {},
  },
  holiday_status_id: {
    fields: {
      display_name: {},
    },
  },
  date_from: {},
  date_to: {},
  request_date_from: {},
  request_date_to: {},
  request_date_from_period: {},
  request_unit_half: {},
  request_unit_hours: {},
  request_hour_from: {},
  request_hour_to: {},
  number_of_days: {},
  number_of_hours: {},
  duration_display: {},
  name: {},
  user_id: {
    fields: {},
  },
  leave_type_support_document: {},
  supported_attachment_ids: {
    fields: {
      name: {},
      mimetype: {},
    },
  },
};

const leaveTypeSpecification = {
  sequence: {},
  display_name: {},
};

const getRequiredUserId = (userId) => {
  const normalizedUserId = Number(userId);

  if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
    throw new Error("Missing user session. Please log in again.");
  }

  return normalizedUserId;
};

const getDisplayName = (value) =>
  value && typeof value === "object" ? value.display_name ?? "" : "";

const getRecordId = (value) =>
  value && typeof value === "object" ? value.id ?? 0 : 0;

const getBaseContext = (userId, extraContext = {}) => ({
  lang: "en_US",
  tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Bangkok",
  uid: userId,
  allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
  ...extraContext,
});

const getLeaveTypeContext = (userId, extraContext = {}) => ({
  lang: "en_US",
  tz: Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TZ,
  uid: userId,
  allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
  ...extraContext,
});

const buildOdooDateTime = (date, fallbackTime) =>
  `${date || new Date().toISOString().slice(0, 10)} ${fallbackTime}`;

const buildLeaveTypePayload = (input) => ({
  name: input.name.trim(),
});

const mapLeaveRecord = (record) => ({
  id: record.id,
  companyName: getDisplayName(record.company_id),
  dateFrom: record.date_from ?? "",
  dateTo: record.date_to ?? "",
  departmentName: getDisplayName(record.department_id),
  durationDisplay: record.duration_display ?? "",
  numberOfDays: record.number_of_days ?? 0,
  employeeName: getDisplayName(record.employee_id),
  leaveType: getDisplayName(record.holiday_status_id) || "Leave Request",
  leaveTypeId: getRecordId(record.holiday_status_id),
  needsAction: Boolean(record.message_needaction),
  reason: record.name || "",
  state: record.state ?? "draft",
  requestUnitHalf: Boolean(record.request_unit_half),
});

const ensureSuccess = (response, fallbackMessage) => {
  if (response.error) {
    throw new Error(
      response.error.data?.message || response.error.message || fallbackMessage,
    );
  }
};

export const fetchLeaveRequests = async (userId) => {
  const storedUserId = getRequiredUserId(userId);
  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: "hr.leave",
      method: "web_search_read",
      args: [],
      kwargs: {
        specification: leaveSpecification,
        offset: 0,
        order: "date_from DESC",
        limit: 10,
        context: getBaseContext(storedUserId, {
          bin_size: true,
          current_company_id: DEFAULT_COMPANY_ID,
        }),
        count_limit: 10001,
        domain: [["user_id", "=", storedUserId]],
      },
    },
    id: 1,
  };
  let response;

  try {
    if (isNativePlatform()) {
      const result = await CapacitorHttp.post({
        url: buildUrl(LEAVE_LIST_ENDPOINT),
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
      const result = await odooAxios.post(buildUrl(LEAVE_LIST_ENDPOINT), body);
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

    if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
      throw new Error(
        "Network request was blocked before reaching the server. This is usually a CORS or connectivity issue.",
      );
    }

    throw error;
  }

  ensureSuccess(response, "Unable to load leave requests.");

  return (response.result?.records ?? []).map(mapLeaveRecord);
};

export const fetchCompanyLeaveRequests = async (userId) => {
  const storedUserId = getRequiredUserId(userId);
  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: "hr.leave",
      method: "web_search_read",
      args: [],
      kwargs: {
        specification: leaveSpecification,
        offset: 0,
        order: "date_from DESC",
        limit: 10,
        context: getBaseContext(storedUserId, {
          bin_size: true,
          hide_employee_name: 1,
          current_company_id: DEFAULT_COMPANY_ID,
        }),
        count_limit: 10001,
        domain: [["employee_id.company_id", "in", DEFAULT_ALLOWED_COMPANY_IDS]],
      },
    },
    id: 1,
  };
  let response;

  try {
    if (isNativePlatform()) {
      const result = await CapacitorHttp.post({
        url: buildUrl(LEAVE_LIST_ENDPOINT),
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
      const result = await odooAxios.post(buildUrl(LEAVE_LIST_ENDPOINT), body);
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

    if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
      throw new Error(
        "Network request was blocked before reaching the server. This is usually a CORS or connectivity issue.",
      );
    }

    throw error;
  }

  ensureSuccess(response, "Unable to load company-wide leave requests.");

  return (response.result?.records ?? []).map(mapLeaveRecord);
};

export const saveLeaveRequest = async (userId, input) => {
  const storedUserId = getRequiredUserId(userId);
  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: "hr.leave",
      method: "web_save",
      args: [
        [],
        {
          state: "confirm",
          employee_id: input.employeeId,
          holiday_status_id: input.leaveTypeId,
          request_date_from: input.requestDateFrom,
          request_date_to: input.requestDateTo,
          request_date_from_period: "am",
          request_unit_half: input.requestUnitHalf,
          request_unit_hours: false,
          request_hour_from: 0,
          request_hour_to: 0,
          name: input.reason?.trim() || false,
          supported_attachment_ids: [],
        },
      ],
      kwargs: {
        context: getBaseContext(storedUserId),
        specification: leaveSaveSpecification,
      },
    },
    id: 1,
  };
  let response;

  try {
    if (isNativePlatform()) {
      const result = await CapacitorHttp.post({
        url: buildUrl(LEAVE_SAVE_ENDPOINT),
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
      const result = await odooAxios.post(buildUrl(LEAVE_SAVE_ENDPOINT), body);
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

    if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
      throw new Error(
        "Network request was blocked before reaching the server. This is usually a CORS or connectivity issue.",
      );
    }

    throw error;
  }

  ensureSuccess(response, "Unable to submit leave request.");

  return response.result;
};

export const updateLeaveRequest = async (userId, id, input) => {
  const storedUserId = getRequiredUserId(userId);
  const values = {};

  if (input.leaveTypeId) values.holiday_status_id = input.leaveTypeId;
  if (input.requestDateFrom) values.request_date_from = input.requestDateFrom;
  if (input.requestDateTo) values.request_date_to = input.requestDateTo;
  if (input.requestUnitHalf !== undefined) {
    values.request_unit_half = input.requestUnitHalf;
    if (input.requestUnitHalf) {
      values.request_date_from_period = "am";
    }
  }
  if (input.reason !== undefined) values.name = input.reason?.trim() || false;

  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: "hr.leave",
      method: "web_save",
      args: [[id], values],
      kwargs: {
        context: getBaseContext(storedUserId),
        specification: leaveSaveSpecification,
      },
    },
    id: 1,
  };
  let response;

  try {
    if (isNativePlatform()) {
      const result = await CapacitorHttp.post({
        url: buildUrl(LEAVE_SAVE_ENDPOINT),
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
      const result = await odooAxios.post(buildUrl(LEAVE_SAVE_ENDPOINT), body);
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

    if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
      throw new Error(
        "Network request was blocked before reaching the server. This is usually a CORS or connectivity issue.",
      );
    }

    throw error;
  }

  ensureSuccess(response, "Unable to update leave request.");

  return response.result;
};

const callButtonAction = async (userId, endpoint, id) => {
  const storedUserId = getRequiredUserId(userId);
  const method = endpoint.split("/").pop();
  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: "hr.leave",
      method,
      args: [[id]],
      kwargs: {
        context: {
          hide_employee_name: 1,
          lang: "en_US",
          tz: "Asia/Bangkok",
          uid: storedUserId,
          allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
        },
      },
    },
    id: 1,
  };
  let response;

  try {
    if (isNativePlatform()) {
      const result = await CapacitorHttp.post({
        url: buildUrl(endpoint),
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
      const result = await odooAxios.post(buildUrl(endpoint), body);
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

    if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
      throw new Error(
        "Network request was blocked before reaching the server. This is usually a CORS or connectivity issue.",
      );
    }

    throw error;
  }

  ensureSuccess(response, `Unable to execute ${method}.`);

  return response.result;
};

export const approveLeaveRequest = async (userId, id) =>
  callButtonAction(userId, LEAVE_APPROVE_ENDPOINT, id);

export const refuseLeaveRequest = async (userId, id) =>
  callButtonAction(userId, LEAVE_REFUSE_ENDPOINT, id);

export const fetchLeaveAllocations = async (userId) => {
  const storedUserId = getRequiredUserId(userId);
  const today = new Date().toISOString().split("T")[0];
  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: "hr.leave.allocation",
      method: "web_search_read",
      args: [],
      kwargs: {
        specification: allocationSpecification,
        offset: 0,
        order: "",
        limit: 10,
        context: getBaseContext(storedUserId, {
          bin_size: true,
          is_employee_allocation: true,
          current_company_id: DEFAULT_COMPANY_ID,
        }),
        count_limit: 10001,
        domain: [
          "&",
          ["employee_id.user_id", "=", storedUserId],
          "&",
          ["date_from", "<=", today],
          "|",
          ["date_to", "=", false],
          ["date_to", ">=", today],
        ],
      },
    },
    id: 1,
  };
  let response;

  try {
    if (isNativePlatform()) {
      const result = await CapacitorHttp.post({
        url: buildUrl(LEAVE_ALLOCATION_ENDPOINT),
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
      const result = await odooAxios.post(
        buildUrl(LEAVE_ALLOCATION_ENDPOINT),
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

    if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
      throw new Error(
        "Network request was blocked before reaching the server. This is usually a CORS or connectivity issue.",
      );
    }

    throw error;
  }

  ensureSuccess(response, "Unable to load leave allocations.");

  return (response.result?.records ?? []).map((record) => ({
    id: record.id,
    employeeName: getDisplayName(record.employee_id),
    departmentName: getDisplayName(record.department_id),
    leaveType: getDisplayName(record.holiday_status_id),
    name: record.name || "",
    durationDisplay: record.duration_display || "",
    numberOfDays: record.number_of_days ?? 0,
    dateFrom: record.date_from || "",
    dateTo: record.date_to || "",
    allocationType: record.allocation_type || "",
    accrualPlanName: getDisplayName(record.accrual_plan_id),
    notes: record.notes || "",
    needsAction: Boolean(record.message_needaction),
    state: record.state || "",
  }));
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
          default_date_from: buildOdooDateTime(
            options.dateFrom,
            DEFAULT_DATE_FROM_TIME,
          ),
          default_date_to: buildOdooDateTime(
            options.dateTo,
            DEFAULT_DATE_TO_TIME,
          ),
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
        url: buildUrl(LEAVE_TYPE_CATALOG_ENDPOINT),
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
      const result = await odooAxios.post(
        buildUrl(LEAVE_TYPE_CATALOG_ENDPOINT),
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

    if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
      throw new Error(
        "Network request was blocked before reaching the server. This is usually a CORS or connectivity issue.",
      );
    }

    throw error;
  }

  ensureSuccess(response, "Unable to load leave types.");

  return (response.result?.records ?? []).map((record) => ({
    id: record.id,
    name: record.display_name ?? "",
  }));
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
        url: buildUrl(LEAVE_TYPE_CATALOG_ENDPOINT),
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
      const result = await odooAxios.post(
        buildUrl(LEAVE_TYPE_CATALOG_ENDPOINT),
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

    if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
      throw new Error(
        "Network request was blocked before reaching the server. This is usually a CORS or connectivity issue.",
      );
    }

    throw error;
  }

  ensureSuccess(response, "Unable to load leave types.");

  return (response.result?.records ?? []).map((record) => ({
    id: record.id,
    name: record.display_name ?? "",
  }));
};

const getCrudContext = (userId) =>
  getLeaveTypeContext(userId, {
    current_company_id: DEFAULT_COMPANY_ID,
  });

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
        url: buildUrl(LEAVE_TYPE_CREATE_ENDPOINT),
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
      const result = await odooAxios.post(
        buildUrl(LEAVE_TYPE_CREATE_ENDPOINT),
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

    if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
      throw new Error(
        "Network request was blocked before reaching the server. This is usually a CORS or connectivity issue.",
      );
    }

    throw error;
  }

  ensureSuccess(response, "Unable to create leave type.");

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
        url: buildUrl(LEAVE_TYPE_WRITE_ENDPOINT),
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
      const result = await odooAxios.post(
        buildUrl(LEAVE_TYPE_WRITE_ENDPOINT),
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

    if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
      throw new Error(
        "Network request was blocked before reaching the server. This is usually a CORS or connectivity issue.",
      );
    }

    throw error;
  }

  ensureSuccess(response, "Unable to update leave type.");

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
        url: buildUrl(LEAVE_TYPE_DELETE_ENDPOINT),
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
      const result = await odooAxios.post(
        buildUrl(LEAVE_TYPE_DELETE_ENDPOINT),
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

    if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
      throw new Error(
        "Network request was blocked before reaching the server. This is usually a CORS or connectivity issue.",
      );
    }

    throw error;
  }

  ensureSuccess(response, "Unable to delete leave type.");

  return response.result;
};

export const getUnusualDays = async (userId, start, end) => {
  const storedUserId = getRequiredUserId(userId);
  const path = `${CALL_KW_ENDPOINT}hr.leave.report.calendar/get_unusual_days`;
  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: "hr.leave.report.calendar",
      method: "get_unusual_days",
      args: [start, end],
      kwargs: {
        context: {
          lang: "en_US",
          tz: "Asia/Bangkok",
          uid: storedUserId,
          allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
          employee_id: null,
        },
      },
    },
    id: 1,
  };
  let response;

  try {
    if (isNativePlatform()) {
      const result = await CapacitorHttp.post({
        url: buildUrl(path),
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
      const result = await odooAxios.post(buildUrl(path), body);
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

    if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
      throw new Error(
        "Network request was blocked before reaching the server. This is usually a CORS or connectivity issue.",
      );
    }

    throw error;
  }

  ensureSuccess(response, "Unable to load unusual days.");
  return response.result;
};

export const getLeaveReportCalendar = async (userId, start, end) => {
  const storedUserId = getRequiredUserId(userId);
  const path = `${CALL_KW_ENDPOINT}hr.leave.report.calendar/search_read`;
  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: "hr.leave.report.calendar",
      method: "search_read",
      args: [],
      kwargs: {
        context: {
          lang: "en_US",
          tz: "Asia/Bangkok",
          uid: storedUserId,
          allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
          short_name: 1,
        },
        domain: [
          "&",
          ["employee_id.active", "=", true],
          "|",
          ["employee_id.user_id", "=", storedUserId],
          ["employee_id.parent_id.user_id", "=", storedUserId],
          ["start_datetime", "<=", end],
          ["stop_datetime", ">=", start],
          ["state", "!=", "cancel"],
        ],
        fields: [
          "display_name",
          "start_datetime",
          "stop_datetime",
          "employee_id",
          "name",
          "is_hatched",
          "state",
          "leave_manager_id",
        ],
      },
    },
    id: 1,
  };
  let response;

  try {
    if (isNativePlatform()) {
      const result = await CapacitorHttp.post({
        url: buildUrl(path),
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
      const result = await odooAxios.post(buildUrl(path), body);
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

    if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
      throw new Error(
        "Network request was blocked before reaching the server. This is usually a CORS or connectivity issue.",
      );
    }

    throw error;
  }

  ensureSuccess(response, "Unable to load leave calendar.");
  return response.result;
};

export const getMandatoryDays = async (userId, start, end) => {
  const storedUserId = getRequiredUserId(userId);
  const path = `${CALL_KW_ENDPOINT}hr.employee/get_mandatory_days`;
  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: "hr.employee",
      method: "get_mandatory_days",
      args: [null, start, end],
      kwargs: {
        context: {
          lang: "en_US",
          tz: "Asia/Bangkok",
          uid: storedUserId,
          allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
        },
      },
    },
    id: 1,
  };
  let response;

  try {
    if (isNativePlatform()) {
      const result = await CapacitorHttp.post({
        url: buildUrl(path),
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
      const result = await odooAxios.post(buildUrl(path), body);
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

    if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
      throw new Error(
        "Network request was blocked before reaching the server. This is usually a CORS or connectivity issue.",
      );
    }

    throw error;
  }

  ensureSuccess(response, "Unable to load mandatory days.");
  return response.result;
};

export const getSpecialDaysData = async (userId, start, end) => {
  const storedUserId = getRequiredUserId(userId);
  const path = `${CALL_KW_ENDPOINT}hr.employee/get_special_days_data`;
  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: "hr.employee",
      method: "get_special_days_data",
      args: [start, end],
      kwargs: {
        context: {
          lang: "en_US",
          tz: "Asia/Bangkok",
          uid: storedUserId,
          allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
          employee_id: null,
        },
      },
    },
    id: 1,
  };
  let response;

  try {
    if (isNativePlatform()) {
      const result = await CapacitorHttp.post({
        url: buildUrl(path),
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
      const result = await odooAxios.post(buildUrl(path), body);
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

    if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
      throw new Error(
        "Network request was blocked before reaching the server. This is usually a CORS or connectivity issue.",
      );
    }

    throw error;
  }

  ensureSuccess(response, "Unable to load public holidays.");
  return response.result;
};
