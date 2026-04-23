import {
  DEFAULT_ALLOWED_COMPANY_IDS,
  DEFAULT_COMPANY_ID,
  getStoredUserId,
  postJsonRpc,
} from '@/utils/auth'

const LEAVE_LIST_ENDPOINT = '/web/dataset/call_kw/hr.leave/web_search_read'
const LEAVE_SAVE_ENDPOINT = '/web/dataset/call_kw/hr.leave/web_save'
const LEAVE_FORM_RES_ID = 161
const LEAVE_ACTION = 'time-off-approval'

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

type OdooSaveResult = {
  id?: number
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

export type SaveLeaveRequestInput = {
  employeeId: number
  leaveTypeId: number
  requestDateFrom: string
  requestDateTo: string
  requestUnitHalf: boolean
  reason?: string
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
    fields: {
      display_name: {},
    },
  },
  employee_company_id: {
    fields: {},
  },
  company_id: {
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
  employee_overtime: {},
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
  overtime_deductible: {},
} as const

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

export const saveLeaveRequest = async (input: SaveLeaveRequestInput) => {
  const storedUserId = Number(getStoredUserId())

  if (!Number.isFinite(storedUserId) || storedUserId <= 0) {
    throw new Error('Missing user session. Please log in again.')
  }

  const response = await postJsonRpc<OdooSaveResult>(LEAVE_SAVE_ENDPOINT, {
    model: 'hr.leave',
    method: 'web_save',
    args: [
      [LEAVE_FORM_RES_ID],
      {
        employee_id: input.employeeId,
        holiday_status_id: input.leaveTypeId,
        request_date_from: input.requestDateFrom,
        request_date_to: input.requestDateTo,
        request_unit_half: input.requestUnitHalf,
        name: input.reason?.trim() || false,
      },
    ],
    kwargs: {
      context: {
        lang: 'en_US',
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Bangkok',
        uid: storedUserId,
        allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
        params: {
          resId: LEAVE_FORM_RES_ID,
          action: LEAVE_ACTION,
          actionStack: [
            {
              action: LEAVE_ACTION,
            },
            {
              resId: LEAVE_FORM_RES_ID,
              action: LEAVE_ACTION,
            },
          ],
        },
        hide_employee_name: 1,
      },
      specification: leaveSaveSpecification,
    },
  })

  if (response.error) {
    throw new Error(
      response.error.data?.message ||
        response.error.message ||
        'Unable to submit leave request.',
    )
  }

  return response.result
}
