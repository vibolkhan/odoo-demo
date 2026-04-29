import {
  DEFAULT_ALLOWED_COMPANY_IDS,
  DEFAULT_COMPANY_ID,
  getStoredUserId,
  postJsonRpc,
} from '@/utils/auth'

const LEAVE_TYPE_ENDPOINT = '/web/dataset/call_kw/hr.leave.type/name_search'
const LEAVE_TYPE_CATALOG_ENDPOINT =
  '/web/dataset/call_kw/hr.leave.type/web_search_read'
const LEAVE_TYPE_CREATE_ENDPOINT = '/web/dataset/call_kw/hr.leave.type/create'
const LEAVE_TYPE_WRITE_ENDPOINT = '/web/dataset/call_kw/hr.leave.type/write'
const LEAVE_TYPE_DELETE_ENDPOINT = '/web/dataset/call_kw/hr.leave.type/unlink'
const DEFAULT_TZ = 'Asia/Phnom_Penh'
const DEFAULT_DATE_FROM_TIME = '00:30:00'
const DEFAULT_DATE_TO_TIME = '10:30:00'

type OdooNameSearchItem = [number, string]

type OdooNameSearchResult = OdooNameSearchItem[]

export type LeaveTypeOption = {
  id: number
  name: string
}

type OdooLeaveTypeRecord = {
  id: number
  display_name?: string
}

type OdooLeaveTypeSearchReadResult = {
  length?: number
  records?: OdooLeaveTypeRecord[]
}

export type LeaveTypeCatalogItem = {
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

export type FetchLeaveTypeCatalogOptions = {
  limit?: number
  offset?: number
  query?: string
}

export type SaveLeaveTypeInput = {
  name: string
}

const buildOdooDateTime = (
  date: string | undefined,
  fallbackTime: string,
) => `${date || new Date().toISOString().slice(0, 10)} ${fallbackTime}`

const getStoredUid = () => {
  const storedUserId = Number(getStoredUserId())

  if (!Number.isFinite(storedUserId) || storedUserId <= 0) {
    throw new Error('Missing user session. Please log in again.')
  }

  return storedUserId
}

const getLeaveTypeContext = (
  storedUserId: number,
  extraContext: Record<string, unknown> = {},
) => ({
  lang: 'en_US',
  tz: Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TZ,
  uid: storedUserId,
  allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
  ...extraContext,
})

const leaveTypeSpecification = {
  sequence: {},
  display_name: {},
} as const

export const fetchLeaveTypes = async (
  options: FetchLeaveTypesOptions = {},
): Promise<LeaveTypeOption[]> => {
  const storedUserId = getStoredUid()
  const limit = options.limit ?? 200

  const response = await postJsonRpc<OdooLeaveTypeSearchReadResult>(
    LEAVE_TYPE_CATALOG_ENDPOINT,
    {
      model: 'hr.leave.type',
      method: 'web_search_read',
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
        order: 'sequence ASC, id ASC',
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
      },
    },
  )

  if (response.error) {
    throw new Error(
      response.error.data?.message ||
        response.error.message ||
        'Unable to load leave types.',
    )
  }

  return (response.result?.records ?? []).map((record) => ({
    id: record.id,
    name: record.display_name ?? '',
  }))
}

export const fetchLeaveTypeCatalog = async (
  options: FetchLeaveTypeCatalogOptions = {},
): Promise<LeaveTypeCatalogItem[]> => {
  const storedUserId = getStoredUid()
  const query = options.query?.trim() ?? ''
  const limit = options.limit ?? 25
  const offset = options.offset ?? 0

  const domain = query ? [['name', 'ilike', query]] : []

  const response = await postJsonRpc<OdooLeaveTypeSearchReadResult>(
    LEAVE_TYPE_CATALOG_ENDPOINT,
    {
      model: 'hr.leave.type',
      method: 'web_search_read',
      args: [],
      kwargs: {
        specification: leaveTypeSpecification,
        limit,
        offset,
        order: 'sequence ASC, id ASC',
        context: getLeaveTypeContext(storedUserId, {
          bin_size: true,
          current_company_id: DEFAULT_COMPANY_ID,
        }),
        count_limit: 10001,
        domain,
      },
    },
  )

  if (response.error) {
    throw new Error(
      response.error.data?.message ||
        response.error.message ||
        'Unable to load leave types.',
    )
  }

  return (response.result?.records ?? []).map((record) => ({
    id: record.id,
    name: record.display_name ?? '',
  }))
}

const buildLeaveTypePayload = (input: SaveLeaveTypeInput) => ({
  name: input.name.trim(),
})

const getCrudContext = (storedUserId: number) =>
  getLeaveTypeContext(storedUserId, {
    current_company_id: DEFAULT_COMPANY_ID,
  })

export const createLeaveType = async (input: SaveLeaveTypeInput) => {
  const storedUserId = getStoredUid()

  const response = await postJsonRpc<number>(LEAVE_TYPE_CREATE_ENDPOINT, {
    model: 'hr.leave.type',
    method: 'create',
    args: [buildLeaveTypePayload(input)],
    kwargs: {
      context: getCrudContext(storedUserId),
    },
  })

  if (response.error) {
    throw new Error(
      response.error.data?.message ||
        response.error.message ||
        'Unable to create leave type.',
    )
  }

  return response.result
}

export const updateLeaveType = async (
  leaveTypeId: number,
  input: SaveLeaveTypeInput,
) => {
  const storedUserId = getStoredUid()

  const response = await postJsonRpc<boolean>(LEAVE_TYPE_WRITE_ENDPOINT, {
    model: 'hr.leave.type',
    method: 'write',
    args: [[leaveTypeId], buildLeaveTypePayload(input)],
    kwargs: {
      context: getCrudContext(storedUserId),
    },
  })

  if (response.error) {
    throw new Error(
      response.error.data?.message ||
        response.error.message ||
        'Unable to update leave type.',
    )
  }

  return response.result
}

export const deleteLeaveType = async (leaveTypeId: number) => {
  const storedUserId = getStoredUid()

  const response = await postJsonRpc<boolean>(LEAVE_TYPE_DELETE_ENDPOINT, {
    model: 'hr.leave.type',
    method: 'unlink',
    args: [[leaveTypeId]],
    kwargs: {
      context: getCrudContext(storedUserId),
    },
  })

  if (response.error) {
    throw new Error(
      response.error.data?.message ||
        response.error.message ||
        'Unable to delete leave type.',
    )
  }

  return response.result
}
