import {
  DEFAULT_ALLOWED_COMPANY_IDS,
  getStoredUserId,
  postJsonRpc,
} from '@/utils/auth'

const LEAVE_TYPE_ENDPOINT = '/web/dataset/call_kw/hr.leave.type/name_search'
const DEFAULT_TZ = 'Asia/Phnom_Penh'
const DEFAULT_DATE_FROM_TIME = '00:30:00'
const DEFAULT_DATE_TO_TIME = '10:30:00'

type OdooNameSearchItem = [number, string]

type OdooNameSearchResult = OdooNameSearchItem[]

export type LeaveTypeOption = {
  id: number
  name: string
}

export type FetchLeaveTypesOptions = {
  employeeId?: number | false
  dateFrom?: string
  dateTo?: string
  limit?: number
  query?: string
}

const buildOdooDateTime = (
  date: string | undefined,
  fallbackTime: string,
) => `${date || new Date().toISOString().slice(0, 10)} ${fallbackTime}`

export const fetchLeaveTypes = async (
  options: FetchLeaveTypesOptions = {},
): Promise<LeaveTypeOption[]> => {
  const storedUserId = Number(getStoredUserId())
  const query = options.query?.trim() ?? ''
  const limit = options.limit ?? 8

  if (!Number.isFinite(storedUserId) || storedUserId <= 0) {
    throw new Error('Missing user session. Please log in again.')
  }

  const response = await postJsonRpc<OdooNameSearchResult>(LEAVE_TYPE_ENDPOINT, {
    model: 'hr.leave.type',
    method: 'name_search',
    args: [],
    kwargs: {
      name: query,
      operator: 'ilike',
      args: [
        '|',
        ['requires_allocation', '=', 'no'],
        '&',
        ['has_valid_allocation', '=', true],
        '|',
        ['allows_negative', '=', true],
        '&',
        ['virtual_remaining_leaves', '>', 0],
        ['allows_negative', '=', false],
      ],
      limit,
      context: {
        lang: 'en_US',
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TZ,
        uid: storedUserId,
        allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
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
      },
    },
  })

  if (response.error) {
    throw new Error(
      response.error.data?.message ||
        response.error.message ||
        'Unable to load leave types.',
    )
  }

  return (response.result ?? []).map(([id, name]) => ({
    id,
    name,
  }))
}
