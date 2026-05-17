import { computed, onMounted, ref } from "vue";
import { useTimeoffStore } from "@/stores/timeoff.store";
import { useUserStore } from "@/stores/user.store";
import { useDateTimeFormatter } from "@/composables/useDateTimeFormatter";
import { useEmployeePicker } from "@/composables/useEmployeePicker";
import { useMinimumSkeleton } from "@/composables/useMinimumSkeleton";
import { useNotification } from "@/composables/useNotification";
import {
  LEAVE_STATUS_FILTERS,
  matchesLeaveStatusFilter,
} from "@/utils/leave";

const PAGE_SIZE = 10;

export function useLeaveApprovalsPage() {
  const userStore = useUserStore();
  const timeoffStore = useTimeoffStore();
  const { showToast } = useNotification();
  const employeePicker = useEmployeePicker(userStore);
  const { formatDate } = useDateTimeFormatter();

  const requests = ref([]);
  const loading = ref(true);
  const isLoadingMore = ref(false);
  const infiniteScrollKey = ref(0);
  const showFilters = ref(false);
  const dateFrom = ref("");
  const dateTo = ref("");
  const activeStatus = ref("pending");
  const isDetailModalOpen = ref(false);
  const selectedRequest = ref(null);

  const { showSkeleton } = useMinimumSkeleton(
    () => loading.value && requests.value.length === 0,
    1000,
  );

  const hasMoreRequests = computed(
    () => timeoffStore.companyLeaveRequestPagination.hasMore,
  );

  const statusFilters = LEAVE_STATUS_FILTERS;

  const formatDateRange = (start, end) => {
    const startLabel = formatDate(start);
    const endLabel = formatDate(end);
    return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
  };

  const toggleFilters = () => {
    showFilters.value = !showFilters.value;
  };

  const fetchRequests = async () => {
    loading.value = true;
    try {
      await timeoffStore.fetchCompanyLeaveRequests({ limit: PAGE_SIZE }, true);
      requests.value = timeoffStore.companyLeaveRequests;
      infiniteScrollKey.value += 1;
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      await showToast("Failed to load leave requests.", "danger");
    } finally {
      loading.value = false;
    }
  };

  const loadMore = async (event) => {
    const infiniteScroll = event.target;

    if (isLoadingMore.value || !hasMoreRequests.value) {
      await infiniteScroll?.complete();
      return;
    }

    isLoadingMore.value = true;

    try {
      await timeoffStore.fetchCompanyLeaveRequests(
        {
          limit: PAGE_SIZE,
          offset: timeoffStore.companyLeaveRequestPagination.offset,
        },
        false,
      );
      requests.value = timeoffStore.companyLeaveRequests;
    } catch (error) {
      console.error("Error fetching more leave requests:", error);
      await showToast("Failed to load more leave requests.", "danger");
    } finally {
      isLoadingMore.value = false;
      await infiniteScroll?.complete();
    }
  };

  const handleRefresh = async (event) => {
    await fetchRequests();
    event.target.complete();
  };

  const filteredRequests = computed(() =>
    requests.value.filter((request) => {
      const matchesEmployee =
        employeePicker.selectedEmployees.value.length === 0 ||
        employeePicker.selectedEmployees.value.some(
          (employee) => employee.name === request.employeeName,
        );

      if (!matchesEmployee) return false;

      if (dateFrom.value || dateTo.value) {
        const requestDate = new Date(request.dateFrom);
        if (dateFrom.value && requestDate < new Date(dateFrom.value)) {
          return false;
        }
        if (dateTo.value && requestDate > new Date(`${dateTo.value}T23:59:59`)) {
          return false;
        }
      }

      return true;
    }),
  );

  const finalRequests = computed(() =>
    filteredRequests.value.filter((request) =>
      matchesLeaveStatusFilter(request, activeStatus.value),
    ),
  );

  const pendingCount = computed(
    () =>
      filteredRequests.value.filter(
        (request) =>
          request.state === "confirm" || request.state === "validate1",
      ).length,
  );

  const reviewCount = computed(
    () =>
      filteredRequests.value.filter(
        (request) => request.state === "validate1",
      ).length,
  );

  const openDetail = (request) => {
    selectedRequest.value = request;
    isDetailModalOpen.value = true;
  };

  const closeDetail = () => {
    isDetailModalOpen.value = false;
    selectedRequest.value = null;
  };

  onMounted(() => {
    fetchRequests();
  });

  return {
    requests,
    loading,
    showSkeleton,
    isLoadingMore,
    infiniteScrollKey,
    showFilters,
    dateFrom,
    dateTo,
    activeStatus,
    statusFilters,
    hasMoreRequests,
    filteredRequests,
    finalRequests,
    pendingCount,
    reviewCount,
    isDetailModalOpen,
    selectedRequest,
    formatDateRange,
    toggleFilters,
    fetchRequests,
    loadMore,
    handleRefresh,
    openDetail,
    closeDetail,
    ...employeePicker,
  };
}
