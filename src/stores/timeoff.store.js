import { defineStore } from "pinia";
import {
  approveLeaveRequest,
  createLeaveType,
  deleteLeaveType,
  fetchCompanyLeaveRequests,
  fetchLeaveAllocations,
  fetchLeaveRequests,
  fetchLeaveTypeCatalog,
  fetchLeaveTypes,
  getLeaveReportCalendar,
  getMandatoryDays,
  getSpecialDaysData,
  getUnusualDays,
  refuseLeaveRequest,
  saveLeaveRequest,
  updateLeaveRequest,
  updateLeaveType,
} from "@/api/timeoff.api";
import { useAuthStore } from "@/stores/auth.store";
import { createAsyncState, runAsync } from "@/utils/async-state";

const createAsyncStates = () => ({
  leaveRequests: createAsyncState(),
  companyLeaveRequests: createAsyncState(),
  leaveAllocations: createAsyncState(),
  leaveTypes: createAsyncState(),
  leaveTypeCatalog: createAsyncState(),
  leaveTypeSave: createAsyncState(),
  leaveTypeDelete: createAsyncState(),
  leaveRequestSubmit: createAsyncState(),
  leaveRequestAction: createAsyncState(),
  calendar: createAsyncState(),
});

const DEFAULT_PAGE_SIZE = 10;

