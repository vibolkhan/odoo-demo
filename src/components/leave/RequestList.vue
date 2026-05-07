<template>
  <div class="request-list-shell">
    <section class="filter-strip" aria-label="Request filters">
      <button
        v-for="filter in filters"
        :key="filter.id"
        type="button"
        class="filter-segment"
        :class="{ active: activeFilter === filter.id }"
        @click="activeFilter = filter.id"
      >
        {{ filter.label }}
      </button>
    </section>

    <div class="filter-toggle-row">
      <button
        type="button"
        class="filter-toggle-button"
        :class="{ active: showFilters }"
        :aria-label="showFilters ? 'Hide filters' : 'Show filters'"
        @click="showFilters = !showFilters"
      >
        <ion-icon
          :icon="showFilters ? closeOutline : funnelOutline"
          aria-hidden="true"
        />
      </button>
    </div>

    <section
      v-if="showFilters"
      class="filter-panel"
      aria-label="Advanced request filters"
    >
      <div class="date-grid">
        <DateInput
          v-model="dateFromFilter"
          label="From"
          placeholder="Start Date"
        />

        <DateInput v-model="dateToFilter" label="To" placeholder="End Date" />
      </div>

      <div class="filter-actions">
        <ion-button fill="clear" size="small" @click="resetFilters"
          >Reset All Filters</ion-button
        >
      </div>
    </section>

    <p
      v-if="error.leaveRequests || error.companyLeaveRequests"
      class="filter-message error-message"
    >
      {{ error.leaveRequests || error.companyLeaveRequests }}
    </p>

    <div v-if="showSkeleton" class="month-stack">
      <div v-for="i in 5" :key="i" class="request-card skeleton-card">
        <div class="card-main">
          <AppSkeleton shape="squircle" width="52px" height="52px" />
          <div class="request-copy">
            <AppSkeleton width="60%" height="18px" />
            <AppSkeleton width="40%" height="14px" margin="8px 0 0" />
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="error.leaveRequests || error.companyLeaveRequests"
      class="state-card error"
    >
      <ion-icon :icon="alertCircleOutline" aria-hidden="true" />
      <p>{{ error.leaveRequests || error.companyLeaveRequests }}</p>
      <ion-button fill="outline" @click="loadLeaveRequests">
        Try Again
      </ion-button>
    </div>

    <AppEmptyState
      v-else-if="!displayedRequests.length"
      :icon="fileTrayOutline"
      title="No requests found"
      description="We couldn't find any leave requests matching your current filters."
      variant="purple"
    />

    <section v-else class="request-list">
      <section
        v-for="group in groupedRequests"
        :key="group.key"
        class="month-group"
      >
        <header class="month-head">
          <p>{{ group.label }}</p>
          <p>{{ group.requests.length }} REQUESTS</p>
        </header>

        <div class="month-stack">
          <article
            v-for="request in group.requests"
            :key="request.id"
            class="request-card"
            role="button"
            tabindex="0"
            @click="openRequestDetail(request)"
            @keydown.enter="openRequestDetail(request)"
            @keydown.space.prevent="openRequestDetail(request)"
          >
            <div class="card-main">
              <div class="type-tile" :class="tileTone(request.leaveType)">
                <ion-icon
                  :icon="requestTypeIcon(request.leaveType)"
                  aria-hidden="true"
                />
              </div>

              <div class="request-copy">
                <div class="request-topline">
                  <div class="type-name-group">
                    <h5>{{ getLeaveTypeEnglishName(request.leaveType) }}</h5>
                    <span
                      v-if="getLeaveTypeKhmerName(request.leaveType)"
                      class="khmer-type"
                      >{{ getLeaveTypeKhmerName(request.leaveType) }}</span
                    >
                  </div>

                  <span class="status-pill" :class="badgeClass(request.state)">
                    {{ formatStateLabel(request.state) }}
                  </span>
                </div>

                <p class="request-dates">
                  {{ formatDateRange(request.dateFrom, request.dateTo) }}
                </p>
              </div>

              <ion-icon
                class="card-chevron"
                :icon="chevronForwardOutline"
                aria-hidden="true"
              />
            </div>
          </article>
        </div>
      </section>
    </section>

    <LeaveRequestDetailModal
      :is-open="isDetailModalOpen"
      :request="selectedRequest"
      :fallback-employee-name="currentUserEmployee?.name"
      @close="closeRequestDetail"
      @updated="loadLeaveRequests"
    />
  </div>
</template>

<script setup>
import { IonButton, IonIcon, IonSpinner } from "@ionic/vue";
import {
  airplaneOutline,
  alertCircleOutline,
  calendarClearOutline,
  chevronForwardOutline,
  closeOutline,
  fileTrayOutline,
  funnelOutline,
  medkitOutline,
  personOutline,
  sparklesOutline,
} from "ionicons/icons";
import DateInput from "@/components/common/DateInput.vue";
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import LeaveRequestDetailModal from "@/components/leave/LeaveRequestDetailModal.vue";
import { useUserStore } from "@/stores/user.store";
import { useTimeoffStore } from "@/stores/timeoff.store";
import AppSkeleton from "@/components/common/AppSkeleton.vue";
import AppEmptyState from "@/components/common/AppEmptyState.vue";
import { useMinimumSkeleton } from "@/composables/useMinimumSkeleton";

