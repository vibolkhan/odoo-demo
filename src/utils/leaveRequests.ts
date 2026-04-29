import {
  DEFAULT_ALLOWED_COMPANY_IDS,
  DEFAULT_COMPANY_ID,
  getStoredUserId,
  postJsonRpc,
} from '@/utils/auth'

const LEAVE_LIST_ENDPOINT = '/web/dataset/call_kw/hr.leave/web_search_read'
const LEAVE_ALLOCATION_ENDPOINT = '/web/dataset/call_kw/hr.leave.allocation/web_search_read'
const LEAVE_SAVE_ENDPOINT = '/web/dataset/call_kw/hr.leave/web_save'
const LEAVE_FORM_RES_ID = 161
const LEAVE_ACTION = 'time-off-approval'
const LEAVE_APPROVE_ENDPOINT = '/web/dataset/call_button/hr.leave/action_approve'
const LEAVE_REFUSE_ENDPOINT = '/web/dataset/call_button/hr.leave/action_refuse'

type OdooDisplayRecord = {
  id?: number
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
  number_of_days?: number
  employee_id?: OdooDisplayRecord | false
  holiday_status_id?: OdooDisplayRecord | false
  message_needaction?: boolean
  name?: string | false
  state?: string
}

type OdooAllocationRecord = {
  id: number
  employee_id: OdooDisplayRecord | false
  department_id: OdooDisplayRecord | false
  holiday_status_id: OdooDisplayRecord | false
  name: string | false
  duration_display: string
  number_of_days?: number
  date_from: string | false
  date_to: string | false
  allocation_type: string
  accrual_plan_id: OdooDisplayRecord | false
  notes: string | false
  message_needaction: boolean
  active_employee: boolean
  state: string
}

type OdooSearchReadResult<T = OdooLeaveRecord> = {
  length?: number
  records?: T[]
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
  numberOfDays: number
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

export type LeaveAllocation = {
  id: number
  employeeName: string
  departmentName: string
  leaveType: string
  name: string
  durationDisplay: string
  numberOfDays: number
  dateFrom: string
  dateTo: string
  allocationType: string
  accrualPlanName: string
  notes: string
  needsAction: boolean
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
  number_of_days: {},
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
  numberOfDays: record.number_of_days ?? 0,
  employeeName: getDisplayName(record.employee_id),
  leaveType: getDisplayName(record.holiday_status_id) || 'Leave Request',
  needsAction: Boolean(record.message_needaction),
  reason: record.name || '',
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
      order: 'date_from DESC',
      limit: 80,
      context: {
        lang: 'en_US',
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Bangkok',
        uid: storedUserId,
        allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
        bin_size: true,
        current_company_id: DEFAULT_COMPANY_ID,
      },
      count_limit: 10001,
      domain: [['user_id', '=', storedUserId]],
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

export const fetchAllEmployeesLeaveRequests = async () => {
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
      order: 'date_from DESC',
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
      domain: [['employee_id.company_id', 'in', DEFAULT_ALLOWED_COMPANY_IDS]],
    },
  })

  if (response.error) {
    throw new Error(
      response.error.data?.message ||
        response.error.message ||
        'Unable to load company-wide leave requests.',
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
      [],
      {
        state: 'confirm',
        employee_id: input.employeeId,
        holiday_status_id: input.leaveTypeId,
        request_date_from: input.requestDateFrom,
        request_date_to: input.requestDateTo,
        request_date_from_period: 'am',
        request_unit_half: input.requestUnitHalf,
        request_unit_hours: false,
        request_hour_from: 0,
        request_hour_to: 0,
        name: input.reason?.trim() || false,
        supported_attachment_ids: [],
      },
    ],
    kwargs: {
      context: {
        lang: 'en_US',
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Bangkok',
        uid: storedUserId,
        allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
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

export const approveLeaveRequest = async (id: number) => {
  return callButtonAction(LEAVE_APPROVE_ENDPOINT, id)
}

export const refuseLeaveRequest = async (id: number) => {
  return callButtonAction(LEAVE_REFUSE_ENDPOINT, id)
}

const callButtonAction = async (endpoint: string, id: number) => {
  const storedUserId = Number(getStoredUserId())

  if (!Number.isFinite(storedUserId) || storedUserId <= 0) {
    throw new Error('Missing user session. Please log in again.')
  }

  const method = endpoint.split('/').pop()

  const response = await postJsonRpc(endpoint, {
    model: 'hr.leave',
    method: method,
    args: [[id]],
    kwargs: {
      context: {
        hide_employee_name: 1,
        lang: 'en_US',
        tz: 'Asia/Bangkok',
        uid: storedUserId,
        allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
      },
    },
  })

  if (response.error) {
    throw new Error(
      response.error.data?.message ||
        response.error.message ||
        `Unable to execute ${method}.`,
    )
  }

  return response.result
}

export const fetchLeaveAllocations = async () => {
  const storedUserId = Number(getStoredUserId())

  if (!Number.isFinite(storedUserId) || storedUserId <= 0) {
    throw new Error('Missing user session. Please log in again.')
  }

  const today = new Date().toISOString().split('T')[0]

  const response = await postJsonRpc<OdooSearchReadResult<OdooAllocationRecord>>(
    LEAVE_ALLOCATION_ENDPOINT,
    {
      model: 'hr.leave.allocation',
      method: 'web_search_read',
      args: [],
      kwargs: {
        specification: allocationSpecification,
        offset: 0,
        order: '',
        limit: 80,
        context: {
          lang: 'en_US',
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Bangkok',
          uid: storedUserId,
          allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
          bin_size: true,
          is_employee_allocation: true,
          current_company_id: DEFAULT_COMPANY_ID,
        },
        count_limit: 10001,
        domain: [
          '&',
          ['employee_id.user_id', '=', storedUserId],
          '&',
          ['date_from', '<=', today],
          '|',
          ['date_to', '=', false],
          ['date_to', '>=', today],
        ],
      },
    },
  )

  if (response.error) {
    throw new Error(
      response.error.data?.message ||
        response.error.message ||
        'Unable to load leave allocations.',
    )
  }

  return (response.result?.records ?? []).map((record) => ({
    id: record.id,
    employeeName: getDisplayName(record.employee_id),
    departmentName: getDisplayName(record.department_id),
    leaveType: getDisplayName(record.holiday_status_id),
    name: record.name || '',
    durationDisplay: record.duration_display || '',
    numberOfDays: record.number_of_days ?? 0,
    dateFrom: record.date_from || '',
    dateTo: record.date_to || '',
    allocationType: record.allocation_type || '',
    accrualPlanName: getDisplayName(record.accrual_plan_id),
    notes: record.notes || '',
    needsAction: Boolean(record.message_needaction),
    state: record.state || '',
  }))
}