export const useTimeoffStore = defineStore("timeoff", {
  state: () => ({
    leaveRequests: [],
    companyLeaveRequests: [],
    leaveRequestPagination: {
      hasMore: true,
      offset: 0,
    },
    companyLeaveRequestPagination: {
      hasMore: true,
      offset: 0,
    },
    leaveAllocations: [],
    leaveTypes: [],
    leaveTypeCatalog: [],
    calendarData: {
      unusualDays: {},
      calendarLeaves: [],
      mandatoryDays: [],
      specialDays: [],
    },
    asyncStates: createAsyncStates(),
  }),

  getters: {
    loading: (state) => ({
      leaveRequests: state.asyncStates.leaveRequests.status === "loading",
      companyLeaveRequests: state.asyncStates.companyLeaveRequests.status === "loading",
      leaveAllocations: state.asyncStates.leaveAllocations.status === "loading",
      leaveTypes: state.asyncStates.leaveTypes.status === "loading",
      leaveTypeCatalog: state.asyncStates.leaveTypeCatalog.status === "loading",
      leaveTypeSave: state.asyncStates.leaveTypeSave.status === "loading",
      leaveTypeDelete: state.asyncStates.leaveTypeDelete.status === "loading",
      leaveRequestSubmit: state.asyncStates.leaveRequestSubmit.status === "loading",
      leaveRequestAction: state.asyncStates.leaveRequestAction.status === "loading",
      calendar: state.asyncStates.calendar.status === "loading",
    }),
    error: (state) => ({
      leaveRequests: state.asyncStates.leaveRequests.error,
      companyLeaveRequests: state.asyncStates.companyLeaveRequests.error,
      leaveAllocations: state.asyncStates.leaveAllocations.error,
      leaveTypes: state.asyncStates.leaveTypes.error,
      leaveTypeCatalog: state.asyncStates.leaveTypeCatalog.error,
      leaveTypeSave: state.asyncStates.leaveTypeSave.error,
      leaveTypeDelete: state.asyncStates.leaveTypeDelete.error,
      leaveRequestSubmit: state.asyncStates.leaveRequestSubmit.error,
      leaveRequestAction: state.asyncStates.leaveRequestAction.error,
      calendar: state.asyncStates.calendar.error,
    }),
    totalEntitlement: (state) => {
      return (state.leaveAllocations || [])
        .filter((a) => a.state === "validate")
        .reduce((sum, a) => sum + (a.numberOfDays || 0), 0);
    },
    totalTaken: (state) => {
      return (state.leaveRequests || [])
        .filter((r) => r.state !== "refuse" && r.state !== "cancel")
        .reduce((sum, r) => sum + (r.numberOfDays || 0), 0);
    },
    totalRemaining: (state) => {
      return Math.max(0, state.totalEntitlement - state.totalTaken);
    },
    usagePercentage: (state) => {
      if (state.totalEntitlement === 0) return 0;
      return Math.round((state.totalRemaining / state.totalEntitlement) * 100);
    },
    balances: (state) => {
      return (state.leaveAllocations || []).map((alloc) => {
        const allocated = alloc.numberOfDays || 0;

        const taken = (state.leaveRequests || [])
          .filter(
            (r) =>
              r.leaveType === alloc.leaveType &&
              r.state !== "refuse" &&
              r.state !== "cancel"
          )
          .reduce((sum, r) => sum + (r.numberOfDays || 0), 0);

        const remaining = Math.max(0, allocated - taken);

        return {
          id: alloc.id,
          name: alloc.leaveType || alloc.name || "Allocation",
          entitlement: allocated,
          taken: taken,
          available: remaining,
          dateTo: alloc.dateTo,
          state: alloc.state,
        };
      });
    },
  },

  actions: {
    getRequiredUserId() {
      const authStore = useAuthStore();
      const userId = Number(authStore.userId);

      if (!Number.isFinite(userId) || userId <= 0) {
        throw new Error("Missing user session. Please log in again.");
      }

      return userId;
    },

    resetState() {
      this.leaveRequests = [];
      this.companyLeaveRequests = [];
      this.leaveRequestPagination = {
        hasMore: true,
        offset: 0,
      };
      this.companyLeaveRequestPagination = {
        hasMore: true,
        offset: 0,
      };
      this.leaveAllocations = [];
      this.leaveTypes = [];
      this.leaveTypeCatalog = [];
      this.calendarData = {
        unusualDays: {},
        calendarLeaves: [],
        mandatoryDays: [],
        specialDays: [],
      };
      this.asyncStates = createAsyncStates();
    },

    async fetchLeaveRequests(options = {}, reset = true) {
      return runAsync(this.asyncStates.leaveRequests, async () => {
        const limit = options.limit ?? DEFAULT_PAGE_SIZE;
        const offset = reset ? 0 : options.offset ?? this.leaveRequests.length;

        try {
          const records = await fetchLeaveRequests(this.getRequiredUserId(), {
            ...options,
            limit,
            offset,
          });
          this.leaveRequests = reset ? records : [...this.leaveRequests, ...records];
          this.leaveRequestPagination = {
            hasMore: records.length === limit,
            offset: offset + records.length,
          };
          return records;
        } catch (error) {
          if (reset) {
            this.leaveRequests = [];
            this.leaveRequestPagination = {
              hasMore: true,
              offset: 0,
            };
          }
          throw error;
        }
      });
    },

    async fetchCompanyLeaveRequests(options = {}, reset = true) {
      return runAsync(this.asyncStates.companyLeaveRequests, async () => {
        const limit = options.limit ?? DEFAULT_PAGE_SIZE;
        const offset = reset
          ? 0
          : options.offset ?? this.companyLeaveRequests.length;

        try {
          const records = await fetchCompanyLeaveRequests(this.getRequiredUserId(), {
            ...options,
            limit,
            offset,
          });
          this.companyLeaveRequests = reset
            ? records
            : [...this.companyLeaveRequests, ...records];
          this.companyLeaveRequestPagination = {
            hasMore: records.length === limit,
            offset: offset + records.length,
          };
          return records;
        } catch (error) {
          if (reset) {
            this.companyLeaveRequests = [];
            this.companyLeaveRequestPagination = {
              hasMore: true,
              offset: 0,
            };
          }
          throw error;
        }
      });
    },

    async fetchLeaveAllocations() {
      return runAsync(this.asyncStates.leaveAllocations, async () => {
        try {
          const records = await fetchLeaveAllocations(this.getRequiredUserId());
          this.leaveAllocations = records;
          return records;
        } catch (error) {
          this.leaveAllocations = [];
          throw error;
        }
      });
    },

    async fetchLeaveTypes(options = {}) {
      return runAsync(this.asyncStates.leaveTypes, async () => {
        try {
          const records = await fetchLeaveTypes(this.getRequiredUserId(), options);
          this.leaveTypes = records;
          return records;
        } catch (error) {
          this.leaveTypes = [];
          throw error;
        }
      });
    },

    async fetchLeaveTypeCatalog(options = {}, reset = true) {
      return runAsync(this.asyncStates.leaveTypeCatalog, async () => {
        try {
          const records = await fetchLeaveTypeCatalog(this.getRequiredUserId(), options);
          this.leaveTypeCatalog = reset
            ? records
            : [...this.leaveTypeCatalog, ...records];
          return records;
        } catch (error) {
          if (reset) {
            this.leaveTypeCatalog = [];
          }
          throw error;
        }
      });
    },

    async createLeaveType(input) {
      return runAsync(this.asyncStates.leaveTypeSave, async () => {
        return await createLeaveType(this.getRequiredUserId(), input);
      });
    },

    async updateLeaveType(leaveTypeId, input) {
      return runAsync(this.asyncStates.leaveTypeSave, async () => {
        return await updateLeaveType(this.getRequiredUserId(), leaveTypeId, input);
      });
    },

    async deleteLeaveType(leaveTypeId) {
      return runAsync(this.asyncStates.leaveTypeDelete, async () => {
        return await deleteLeaveType(this.getRequiredUserId(), leaveTypeId);
      });
    },

    async saveLeaveRequest(input) {
      return runAsync(this.asyncStates.leaveRequestSubmit, async () => {
        const result = await saveLeaveRequest(this.getRequiredUserId(), input);
        await this.fetchLeaveRequests();
        return result;
      });
    },

    async updateLeaveRequest(id, input) {
      return runAsync(this.asyncStates.leaveRequestSubmit, async () => {
        const result = await updateLeaveRequest(this.getRequiredUserId(), id, input);
        await this.fetchLeaveRequests();
        return result;
      });
    },

    async approveLeaveRequest(id) {
      return runAsync(this.asyncStates.leaveRequestAction, async () => {
        const result = await approveLeaveRequest(this.getRequiredUserId(), id);
        await Promise.allSettled([
          this.fetchLeaveRequests(),
          this.fetchCompanyLeaveRequests(),
        ]);
        return result;
      });
    },

    async refuseLeaveRequest(id) {
      return runAsync(this.asyncStates.leaveRequestAction, async () => {
        const result = await refuseLeaveRequest(this.getRequiredUserId(), id);
        await Promise.allSettled([
          this.fetchLeaveRequests(),
          this.fetchCompanyLeaveRequests(),
        ]);
        return result;
      });
    },

    async fetchCalendarData({ startStr, endStr, startStrShort, endStrShort }) {
      return runAsync(this.asyncStates.calendar, async () => {
        try {
          const userId = this.getRequiredUserId();
          const results = await Promise.allSettled([
            getUnusualDays(userId, startStr, endStr),
            getLeaveReportCalendar(userId, startStr, endStr),
            fetchLeaveRequests(userId),
            getMandatoryDays(userId, startStrShort, endStrShort),
            getSpecialDaysData(userId, startStrShort, endStrShort),
          ]);

          this.calendarData = {
            unusualDays:
              results[0].status === "fulfilled" ? results[0].value || {} : {},
            calendarLeaves:
              results[1].status === "fulfilled" && Array.isArray(results[1].value)
                ? results[1].value
                : [],
            mandatoryDays:
              results[3].status === "fulfilled" && Array.isArray(results[3].value)
                ? results[3].value
                : [],
            specialDays:
              results[4].status === "fulfilled" ? results[4].value || [] : [],
          };

          if (results[2].status === "fulfilled") {
            this.leaveRequests = Array.isArray(results[2].value)
              ? results[2].value
              : [];
          }

          return this.calendarData;
        } catch (error) {
          this.calendarData = {
            unusualDays: {},
            calendarLeaves: [],
            mandatoryDays: [],
            specialDays: [],
          };
          throw error;
        }
      });
    },
  },
});