const props = defineProps({
  isManagerMode: Boolean,
});

const emit = defineEmits(['summaryChange']);

const userStore = useUserStore();
const timeoffStore = useTimeoffStore();
const {
  leaveRequests,
  companyLeaveRequests,
  loading,
  error,
} = storeToRefs(timeoffStore);
const { currentEmployee: currentUserEmployee } = storeToRefs(userStore);
const activeFilter = ref(props.isManagerMode ? "pending" : "all");

const dateFromFilter = ref("");
const dateToFilter = ref("");

const isDetailModalOpen = ref(false);
const selectedRequest = ref(null);

const showFilters = ref(false);

const filters = computed(
  () => [
    { id: "all", label: props.isManagerMode ? "All Employee" : "All History" },
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
  ],
);

const requestRecords = computed(() =>
  props.isManagerMode ? companyLeaveRequests.value : leaveRequests.value,
);

const isRequestsLoading = computed(() =>
  props.isManagerMode
    ? loading.value.companyLeaveRequests
    : loading.value.leaveRequests,
);
const { showSkeleton } = useMinimumSkeleton(isRequestsLoading, 1000);

const statusFilteredRequests = computed(() => {
  switch (activeFilter.value) {
    case "pending":
      return requestRecords.value.filter(
        (request) =>
          request.state === "confirm" || request.state === "validate1",
      );

    case "approved":
      return requestRecords.value.filter(
        (request) => request.state === "validate",
      );

    case "rejected":
      return requestRecords.value.filter(
        (request) => request.state === "refuse",
      );

    default:
      return requestRecords.value;
  }
});

const displayedRequests = computed(() => {
  const startBoundary = parseFilterDate(dateFromFilter.value);
  const endBoundary = parseFilterDate(dateToFilter.value);

  return statusFilteredRequests.value.filter((request) => {
    const requestStart = parseRequestDate(request.dateFrom);
    const requestEnd = parseRequestDate(request.dateTo) ?? requestStart;

    if ((startBoundary || endBoundary) && (!requestStart || !requestEnd)) {
      return false;
    }

    if (startBoundary && requestEnd && requestEnd < startBoundary) {
      return false;
    }

    if (endBoundary && requestStart && requestStart > endBoundary) {
      return false;
    }

    return true;
  });
});

const groupedRequests = computed(() => {
  const groups = new Map();

  for (const request of displayedRequests.value) {
    const date = parseRequestDate(request.dateFrom);

    const key = date
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      : "unknown";

    const label = date
      ? new Intl.DateTimeFormat("en-US", {
          month: "long",
          year: "numeric",
        }).format(date)
      : "Unknown Date";

    const sortValue = date
      ? new Date(date.getFullYear(), date.getMonth(), 1).getTime()
      : 0;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label,
        sortValue,
        requests: [],
      });
    }

    groups.get(key)?.requests.push(request);
  }

  return [...groups.values()]
    .sort((a, b) => b.sortValue - a.sortValue)
    .map((group) => ({
      ...group,
      requests: [...group.requests].sort(
        (a, b) => getRequestSortValue(b) - getRequestSortValue(a),
      ),
    }));
});

const requestSummary = computed(() => ({
  total: requestRecords.value.length,
  pending: requestRecords.value.filter((request) => request.state === "confirm")
    .length,
  review: requestRecords.value.filter((request) => request.state === "validate1")
    .length,
}));

const loadLeaveRequests = async () => {
  try {
    if (props.isManagerMode) {
      await timeoffStore.fetchCompanyLeaveRequests();
    } else {
      await timeoffStore.fetchLeaveRequests();
    }
  } finally {
    if (selectedRequest.value) {
      selectedRequest.value =
        requestRecords.value.find((r) => r.id === selectedRequest.value?.id) ||
        null;
    }
  }
};

const resetFilters = () => {
  dateFromFilter.value = "";
  dateToFilter.value = "";
};

const openRequestDetail = (request) => {
  selectedRequest.value = request;
  isDetailModalOpen.value = true;
};

const openRequestDetailById = (requestId) => {
  const matchedRequest = requestRecords.value.find(
    (request) => request.id === requestId,
  );

  if (!matchedRequest) {
    return false;
  }

  openRequestDetail(matchedRequest);
  return true;
};

const closeRequestDetail = () => {
  isDetailModalOpen.value = false;
  selectedRequest.value = null;
};

const getLeaveTypeEnglishName = (name) => {
  return name.split(" - ")[0] || name;
};

const getLeaveTypeKhmerName = (name) => {
  return name.split(" - ")[1] || "";
};

