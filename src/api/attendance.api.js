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

const attendanceSpecification = {
  employee_id: {
    fields: {
      display_name: {},
    },
  },
  check_in: {},
  check_out: {},
  worked_hours: {},
  overtime_hours: {},
  validated_overtime_hours: {},
  overtime_status: {},
  in_mode: {},
  out_mode: {},
  in_latitude: {},
  in_longitude: {},
  out_latitude: {},
  out_longitude: {},
  in_city: {},
  out_city: {},
  in_country_name: {},
  out_country_name: {},
  create_uid: {
    fields: {
      display_name: {},
    },
  },
  write_uid: {
    fields: {
      display_name: {},
    },
  },
  write_date: {},
  color: {},
};

const getRequiredUserId = (userId) => {
  const normalizedUserId = Number(userId);

  if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
    throw new Error("SESSION_EXPIRED");
  }

  return normalizedUserId;
};

const buildBaseContext = (userId, extraContext = {}) => ({
  lang: "en_US",
  tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Bangkok",
  uid: userId,
  allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
  ...extraContext,
});

export const fetchAttendanceUserData = async (userId) => {
  getRequiredUserId(userId);

  const path = "/hr_attendance/attendance_user_data";
  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {},
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
        throw new Error(String(result.status));
      }

      response = result.data;
    } else {
      const result = await odooHttp.post(buildUrl(path), body);
      response = result.data;
    }

    if (isSessionExpiredError(response.error)) {
      await handleExpiredSession();
      throw createSessionExpiredError(
        response.error.data?.message || response.error.message,
      );
    }
  } catch (error) {
    if (error instanceof Error && containsSessionExpiredText(error.message)) {
      await handleExpiredSession();
      throw createSessionExpiredError(error.message);
    }

    throw error;
  }

  if (response.error) {
    throw new Error(response.error.data?.message || response.error.message);
  }

  return response.result;
};

export const fetchMyAttendances = async (userId, options = {}) => {
  const storedUserId = getRequiredUserId(userId);
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;
  const domain = [
    ["employee_id.user_id", "=", storedUserId],
    ["employee_id.active", "=", true],
  ];

  if (options.dateFrom) {
    domain.push(["check_in", ">=", `${options.dateFrom} 00:00:00`]);
  }

  if (options.dateTo) {
    domain.push(["check_in", "<=", `${options.dateTo} 23:59:59`]);
  }

  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: "hr.attendance",
      method: "web_search_read",
      args: [],
      kwargs: {
        specification: attendanceSpecification,
        offset,
        order: "check_in DESC",
        limit,
        context: buildBaseContext(storedUserId, {
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
        url: buildUrl("/web/dataset/call_kw/hr.attendance/web_search_read"),
        headers: {
          "Content-Type": "application/json",
        },
        data: body,
      });

      if (result.status < 200 || result.status >= 300) {
        throw new Error(String(result.status));
      }

      response = result.data;
    } else {
      const result = await odooHttp.post(
        buildUrl("/web/dataset/call_kw/hr.attendance/web_search_read"),
        body,
      );
      response = result.data;
    }

    if (isSessionExpiredError(response.error)) {
      await handleExpiredSession();
      throw createSessionExpiredError(
        response.error.data?.message || response.error.message,
      );
    }
  } catch (error) {
    if (error instanceof Error && containsSessionExpiredText(error.message)) {
      await handleExpiredSession();
      throw createSessionExpiredError(error.message);
    }

    throw error;
  }

  if (response.error) {
    throw new Error(response.error.data?.message || response.error.message);
  }

  const records = response.result?.records ?? [];

  return {
    records,
    total: response.result?.length,
    hasMore:
      typeof response.result?.length === "number"
        ? offset + records.length < response.result.length
        : records.length === limit,
  };
};

