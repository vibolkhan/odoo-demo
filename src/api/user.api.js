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

const EMPLOYEE_LIST_ENDPOINT = "/web/dataset/call_kw/hr.employee/web_search_read";
const ATTENDANCE_SEARCH_READ_ENDPOINT =
  "/web/dataset/call_kw/hr.attendance/web_search_read";

const employeeSpecification = {
  name: {},
  work_phone: {},
  work_email: {},
  first_contract_date: {},
  activity_ids: {
    fields: {},
  },
  activity_exception_decoration: {},
  activity_exception_icon: {},
  activity_state: {},
  activity_summary: {},
  activity_type_icon: {},
  activity_type_id: {
    fields: {
      display_name: {},
    },
  },
  activity_user_id: {
    fields: {
      display_name: {},
    },
  },
  activity_date_deadline: {},
  company_id: {
    fields: {
      display_name: {},
    },
  },
  memot_village_id: {
    fields: {
      display_name: {},
    },
  },
  group_id: {
    fields: {
      display_name: {},
    },
  },
  department_id: {
    fields: {
      display_name: {},
    },
  },
  job_id: {
    fields: {
      display_name: {},
    },
    context: {
      default_no_of_recruitment: 0,
      default_is_favorite: false,
    },
  },
  parent_id: {
    fields: {
      display_name: {},
    },
  },
  address_id: {
    fields: {},
  },
  work_location_id: {
    fields: {
      display_name: {},
    },
  },
  expense_manager_id: {
    fields: {
      display_name: {},
    },
  },
  attendance_manager_id: {
    fields: {
      display_name: {},
    },
  },
  leave_manager_id: {
    fields: {
      display_name: {},
    },
  },
  coach_id: {
    fields: {
      display_name: {},
    },
  },
  active: {},
  category_ids: {
    fields: {
      display_name: {},
      color: {},
    },
  },
  country_id: {
    fields: {
      display_name: {},
    },
  },
  attendance_state: {},
  last_check_in: {},
};

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

const getDisplayName = (value) =>
  value && typeof value === "object" ? value.display_name ?? "" : "";

const mapEmployeeRecord = (record) => ({
  id: record.id,
  name: record.name ?? "",
  company: getDisplayName(record.company_id),
  department: getDisplayName(record.department_id),
  attendanceState: record.attendance_state ?? "checked_out",
  lastCheckIn: record.last_check_in || null,
});

const buildBaseContext = (userId, extraContext = {}) => ({
  lang: "en_US",
  tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Bangkok",
  uid: userId,
  allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
  ...extraContext,
});

const buildEmployeeDomain = (query) => {
  const normalizedQuery = query?.trim();
  const baseFilters = [
    ["active", "=", true],
    ["company_id", "in", DEFAULT_ALLOWED_COMPANY_IDS],
  ];

  if (!normalizedQuery) {
    return baseFilters;
  }

  return [
    "&",
    "&",
    ["active", "=", true],
    ["company_id", "in", DEFAULT_ALLOWED_COMPANY_IDS],
    "|",
    "|",
    "|",
    "|",
    ["name", "ilike", normalizedQuery],
    ["company_id", "ilike", normalizedQuery],
    ["department_id", "ilike", normalizedQuery],
    ["work_email", "ilike", normalizedQuery],
    ["work_phone", "ilike", normalizedQuery],
  ];
};

export const fetchEmployees = async (userId, options = {}) => {
  const storedUserId = getRequiredUserId(userId);
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 80;
  const query = options.query?.trim() ?? "";

  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: "hr.employee",
      method: "web_search_read",
      args: [],
      kwargs: {
        specification: employeeSpecification,
        offset,
        order: "department_id DESC",
        limit,
        context: buildBaseContext(storedUserId, {
          bin_size: true,
          hide_employee_name: 1,
          current_company_id: DEFAULT_COMPANY_ID,
        }),
        count_limit: 10001,
        domain: buildEmployeeDomain(query),
      },
    },
    id: 1,
  };
  let response;

  try {
    if (isNativePlatform()) {
      const result = await CapacitorHttp.post({
        url: buildUrl(EMPLOYEE_LIST_ENDPOINT),
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
      const result = await odooHttp.post(buildUrl(EMPLOYEE_LIST_ENDPOINT), body);
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

  const records = (response.result?.records ?? []).map(mapEmployeeRecord);

  return {
    records,
    hasMore: records.length === limit,
  };
};

export const fetchCurrentUserEmployee = async (userId) => {
  const storedUserId = getRequiredUserId(userId);

  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      model: "hr.employee",
      method: "web_search_read",
      args: [],
      kwargs: {
        specification: employeeSpecification,
        offset: 0,
        limit: 1,
        context: buildBaseContext(storedUserId, {
          current_company_id: DEFAULT_COMPANY_ID,
        }),
        domain: [["user_id", "=", storedUserId]],
      },
    },
    id: 1,
  };
  let response;

  try {
    if (isNativePlatform()) {
      const result = await CapacitorHttp.post({
        url: buildUrl(EMPLOYEE_LIST_ENDPOINT),
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
      const result = await odooHttp.post(buildUrl(EMPLOYEE_LIST_ENDPOINT), body);
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

  if (response.error || !response.result?.records?.length) {
    return null;
  }

  return mapEmployeeRecord(response.result.records[0]);
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
        url: buildUrl(ATTENDANCE_SEARCH_READ_ENDPOINT),
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
        buildUrl(ATTENDANCE_SEARCH_READ_ENDPOINT),
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

  return response.result?.records ?? [];
};

export const fetchAllAttendances = async (userId, domain = [], options = {}) => {
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
        url: buildUrl(ATTENDANCE_SEARCH_READ_ENDPOINT),
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
        buildUrl(ATTENDANCE_SEARCH_READ_ENDPOINT),
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

  return response.result?.records ?? [];
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

  return response.result && response.result.length > 0 ? response.result[0] : null;
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