const formatDate = (value) => {
  const date = parseRequestDate(value);

  if (!date) return value || "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const formatDateRange = (start, end) => {
  const startLabel = formatDate(start);
  const endLabel = formatDate(end);

  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
};

const formatStateLabel = (state) => {
  switch (state) {
    case "confirm":
      return "Pending";
    case "validate1":
      return "Review";
    case "validate":
      return "Approved";
    case "refuse":
      return "Refused";
    case "cancel":
      return "Cancelled";
    case "draft":
      return "Draft";
    default:
      return state.charAt(0).toUpperCase() + state.slice(1);
  }
};

const badgeClass = (state) => {
  switch (state) {
    case "validate1":
      return "status-review";
    case "validate":
      return "status-approved";
    case "refuse":
    case "cancel":
      return "status-refused";
    default:
      return "status-pending";
  }
};

const parseRequestDate = (value) => {
  if (!value) return null;
  const normalizedValue = value.includes(" ") ? value.replace(" ", "T") : value;
  const date = new Date(normalizedValue);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseFilterDate = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getRequestSortValue = (request) =>
  parseRequestDate(request.dateFrom)?.getTime() ?? 0;

const requestTypeIcon = (leaveType) => {
  const normalizedType = leaveType.toLowerCase();
  if (normalizedType.includes("sick")) return medkitOutline;
  if (normalizedType.includes("personal")) return personOutline;
  if (normalizedType.includes("annual")) return calendarClearOutline;
  if (normalizedType.includes("unpaid")) return airplaneOutline;
  return sparklesOutline;
};

const tileTone = (leaveType) => {
  const normalizedType = leaveType.toLowerCase();
  if (normalizedType.includes("sick")) return "tone-blue";
  if (normalizedType.includes("personal")) return "tone-coral";
  if (normalizedType.includes("annual")) return "tone-lilac";
  return "tone-sand";
};

onMounted(async () => {
  void loadLeaveRequests();
  await userStore.fetchCurrentEmployee({ force: true });
});

watch(
  requestSummary,
  (summary) => {
    emit("summaryChange", summary);
  },
  { immediate: true },
);

defineExpose({
  loadLeaveRequests,
  openRequestDetailById,
});
</script>

<style scoped>
.request-list-shell {
  display: grid;
  gap: 20px;
  padding-bottom: 84px;
}

.filter-strip {
  display: flex;
  gap: 8px;
  padding: 6px;
  border-radius: 20px;
  background: var(--border-color);
  backdrop-filter: blur(8px);
  overflow-x: auto;
  scrollbar-width: none;
}

.filter-strip::-webkit-scrollbar {
  display: none;
}

.filter-segment {
  flex: 1 0 auto;
  min-width: max-content;
  min-height: 42px;
  border: 0;
  border-radius: 14px;
  padding: 0 18px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 750;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.filter-segment.active {
  background: var(--card-bg);
  color: var(--ion-color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.filter-toggle-row {
  display: flex;
  justify-content: flex-end;
  margin-top: -8px;
}

.filter-toggle-button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  background: var(--card-bg);
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.filter-toggle-button.active {
  background: var(--ion-color-primary);
  color: #ffffff;
  border-color: var(--ion-color-primary);
  box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
}

.filter-panel {
  display: grid;
  gap: 16px;
  padding: 20px;
  border-radius: 28px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
}

.date-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.month-group {
  display: grid;
  gap: 16px;
}

.month-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 4px;
}

.month-head p:first-child {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.month-head p:last-child {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--text-secondary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding-bottom: 3px;
}

.month-stack {
  display: grid;
  gap: 14px;
}

.request-card {
  position: relative;
  border-radius: 24px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.request-card:active {
  transform: scale(0.97);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.card-main {
  display: grid;
  grid-template-columns: 52px 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 16px;
}

.type-tile {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 1.4rem;
}

.tone-blue {
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}
.tone-coral {
  background: rgba(225, 29, 72, 0.1);
  color: #e11d48;
}
.tone-lilac {
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
}
.tone-sand {
  background: rgba(234, 88, 12, 0.1);
  color: #ea580c;
}

.request-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.request-topline {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.type-name-group h5 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 850;
  color: var(--text-primary);
  line-height: 1.2;
}

.khmer-type {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.request-dates {
  margin: 2px 0 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.status-pill {
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 0.65rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-pending { background: #fef3c7; color: #92400e; }
.status-review { background: #e0f2fe; color: #075985; }
.status-approved { background: #dcfce7; color: #166534; }
.status-refused { background: #fee2e2; color: #991b1b; }

.card-chevron {
  font-size: 1.1rem;
  color: #cbd5e1;
}

.state-card {
  padding: 48px 24px;
  text-align: center;
  background: var(--card-bg);
  border-radius: 32px;
  color: var(--text-secondary);
}

.state-card ion-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
  opacity: 0.5;
}

.state-card p {
  font-size: 1rem;
  font-weight: 600;
}
</style>
