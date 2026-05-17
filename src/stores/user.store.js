import { defineStore } from "pinia";
import {
  fetchAllAttendances,
  fetchAttendanceDetail,
  fetchAttendanceUserData,
  fetchCurrentUserEmployee,
  fetchEmployees,
  fetchMyAttendances,
  toggleAttendanceState,
} from "@/api/user.api";
import { useAuthStore } from "@/stores/auth.store";
import { createAsyncState, runAsync } from "@/utils/async-state";

/**
 * @typedef {Object} NormalizedEmployee
 * @property {number} id
 * @property {string} name
 * @property {string} company
 * @property {string} department
 * @property {'checked_in' | 'checked_out'} attendanceState
 * @property {string | null} lastCheckIn ISO date string or null
 */

const createAsyncStates = () => ({
  currentEmployee: createAsyncState(),
  employees: createAsyncState(),
  myAttendances: createAsyncState(),
  allAttendances: createAsyncState(),
  attendanceDetail: createAsyncState(),
  attendanceToggle: createAsyncState(),
});

const DEFAULT_PAGE_SIZE = 10;

export const useUserStore = defineStore("user", {
  state: () => ({
    /** @type {NormalizedEmployee | null} */
    currentEmployee: null,
    /** @type {NormalizedEmployee[]} */
    employees: [],
    employeePagination: {
      hasMore: true,
      offset: 0,
    },
    myAttendances: [],
    allAttendances: [],
    myAttendancePagination: {
      hasMore: true,
      offset: 0,
    },
    allAttendancePagination: {
      hasMore: true,
      offset: 0,
    },
    attendanceDetail: null,
    isManager: true,
    asyncStates: createAsyncStates(),
  }),

  getters: {
    // Helper to get loading state of specific features
    loading: (state) => ({
      currentEmployee: state.asyncStates.currentEmployee.status === "loading",
      employees: state.asyncStates.employees.status === "loading",
      myAttendances: state.asyncStates.myAttendances.status === "loading",
      allAttendances: state.asyncStates.allAttendances.status === "loading",
      attendanceDetail: state.asyncStates.attendanceDetail.status === "loading",
      attendanceToggle: state.asyncStates.attendanceToggle.status === "loading",
    }),
    // Helper to get error state of specific features
    error: (state) => ({
      currentEmployee: state.asyncStates.currentEmployee.error,
      employees: state.asyncStates.employees.error,
      myAttendances: state.asyncStates.myAttendances.error,
      allAttendances: state.asyncStates.allAttendances.error,
      attendanceDetail: state.asyncStates.attendanceDetail.error,
      attendanceToggle: state.asyncStates.attendanceToggle.error,
    }),
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

    /**
     * Centralized normalization for employee data.
     * Ensures consistent shape across the app, merging data from hr.employee
     * and specialized attendance endpoints.
     */
    _normalizeEmployee(employee, attendanceSupplement = null) {
      if (!employee) return null;

      return {
        ...employee,
        // Prioritize supplement data (usually fresher) over base employee record
        attendanceState:
          attendanceSupplement?.attendance_state ||
          employee.attendanceState ||
          "checked_out",
        lastCheckIn:
          attendanceSupplement?.last_check_in ||
          employee.lastCheckIn ||
          null,
      };
    },

    resetState() {
      this.currentEmployee = null;
      this.employees = [];
      this.employeePagination = {
        hasMore: true,
        offset: 0,
      };
      this.myAttendances = [];
      this.allAttendances = [];
      this.myAttendancePagination = {
        hasMore: true,
        offset: 0,
      };
      this.allAttendancePagination = {
        hasMore: true,
        offset: 0,
      };
      this.attendanceDetail = null;
      this.isManager = true;
      this.asyncStates = createAsyncStates();
    },

    async fetchCurrentEmployee(options = {}) {
      if (
        this.asyncStates.currentEmployee.status === "loading" &&
        !options.force
      ) {
        return this.currentEmployee;
      }

      return runAsync(this.asyncStates.currentEmployee, async () => {
        // Fetch base employee record
        const employee = await fetchCurrentUserEmployee(this.getRequiredUserId());
        
        if (!employee) {
          this.currentEmployee = null;
          return null;
        }

        // Try to supplement with fresh attendance data
        // We do this in parallel or sequence, but handle failure gracefully
        try {
          const attendanceData = await fetchAttendanceUserData(this.getRequiredUserId());
          this.currentEmployee = this._normalizeEmployee(employee, attendanceData);
        } catch (error) {
          console.warn("Could not fetch fresh attendance supplement:", error);
          // Fallback to base employee data only
          this.currentEmployee = this._normalizeEmployee(employee);
        }

        return this.currentEmployee;
      });
    },

    async fetchEmployees(options = {}) {
      return runAsync(this.asyncStates.employees, async () => {
        try {
          const result = await fetchEmployees(this.getRequiredUserId(), options);
          this.employees = result.records;
          this.employeePagination = {
            hasMore: result.hasMore,
            offset: (options.offset ?? 0) + result.records.length,
          };
          return result;
        } catch (error) {
          if ((options.offset ?? 0) === 0) {
            this.employees = [];
          }
          throw error;
        }
      });
    },

    async fetchMyAttendances(options = {}, reset = true) {
      return runAsync(this.asyncStates.myAttendances, async () => {
        const limit = options.limit ?? DEFAULT_PAGE_SIZE;
        const offset = reset ? 0 : options.offset ?? this.myAttendances.length;

        try {
          const records = await fetchMyAttendances(this.getRequiredUserId(), {
            ...options,
            limit,
            offset,
          });
          this.myAttendances = reset
            ? records
            : [...this.myAttendances, ...records];
          this.myAttendancePagination = {
            hasMore: records.length === limit,
            offset: offset + records.length,
          };
          return records;
        } catch (error) {
          if (reset) {
            this.myAttendances = [];
            this.myAttendancePagination = {
              hasMore: true,
              offset: 0,
            };
          }
          throw error;
        }
      });
    },

    async fetchAllAttendances(domain = [], options = {}, reset = true) {
      return runAsync(this.asyncStates.allAttendances, async () => {
        const limit = options.limit ?? DEFAULT_PAGE_SIZE;
        const offset = reset ? 0 : options.offset ?? this.allAttendances.length;

        try {
          const records = await fetchAllAttendances(
            this.getRequiredUserId(),
            domain,
            {
              ...options,
              limit,
              offset,
            },
          );
          this.allAttendances = reset
            ? records
            : [...this.allAttendances, ...records];
          this.allAttendancePagination = {
            hasMore: records.length === limit,
            offset: offset + records.length,
          };
          return records;
        } catch (error) {
          if (reset) {
            this.allAttendances = [];
            this.allAttendancePagination = {
              hasMore: true,
              offset: 0,
            };
          }
          throw error;
        }
      });
    },

    async fetchAttendanceDetail(id) {
      return runAsync(this.asyncStates.attendanceDetail, async () => {
        try {
          const detail = await fetchAttendanceDetail(this.getRequiredUserId(), id);
          this.attendanceDetail = detail;
          return detail;
        } catch (error) {
          this.attendanceDetail = null;
          throw error;
        }
      });
    },

    async fetchAttendanceUserData() {
      try {
        const data = await fetchAttendanceUserData(this.getRequiredUserId());
        if (this.currentEmployee) {
          this.currentEmployee = this._normalizeEmployee(
            this.currentEmployee,
            data,
          );
        }
        return data;
      } catch (error) {
        console.error("Failed to fetch attendance user data:", error);
        throw error;
      }
    },

    async toggleAttendance(latitude, longitude) {
      return runAsync(this.asyncStates.attendanceToggle, async () => {
        const result = await toggleAttendanceState(
          this.getRequiredUserId(),
          latitude,
          longitude,
        );

        // Always refresh supplemental data after a toggle
        try {
          await this.fetchAttendanceUserData();
        } catch (error) {
          console.warn("Toggle succeeded but supplement refresh failed:", error);
        }

        return result;
      });
    },
  },
});
