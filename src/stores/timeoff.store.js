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

const createLoadingState = () => ({
  leaveRequests: false,
  companyLeaveRequests: false,
  leaveAllocations: false,
  leaveTypes: false,
  leaveTypeCatalog: false,
  leaveTypeSave: false,
  leaveTypeDelete: false,
  leaveRequestSubmit: false,
  leaveRequestAction: false,
  calendar: false,
});

const createErrorState = () => ({
  leaveRequests: "",
  companyLeaveRequests: "",
  leaveAllocations: "",
  leaveTypes: "",
  leaveTypeCatalog: "",
  leaveTypeSave: "",
  leaveTypeDelete: "",
  leaveRequestSubmit: "",
  leaveRequestAction: "",
  calendar: "",
});

export const useTimeoffStore = defineStore("timeoff", {
  state: () => ({
    leaveRequests: [],
    companyLeaveRequests: [],
    leaveAllocations: [],
    leaveTypes: [],
    leaveTypeCatalog: [],
    calendarData: {
      unusualDays: {},
      calendarLeaves: [],
      mandatoryDays: [],
      specialDays: [],
    },
    loading: createLoadingState(),
    error: createErrorState(),
  }),

  actions: {
    getRequiredUserId() {
      const authStore = useAuthStore();
      const userId = Number(authStore.userId);

      if (!Number.isFinite(userId) || userId <= 0) {
        throw new Error("Missing user session. Please log in again.");
      }

      return userId;
    },

    setLoading(key, value) {
      this.loading[key] = value;
    },

    setError(key, value) {
      this.error[key] = value;
    },

    resetState() {
      this.leaveRequests = [];
      this.companyLeaveRequests = [];
      this.leaveAllocations = [];
      this.leaveTypes = [];
      this.leaveTypeCatalog = [];
      this.calendarData = {
        unusualDays: {},
        calendarLeaves: [],
        mandatoryDays: [],
        specialDays: [],
      };
      this.loading = createLoadingState();
      this.error = createErrorState();
    },

    async fetchLeaveRequests() {
      this.setLoading("leaveRequests", true);
      this.setError("leaveRequests", "");

      try {
        const records = await fetchLeaveRequests(this.getRequiredUserId());
        this.leaveRequests = records;
        return records;
      } catch (error) {
        this.leaveRequests = [];
        this.setError(
          "leaveRequests",
          error instanceof Error ? error.message : "Unable to load leave requests.",
        );
        throw error;
      } finally {
        this.setLoading("leaveRequests", false);
      }
    },

    async fetchCompanyLeaveRequests() {
      this.setLoading("companyLeaveRequests", true);
      this.setError("companyLeaveRequests", "");

      try {
        const records = await fetchCompanyLeaveRequests(this.getRequiredUserId());
        this.companyLeaveRequests = records;
        return records;
      } catch (error) {
        this.companyLeaveRequests = [];
        this.setError(
          "companyLeaveRequests",
          error instanceof Error
            ? error.message
            : "Unable to load leave requests.",
        );
        throw error;
      } finally {
        this.setLoading("companyLeaveRequests", false);
      }
    },

    async fetchLeaveAllocations() {
      this.setLoading("leaveAllocations", true);
      this.setError("leaveAllocations", "");

      try {
        const records = await fetchLeaveAllocations(this.getRequiredUserId());
        this.leaveAllocations = records;
        return records;
      } catch (error) {
        this.leaveAllocations = [];
        this.setError(
          "leaveAllocations",
          error instanceof Error
            ? error.message
            : "Unable to load leave allocations.",
        );
        throw error;
      } finally {
        this.setLoading("leaveAllocations", false);
      }
    },

    async fetchLeaveTypes(options = {}) {
      this.setLoading("leaveTypes", true);
      this.setError("leaveTypes", "");

      try {
        const records = await fetchLeaveTypes(this.getRequiredUserId(), options);
        this.leaveTypes = records;
        return records;
      } catch (error) {
        this.leaveTypes = [];
        this.setError(
          "leaveTypes",
          error instanceof Error ? error.message : "Unable to load leave types.",
        );
        throw error;
      } finally {
        this.setLoading("leaveTypes", false);
      }
    },

    async fetchLeaveTypeCatalog(options = {}, reset = true) {
      this.setLoading("leaveTypeCatalog", true);
      this.setError("leaveTypeCatalog", "");

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
        this.setError(
          "leaveTypeCatalog",
          error instanceof Error ? error.message : "Unable to load leave types.",
        );
        throw error;
      } finally {
        this.setLoading("leaveTypeCatalog", false);
      }
    },

    async createLeaveType(input) {
      this.setLoading("leaveTypeSave", true);
      this.setError("leaveTypeSave", "");

      try {
        return await createLeaveType(this.getRequiredUserId(), input);
      } catch (error) {
        this.setError(
          "leaveTypeSave",
          error instanceof Error ? error.message : "Unable to create leave type.",
        );
        throw error;
      } finally {
        this.setLoading("leaveTypeSave", false);
      }
    },

    async updateLeaveType(leaveTypeId, input) {
      this.setLoading("leaveTypeSave", true);
      this.setError("leaveTypeSave", "");

      try {
        return await updateLeaveType(this.getRequiredUserId(), leaveTypeId, input);
      } catch (error) {
        this.setError(
          "leaveTypeSave",
          error instanceof Error ? error.message : "Unable to update leave type.",
        );
        throw error;
      } finally {
        this.setLoading("leaveTypeSave", false);
      }
    },

    async deleteLeaveType(leaveTypeId) {
      this.setLoading("leaveTypeDelete", true);
      this.setError("leaveTypeDelete", "");

      try {
        return await deleteLeaveType(this.getRequiredUserId(), leaveTypeId);
      } catch (error) {
        this.setError(
          "leaveTypeDelete",
          error instanceof Error ? error.message : "Unable to delete leave type.",
        );
        throw error;
      } finally {
        this.setLoading("leaveTypeDelete", false);
      }
    },

    async saveLeaveRequest(input) {
      this.setLoading("leaveRequestSubmit", true);
      this.setError("leaveRequestSubmit", "");

      try {
        const result = await saveLeaveRequest(this.getRequiredUserId(), input);
        await this.fetchLeaveRequests();
        return result;
      } catch (error) {
        this.setError(
          "leaveRequestSubmit",
          error instanceof Error
            ? error.message
            : "Unable to submit leave request.",
        );
        throw error;
      } finally {
        this.setLoading("leaveRequestSubmit", false);
      }
    },

    async updateLeaveRequest(id, input) {
      this.setLoading("leaveRequestSubmit", true);
      this.setError("leaveRequestSubmit", "");

      try {
        const result = await updateLeaveRequest(this.getRequiredUserId(), id, input);
        await this.fetchLeaveRequests();
        return result;
      } catch (error) {
        this.setError(
          "leaveRequestSubmit",
          error instanceof Error
            ? error.message
            : "Unable to update leave request.",
        );
        throw error;
      } finally {
        this.setLoading("leaveRequestSubmit", false);
      }
    },

    async approveLeaveRequest(id) {
      this.setLoading("leaveRequestAction", true);
      this.setError("leaveRequestAction", "");

      try {
        const result = await approveLeaveRequest(this.getRequiredUserId(), id);
        await Promise.allSettled([
          this.fetchLeaveRequests(),
          this.fetchCompanyLeaveRequests(),
        ]);
        return result;
      } catch (error) {
        this.setError(
          "leaveRequestAction",
          error instanceof Error ? error.message : "Unable to approve request.",
        );
        throw error;
      } finally {
        this.setLoading("leaveRequestAction", false);
      }
    },

    async refuseLeaveRequest(id) {
      this.setLoading("leaveRequestAction", true);
      this.setError("leaveRequestAction", "");

      try {
        const result = await refuseLeaveRequest(this.getRequiredUserId(), id);
        await Promise.allSettled([
          this.fetchLeaveRequests(),
          this.fetchCompanyLeaveRequests(),
        ]);
        return result;
      } catch (error) {
        this.setError(
          "leaveRequestAction",
          error instanceof Error ? error.message : "Unable to refuse request.",
        );
        throw error;
      } finally {
        this.setLoading("leaveRequestAction", false);
      }
    },

    async fetchCalendarData({ startStr, endStr, startStrShort, endStrShort }) {
      this.setLoading("calendar", true);
      this.setError("calendar", "");

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
        this.setError(
          "calendar",
          error instanceof Error ? error.message : "Unable to load calendar.",
        );
        throw error;
      } finally {
        this.setLoading("calendar", false);
      }
    },
  },
});
