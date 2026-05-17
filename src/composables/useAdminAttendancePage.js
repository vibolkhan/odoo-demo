import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { modalController } from "@ionic/vue";
import AttendanceDetailModal from "@/components/attendance/AttendanceDetailModal.vue";
import { useAuthStore } from "@/stores/auth.store";
import { useUserStore } from "@/stores/user.store";
import { useNotification } from "@/composables/useNotification";
import { useEmployeePicker } from "@/composables/useEmployeePicker";

const PAGE_SIZE = 10;

export function useAdminAttendancePage() {
  const authStore = useAuthStore();
  const userStore = useUserStore();
  const { allAttendances: records } = storeToRefs(userStore);
  const { showToast } = useNotification();
  const employeePicker = useEmployeePicker(userStore);

  const isLoadingMore = ref(false);
  const infiniteScrollKey = ref(0);
  const showFilters = ref(false);
  const dateFrom = ref("");
  const dateTo = ref("");
  const isMyTeam = ref(false);

  const totalWorkedHours = computed(() =>
    records.value.reduce((sum, record) => sum + (record.worked_hours || 0), 0),
  );

  const totalOvertimeHours = computed(() =>
    records.value.reduce((sum, record) => sum + (record.overtime_hours || 0), 0),
  );

  const attendanceState = computed(() => {
    if (
      isLoadingMore.value &&
      userStore.asyncStates.allAttendances.status === "loading"
    ) {
      return { status: "success" };
    }

    return userStore.asyncStates.allAttendances;
  });

  const toggleFilters = () => {
    showFilters.value = !showFilters.value;
  };

  const buildAttendanceDomain = () => {
    const uid = Number(authStore.userId);
    const domain = [["employee_id.active", "=", true]];

    if (employeePicker.selectedEmployees.value.length > 0) {
      domain.push([
        "employee_id",
        "in",
        employeePicker.selectedEmployees.value.map((employee) => employee.id),
      ]);
    }

    if (isMyTeam.value) {
      domain.push(["employee_id.parent_id.user_id", "=", uid]);
    }

    if (dateFrom.value) {
      domain.push(["check_in", ">=", `${dateFrom.value} 00:00:00`]);
    }

    if (dateTo.value) {
      domain.push(["check_in", "<=", `${dateTo.value} 23:59:59`]);
    }

    return domain;
  };

  const fetchAttendances = async () => {
    try {
      await userStore.fetchAllAttendances(
        buildAttendanceDomain(),
        { limit: PAGE_SIZE },
        true,
      );
      infiniteScrollKey.value += 1;
    } catch (error) {
      console.error("Error fetching attendances:", error);
      await showToast("Failed to load attendance records.", "danger");
    }
  };

  const loadMore = async (event) => {
    const infiniteScroll = event.target;

    if (isLoadingMore.value || !userStore.allAttendancePagination.hasMore) {
      await infiniteScroll?.complete();
      return;
    }

    isLoadingMore.value = true;

    try {
      await userStore.fetchAllAttendances(
        buildAttendanceDomain(),
        {
          limit: PAGE_SIZE,
          offset: userStore.allAttendancePagination.offset,
        },
        false,
      );
    } catch (error) {
      console.error("Error fetching more attendances:", error);
      await showToast("Failed to load more attendance records.", "danger");
    } finally {
      isLoadingMore.value = false;
      await infiniteScroll?.complete();
    }
  };

  const handleRefresh = async (event) => {
    await fetchAttendances();
    event.target.complete();
  };

  const openDetail = async (recordId) => {
    const modal = await modalController.create({
      component: AttendanceDetailModal,
      componentProps: {
        recordId,
      },
    });
    await modal.present();
  };

  const getEmployeeName = (record) => {
    if (
      record.employee_id &&
      typeof record.employee_id === "object" &&
      record.employee_id.display_name
    ) {
      return record.employee_id.display_name;
    }
    return "Unknown Employee";
  };

  watch(
    [employeePicker.selectedEmployees, dateFrom, dateTo, isMyTeam],
    () => {
      fetchAttendances();
    },
    { deep: true },
  );

  onMounted(() => {
    fetchAttendances();
  });

  return {
    userStore,
    records,
    isLoadingMore,
    infiniteScrollKey,
    showFilters,
    dateFrom,
    dateTo,
    totalWorkedHours,
    totalOvertimeHours,
    attendanceState,
    toggleFilters,
    fetchAttendances,
    loadMore,
    handleRefresh,
    openDetail,
    getEmployeeName,
    ...employeePicker,
  };
}
