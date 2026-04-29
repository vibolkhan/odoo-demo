import {
  DEFAULT_ALLOWED_COMPANY_IDS,
  DEFAULT_COMPANY_ID,
  getStoredUserId,
  postJsonRpc,
} from '@/utils/auth'

const EMPLOYEE_LIST_ENDPOINT = '/web/dataset/call_kw/hr.employee/web_search_read'

type OdooDisplayRecord = {
  display_name?: string
}

type OdooEmployeeRecord = {
  id: number
  name?: string
  company_id?: OdooDisplayRecord | false
  department_id?: OdooDisplayRecord | false
  attendance_state?: string
  last_check_in?: string | false
}

type OdooSearchReadResult = {
  records?: OdooEmployeeRecord[]
}

export type EmployeeOption = {
  id: number
  name: string
  company: string
  department: string
  attendanceState: string
  lastCheckIn: string | null
}

export type FetchEmployeesOptions = {
  offset?: number
  limit?: number
  query?: string
}

export type FetchEmployeesResult = {
  records: EmployeeOption[]
  hasMore: boolean
}

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
} as const

const getDisplayName = (value?: OdooDisplayRecord | false) =>
  value && typeof value === 'object' ? value.display_name ?? '' : ''

const mapEmployeeRecord = (record: OdooEmployeeRecord): EmployeeOption => ({
  id: record.id,
  name: record.name ?? '',
  company: getDisplayName(record.company_id),
  department: getDisplayName(record.department_id),
  attendanceState: record.attendance_state ?? 'checked_out',
  lastCheckIn: record.last_check_in || null,
})

const buildEmployeeDomain = (query?: string) => {
  const normalizedQuery = query?.trim()
  const baseFilters: unknown[] = [
    ['active', '=', true],
    ['company_id', 'in', DEFAULT_ALLOWED_COMPANY_IDS],
  ]

  if (!normalizedQuery) {
    return baseFilters
  }

  return [
    '&',
    '&',
    ['active', '=', true],
    ['company_id', 'in', DEFAULT_ALLOWED_COMPANY_IDS],
    '|',
    '|',
    '|',
    '|',
    ['name', 'ilike', normalizedQuery],
    ['company_id', 'ilike', normalizedQuery],
    ['department_id', 'ilike', normalizedQuery],
    ['work_email', 'ilike', normalizedQuery],
    ['work_phone', 'ilike', normalizedQuery],
  ]
}

export const fetchEmployees = async (
  options: FetchEmployeesOptions = {},
): Promise<FetchEmployeesResult> => {
  const storedUserId = Number(getStoredUserId())
  const offset = options.offset ?? 0
  const limit = options.limit ?? 80
  const query = options.query?.trim() ?? ''

  if (!Number.isFinite(storedUserId) || storedUserId <= 0) {
    throw new Error('Missing user session. Please log in again.')
  }

  const response = await postJsonRpc<OdooSearchReadResult>(
    EMPLOYEE_LIST_ENDPOINT,
    {
      model: 'hr.employee',
      method: 'web_search_read',
      args: [],
      kwargs: {
        specification: employeeSpecification,
        offset,
        order: 'department_id DESC',
        limit,
        context: {
          lang: 'en_US',
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Bangkok',
          uid: storedUserId,
          allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
          bin_size: true,
          hide_employee_name: 1,
          current_company_id: DEFAULT_COMPANY_ID,
        },
        count_limit: 10001,
        domain: buildEmployeeDomain(query),
      },
    },
  )

  if (response.error) {
    throw new Error(
      response.error.data?.message ||
        response.error.message ||
        'Unable to load employees.'
    )
  }

  const records = (response.result?.records ?? []).map(mapEmployeeRecord)

  return {
    records,
    hasMore: records.length === limit,
  }
}

export const fetchCurrentUserEmployee = async (): Promise<EmployeeOption | null> => {
  const storedUserId = Number(getStoredUserId())

  if (!Number.isFinite(storedUserId) || storedUserId <= 0) {
    return null
  }

  const response = await postJsonRpc<OdooSearchReadResult>(
    EMPLOYEE_LIST_ENDPOINT,
    {
      model: 'hr.employee',
      method: 'web_search_read',
      args: [],
      kwargs: {
        specification: employeeSpecification,
        offset: 0,
        limit: 1,
        context: {
          lang: 'en_US',
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Bangkok',
          uid: storedUserId,
          allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
          current_company_id: DEFAULT_COMPANY_ID,
        },
        domain: [['user_id', '=', storedUserId]],
      },
    },
  )

  if (response.error || !response.result?.records?.length) {
    return null
  }

  return mapEmployeeRecord(response.result.records[0])
}
