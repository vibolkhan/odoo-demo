import { postJsonRpc, getStoredUserId, DEFAULT_ALLOWED_COMPANY_IDS } from './auth'

const CALL_KW_ENDPOINT = '/web/dataset/call_kw/'

export const getUnusualDays = async (start: string, end: string) => {
  const storedUid = getStoredUserId()
  const userId = storedUid ? parseInt(storedUid) : null
  
  const response = await postJsonRpc(`${CALL_KW_ENDPOINT}hr.leave.report.calendar/get_unusual_days`, {
    model: 'hr.leave.report.calendar',
    method: 'get_unusual_days',
    args: [start, end],
    kwargs: {
      context: {
        lang: 'en_US',
        tz: 'Asia/Bangkok',
        uid: userId,
        allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
        employee_id: null
      }
    }
  })

  if (response.error) {
    throw new Error(response.error.data?.message || response.error.message)
  }

  return response.result
}

export const getLeaveReportCalendar = async (start: string, end: string) => {
  const storedUid = getStoredUserId()
  const userId = storedUid ? parseInt(storedUid) : null

  const response = await postJsonRpc(`${CALL_KW_ENDPOINT}hr.leave.report.calendar/search_read`, {
    model: 'hr.leave.report.calendar',
    method: 'search_read',
    args: [],
    kwargs: {
      context: {
        lang: 'en_US',
        tz: 'Asia/Bangkok',
        uid: userId,
        allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
        short_name: 1
      },
      domain: [
        '&',
        ['employee_id.active', '=', true],
        '|',
        ['employee_id.user_id', '=', userId],
        ['employee_id.parent_id.user_id', '=', userId],
        ['start_datetime', '<=', end],
        ['stop_datetime', '>=', start],
        ['state', '!=', 'cancel']
      ],
      fields: [
        'display_name',
        'start_datetime',
        'stop_datetime',
        'employee_id',
        'name',
        'is_hatched',
        'state',
        'leave_manager_id'
      ]
    }
  })

  if (response.error) {
    throw new Error(response.error.data?.message || response.error.message)
  }

  return response.result as any[]
}

export const getMandatoryDays = async (start: string, end: string) => {
  const storedUid = getStoredUserId()
  const userId = storedUid ? parseInt(storedUid) : null

  const response = await postJsonRpc(`${CALL_KW_ENDPOINT}hr.employee/get_mandatory_days`, {
    model: 'hr.employee',
    method: 'get_mandatory_days',
    args: [null, start, end],
    kwargs: {
      context: {
        lang: 'en_US',
        tz: 'Asia/Bangkok',
        uid: userId,
        allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS
      }
    }
  })

  if (response.error) {
    throw new Error(response.error.data?.message || response.error.message)
  }

  return response.result
}

export const getSpecialDaysData = async (start: string, end: string) => {
  const storedUid = getStoredUserId()
  const userId = storedUid ? parseInt(storedUid) : null

  const response = await postJsonRpc(`${CALL_KW_ENDPOINT}hr.employee/get_special_days_data`, {
    model: 'hr.employee',
    method: 'get_special_days_data',
    args: [start, end],
    kwargs: {
      context: {
        lang: 'en_US',
        tz: 'Asia/Bangkok',
        uid: userId,
        allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
        employee_id: null
      }
    }
  })

  if (response.error) {
    throw new Error(response.error.data?.message || response.error.message)
  }

  return response.result
}
