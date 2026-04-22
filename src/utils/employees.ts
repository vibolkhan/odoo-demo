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
}

type OdooSearchReadResult = {
  records?: OdooEmployeeRecord[]
}

export type EmployeeOption = {
  id: number
  name: string
  company: string
  department: string
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
} as const

const getDisplayName = (value?: OdooDisplayRecord | false) =>
  value && typeof value === 'object' ? value.display_name ?? '' : ''

const mapEmployeeRecord = (record: OdooEmployeeRecord): EmployeeOption => ({
  id: record.id,
  name: record.name ?? '',
  company: getDisplayName(record.company_id),
  department: getDisplayName(record.department_id),
})

export const fetchEmployees = async () => {
  const storedUserId = Number(getStoredUserId())

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
        offset: 0,
        order: 'department_id DESC',
        limit: 80,
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
        domain: ['&', ['active', '=', true], ['company_id', 'in', DEFAULT_ALLOWED_COMPANY_IDS]],
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

  return (response.result?.records ?? []).map(mapEmployeeRecord)
}
