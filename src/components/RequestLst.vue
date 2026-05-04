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

    <div v-if="loading.leaveRequests || loading.companyLeaveRequests" class="state-card">
      <ion-spinner name="crescent" />
      <p>Loading leave requests...</p>
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

    <div v-else-if="!displayedRequests.length" class="state-card">
      <ion-icon :icon="fileTrayOutline" aria-hidden="true" />
      <p>No leave requests match the current filters.</p>
    </div>

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

                <!-- <p v-if="request.employeeName" class="employee-name">
                  {{ request.employeeName }}
                </p> -->
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

import DateInput from "./DateInput.vue";

import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import LeaveRequestDetailModal from "@/components/LeaveRequestDetailModal.vue";
import { useUserStore } from "@/stores/user.store";
import { useTimeoffStore } from "@/stores/timeoff.store";

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
  background: rgba(241, 245, 249, 0.8);
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
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 750;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.filter-segment.active {
  background: #ffffff;
  color: #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.12);
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
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #ffffff;
  color: #64748b;
  transition: all 0.2s ease;
}

.filter-toggle-button.active {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
}

.filter-panel {
  display: grid;
  gap: 16px;
  padding: 20px;
  border-radius: 28px;
  background: #ffffff;
  border: 1px solid #f1f5f9;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
}

.date-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 380px) {
  .date-grid {
    grid-template-columns: 1fr;
  }
}

.clear-filters-button {
  margin-top: 8px;
  min-height: 52px;
  font-weight: 850;
  --border-radius: 18px;
  --background: #f1f5f9;
  --color: #475569;
  --box-shadow: none;
}

@media (max-width: 480px) {
  .date-picker-modal {
    --padding-start: 12px;
    --padding-end: 12px;
  }

  .date-picker-shell {
    max-width: none;
  }
}

@media (max-width: 380px) {
  .date-grid {
    grid-template-columns: 1fr;
  }
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
  color: #0f172a;
  letter-spacing: -0.02em;
}

.month-head p:last-child {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 800;
  color: #94a3b8;
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
  background: #ffffff;
  border: 1px solid #f1f5f9;
  box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.04);
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
  background: #eff6ff;
  color: #2563eb;
}
.tone-coral {
  background: #fff1f2;
  color: #e11d48;
}
.tone-lilac {
  background: #f5f3ff;
  color: #7c3aed;
}
.tone-sand {
  background: #fff7ed;
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
  color: #1e293b;
  line-height: 1.2;
}

.khmer-type {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
}

.request-dates {
  margin: 2px 0 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
}

.employee-name {
  margin: 4px 0 0;
  font-size: 0.78rem;
  font-weight: 600;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-pill {
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 0.65rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}
.status-review {
  background: #e0f2fe;
  color: #075985;
}
.status-approved {
  background: #dcfce7;
  color: #166534;
}
.status-refused {
  background: #fee2e2;
  color: #991b1b;
}

.card-chevron {
  font-size: 1.1rem;
  color: #cbd5e1;
}

.state-card {
  padding: 48px 24px;
  text-align: center;
  background: #ffffff;
  border-radius: 32px;
  color: #94a3b8;
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

.employee-search-modal {
  --background: #f8fafc;
}

.employee-option {
  --padding-start: 16px;
  --padding-end: 16px;
  --inner-padding-end: 0;
  --background: #ffffff;
  margin-bottom: 12px;
  border-radius: 20px;
  border: 1px solid #f1f5f9;
}

/* Filter Styles */
.filter-panel {
  background: white;
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.filter-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
}

.filter-item.full {
  flex: 1 1 100%;
}

.filter-item label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-left: 4px;
}

.custom-searchbar {
  --background: #f8fafc;
  --border-radius: 12px;
  padding: 0;
  height: 44px;
}

.employee-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  z-index: 100;
  margin-top: 4px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 12px 16px;
  font-size: 0.9rem;
  color: #1e293b;
  border-bottom: 1px solid #f1f5f9;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:active {
  background: #f1f5f9;
}

.suggestion-loading {
  display: flex;
  justify-content: center;
  padding: 12px;
}

.selected-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.selected-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #eff6ff;
  color: #2563eb;
  padding: 6px 12px;
  border-radius: 99px;
  font-size: 0.85rem;
  font-weight: 600;
  width: fit-content;
}

.selected-tag ion-icon {
  font-size: 16px;
  cursor: pointer;
}

.date-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}
</style>
