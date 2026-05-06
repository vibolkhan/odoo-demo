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

const createLoadingState = () => ({
  currentEmployee: false,
  employees: false,
  myAttendances: false,
  allAttendances: false,
  attendanceDetail: false,
  attendanceToggle: false,
});

const createErrorState = () => ({
  currentEmployee: "",
  employees: "",
  myAttendances: "",
  allAttendances: "",
  attendanceDetail: "",
  attendanceToggle: "",
});

export const useUserStore = defineStore("user", {
  state: () => ({
    currentEmployee: null,
    employees: [],
    employeePagination: {
      hasMore: true,
      offset: 0,
    },
    myAttendances: [],
    allAttendances: [],
    attendanceDetail: null,
    isManager: true,
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
      this.currentEmployee = null;
      this.employees = [];
      this.employeePagination = {
        hasMore: true,
        offset: 0,
      };
      this.myAttendances = [];
      this.allAttendances = [];
      this.attendanceDetail = null;
      this.isManager = true;
      this.loading = createLoadingState();
      this.error = createErrorState();
    },

    async fetchCurrentEmployee(options = {}) {
      if (this.loading.currentEmployee && !options.force) {
        return this.currentEmployee;
      }

      this.setLoading("currentEmployee", true);
      this.setError("currentEmployee", "");

      try {
        const employee = await fetchCurrentUserEmployee(this.getRequiredUserId());
        this.currentEmployee = employee;
        
        // Supplement with fresh attendance data from the new endpoint
        if (employee) {
          await this.fetchAttendanceUserData();
        }
        
        return this.currentEmployee;
      } catch (error) {
        this.currentEmployee = null;
        this.setError(
          "currentEmployee",
          error instanceof Error ? error.message : "Unable to load profile.",
        );
        throw error;
      } finally {
        this.setLoading("currentEmployee", false);
      }
    },

    async fetchEmployees(options = {}) {
      this.setLoading("employees", true);
      this.setError("employees", "");

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
        this.setError(
          "employees",
          error instanceof Error ? error.message : "Unable to load employees.",
        );
        throw error;
      } finally {
        this.setLoading("employees", false);
      }
    },


    async fetchMyAttendances() {
      this.setLoading("myAttendances", true);
      this.setError("myAttendances", "");

      try {
        const records = await fetchMyAttendances(this.getRequiredUserId());
        this.myAttendances = records;
        return records;
      } catch (error) {
        this.myAttendances = [];
        this.setError(
          "myAttendances",
          error instanceof Error
            ? error.message
            : "Unable to load attendance records.",
        );
        throw error;
      } finally {
        this.setLoading("myAttendances", false);
      }
    },

    async fetchAllAttendances(domain = []) {
      this.setLoading("allAttendances", true);
      this.setError("allAttendances", "");

      try {
        const records = await fetchAllAttendances(this.getRequiredUserId(), domain);
        this.allAttendances = records;
        return records;
      } catch (error) {
        this.allAttendances = [];
        this.setError(
          "allAttendances",
          error instanceof Error
            ? error.message
            : "Unable to load attendance records.",
        );
        throw error;
      } finally {
        this.setLoading("allAttendances", false);
      }
    },

    async fetchAttendanceDetail(id) {
      this.setLoading("attendanceDetail", true);
      this.setError("attendanceDetail", "");

      try {
        const detail = await fetchAttendanceDetail(this.getRequiredUserId(), id);
        this.attendanceDetail = detail;
        return detail;
      } catch (error) {
        this.attendanceDetail = null;
        this.setError(
          "attendanceDetail",
          error instanceof Error
            ? error.message
            : "Unable to load attendance details.",
        );
        throw error;
      } finally {
        this.setLoading("attendanceDetail", false);
      }
    },

    async fetchAttendanceUserData() {
      try {
        const data = await fetchAttendanceUserData(this.getRequiredUserId());
        if (this.currentEmployee && data) {
          this.currentEmployee = {
            ...this.currentEmployee,
            attendanceState: data.attendance_state,
            lastCheckIn: data.last_check_in,
          };
        }
        return data;
      } catch (error) {
        console.error("Failed to fetch attendance user data:", error);
        throw error;
      }
    },

    async toggleAttendance(latitude, longitude) {
      this.setLoading("attendanceToggle", true);
      this.setError("attendanceToggle", "");

      try {
        const result = await toggleAttendanceState(
          this.getRequiredUserId(),
          latitude,
          longitude,
        );
        await this.fetchAttendanceUserData();
        return result;
      } catch (error) {
        this.setError(
          "attendanceToggle",
          error instanceof Error
            ? error.message
            : "Unable to toggle attendance.",
        );
        throw error;
      } finally {
        this.setLoading("attendanceToggle", false);
      }
    },
  },
});