export const fetchAllAttendances = async (
  userId,
  domain = [],
  options = {},
) => {
  const storedUserId = getRequiredUserId(userId);
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;

  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: "hr.attendance",
      method: "web_search_read",
      args: [],
      kwargs: {
        specification: attendanceSpecification,
        offset,
        order: "check_in DESC",
        limit,
        context: buildBaseContext(storedUserId, {
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
        url: buildUrl("/web/dataset/call_kw/hr.attendance/web_search_read"),
        headers: {
          "Content-Type": "application/json",
        },
        data: body,
      });

      if (result.status < 200 || result.status >= 300) {
        throw new Error(String(result.status));
      }

      response = result.data;
    } else {
      const result = await odooHttp.post(
        buildUrl("/web/dataset/call_kw/hr.attendance/web_search_read"),
        body,
      );
      response = result.data;
    }

    if (isSessionExpiredError(response.error)) {
      await handleExpiredSession();
      throw createSessionExpiredError(
        response.error.data?.message || response.error.message,
      );
    }
  } catch (error) {
    if (error instanceof Error && containsSessionExpiredText(error.message)) {
      await handleExpiredSession();
      throw createSessionExpiredError(error.message);
    }

    throw error;
  }

  if (response.error) {
    throw new Error(response.error.data?.message || response.error.message);
  }

  const records = response.result?.records ?? [];

  return {
    records,
    total: response.result?.length,
    hasMore:
      typeof response.result?.length === "number"
        ? offset + records.length < response.result.length
        : records.length === limit,
  };
};

export const fetchAttendanceDetail = async (userId, id) => {
  const storedUserId = getRequiredUserId(userId);

  const path = "/web/dataset/call_kw/hr.attendance/web_read";
  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: "hr.attendance",
      method: "web_read",
      args: [[id]],
      kwargs: {
        context: buildBaseContext(storedUserId, {
          bin_size: true,
        }),
        specification: {
          overtime_status: {},
          employee_id: { fields: { display_name: {} } },
          check_in: {},
          check_out: {},
          worked_hours: {},
          overtime_hours: {},
          validated_overtime_hours: {},
          in_mode: {},
          in_ip_address: {},
          in_browser: {},
          in_country_name: {},
          in_city: {},
          in_latitude: {},
          in_longitude: {},
          out_mode: {},
          out_ip_address: {},
          out_browser: {},
          out_country_name: {},
          out_city: {},
          out_latitude: {},
          out_longitude: {},
          no_validated_overtime_hours: {},
          display_name: {},
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
        throw new Error(String(result.status));
      }

      response = result.data;
    } else {
      const result = await odooHttp.post(buildUrl(path), body);
      response = result.data;
    }

    if (isSessionExpiredError(response.error)) {
      await handleExpiredSession();
      throw createSessionExpiredError(
        response.error.data?.message || response.error.message,
      );
    }
  } catch (error) {
    if (error instanceof Error && containsSessionExpiredText(error.message)) {
      await handleExpiredSession();
      throw createSessionExpiredError(error.message);
    }

    throw error;
  }

  if (response.error) {
    throw new Error(response.error.data?.message || response.error.message);
  }

  return response.result && response.result.length > 0
    ? response.result[0]
    : null;
};

export const toggleAttendanceState = async (userId, latitude, longitude) => {
  getRequiredUserId(userId);

  const path = "/hr_attendance/systray_check_in_out";
  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      latitude,
      longitude,
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
        throw new Error(String(result.status));
      }

      response = result.data;
    } else {
      const result = await odooHttp.post(buildUrl(path), body);
      response = result.data;
    }

    if (isSessionExpiredError(response.error)) {
      await handleExpiredSession();
      throw createSessionExpiredError(
        response.error.data?.message || response.error.message,
      );
    }
  } catch (error) {
    if (error instanceof Error && containsSessionExpiredText(error.message)) {
      await handleExpiredSession();
      throw createSessionExpiredError(error.message);
    }

    throw error;
  }

  if (response.error) {
    throw new Error(response.error.data?.message || response.error.message);
  }

  return response.result;
};
