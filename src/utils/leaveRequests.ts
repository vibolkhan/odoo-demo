import {
  DEFAULT_ALLOWED_COMPANY_IDS,
  DEFAULT_COMPANY_ID,
  getStoredUserId,
  postJsonRpc,
} from '@/utils/auth'

const LEAVE_LIST_ENDPOINT = '/web/dataset/call_kw/hr.leave/web_search_read'

type OdooDisplayRecord = {
  display_name?: string
}

type OdooLeaveRecord = {
  id: number
  active_employee?: boolean
  company_id?: OdooDisplayRecord | false
  date_from?: string
  date_to?: string
  department_id?: OdooDisplayRecord | false
  duration_display?: string
  employee_id?: OdooDisplayRecord | false
  holiday_status_id?: OdooDisplayRecord | false
  message_needaction?: boolean
  name?: string
  state?: string
}

type OdooSearchReadResult = {
  length?: number
  records?: OdooLeaveRecord[]
}

export type LeaveRequest = {
  id: number
  companyName: string
  dateFrom: string
  dateTo: string
  departmentName: string
  durationDisplay: string
  employeeName: string
  leaveType: string
  needsAction: boolean
  reason: string
  state: string
}

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
      display_name: {},
    },
  },
  name: {},
  date_from: {},
  date_to: {},
  duration_display: {},
  state: {},
  active_employee: {},
  user_id: {
    fields: {},
  },
  message_needaction: {},
  company_id: {
    fields: {
      display_name: {},
    },
  },
  activity_exception_decoration: {},
  activity_exception_icon: {},
} as const

const getDisplayName = (value?: OdooDisplayRecord | false) =>
  value && typeof value === 'object' ? value.display_name ?? '' : ''

const mapLeaveRecord = (record: OdooLeaveRecord): LeaveRequest => ({
  id: record.id,
  companyName: getDisplayName(record.company_id),
  dateFrom: record.date_from ?? '',
  dateTo: record.date_to ?? '',
  departmentName: getDisplayName(record.department_id),
  durationDisplay: record.duration_display ?? '',
  employeeName: getDisplayName(record.employee_id),
  leaveType: getDisplayName(record.holiday_status_id) || 'Leave Request',
  needsAction: Boolean(record.message_needaction),
  reason: record.name ?? '',
  state: record.state ?? 'draft',
})

export const fetchLeaveRequests = async () => {
  const storedUserId = Number(getStoredUserId())

  if (!Number.isFinite(storedUserId) || storedUserId <= 0) {
    throw new Error('Missing user session. Please log in again.')
  }

  const response = await postJsonRpc<OdooSearchReadResult>(LEAVE_LIST_ENDPOINT, {
    model: 'hr.leave',
    method: 'web_search_read',
    args: [],
    kwargs: {
      specification: leaveSpecification,
      offset: 0,
      order: '',
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
      domain: [
        '&',
        ['employee_id.company_id', 'in', DEFAULT_ALLOWED_COMPANY_IDS],
        '&',
        ['state', 'in', ['confirm', 'validate1']],
        '|',
        ['employee_id.user_id', '!=', storedUserId],
        '|',
        '&',
        ['state', '=', 'confirm'],
        ['holiday_status_id.leave_validation_type', '=', 'hr'],
        ['state', '=', 'validate1'],
      ],
    },
  })

  if (response.error) {
    throw new Error(
      response.error.data?.message ||
        response.error.message ||
        'Unable to load leave requests.'
    )
  }

  return (response.result?.records ?? []).map(mapLeaveRecord)
}
