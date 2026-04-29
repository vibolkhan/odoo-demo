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
        :class="{ active: showAdvancedFilters }"
        :aria-label="showAdvancedFilters ? 'Hide filters' : 'Show filters'"
        @click="showAdvancedFilters = !showAdvancedFilters"
      >
        <ion-icon
          :icon="showAdvancedFilters ? closeOutline : funnelOutline"
          aria-hidden="true"
        />
      </button>
    </div>

    <section
      v-if="showAdvancedFilters"
      class="filter-panel"
      aria-label="Advanced request filters"
    >
      <div class="date-grid">
        <DateInput
          v-model="dateFromFilter"
          label="From"
          :placeholder="localizedDatePlaceholder"
          :max="dateToFilter || undefined"
        />

        <DateInput
          v-model="dateToFilter"
          label="To"
          :placeholder="localizedDatePlaceholder"
          :min="dateFromFilter || undefined"
        />
      </div>

      <ion-button
        expand="block"
        class="clear-filters-button"
        :disabled="!hasActiveAdvancedFilters"
        @click="clearAdvancedFilters"
      >
        Clear Filters
      </ion-button>
    </section>

    <p v-if="employeeErrorMessage" class="filter-message error-message">
      {{ employeeErrorMessage }}
    </p>

    <div v-if="isLoading" class="state-card">
      <ion-spinner name="crescent" />
      <p>Loading leave requests...</p>
    </div>

    <div v-else-if="errorMessage" class="state-card error">
      <ion-icon :icon="alertCircleOutline" aria-hidden="true" />
      <p>{{ errorMessage }}</p>
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

                <p v-if="request.employeeName" class="employee-name">
                  {{ request.employeeName }}
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

    <ion-modal
      :is-open="isEmployeeSearchOpen"
      css-class="employee-search-overlay"
      @didDismiss="closeEmployeeSearch"
    >
      <ion-content class="employee-search-modal" :scroll-y="true">
        <div class="employee-search-sticky">
          <div class="employee-search-header">
            <div>
              <p>Select</p>
              <h3>Employee</h3>
            </div>

            <ion-button fill="clear" size="small" @click="clearEmployeeFilter">
              All employees
            </ion-button>
          </div>

          <ion-searchbar
            v-model="employeeSearchQuery"
            class="employee-searchbar"
            placeholder="Search employee..."
          />
        </div>

        <ion-list v-if="filteredEmployees.length" class="employee-results">
          <ion-item
            v-for="employee in filteredEmployees"
            :key="employee.id"
            button
            :detail="false"
            class="employee-option"
            @click="selectEmployee(employee.id)"
          >
            <ion-label>
              <h3>{{ employee.name }}</h3>
              <p v-if="employee.department || employee.company">
                {{ employee.department || employee.company }}
              </p>
            </ion-label>
          </ion-item>
        </ion-list>

        <ion-infinite-scroll
          :disabled="!hasMoreEmployees"
          @ionInfinite="loadMoreEmployees"
        >
          <ion-infinite-scroll-content
            loading-spinner="bubbles"
            loading-text="Loading more employees..."
          />
        </ion-infinite-scroll>

        <div
          v-if="!filteredEmployees.length && !isLoadingEmployees"
          class="employee-empty-state"
        >
          No employees match your search.
        </div>
      </ion-content>
    </ion-modal>
  </div>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSearchbar,
  IonSpinner,
} from "@ionic/vue";

import {
  alertCircleOutline,
  airplaneOutline,
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

import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import LeaveRequestDetailModal from "@/components/LeaveRequestDetailModal.vue";

import {
  fetchEmployees,
  fetchCurrentUserEmployee,
  type EmployeeOption,
} from "@/utils/employees";
import {
  fetchLeaveRequests,
  fetchAllEmployeesLeaveRequests,
  type LeaveRequest,
} from "@/utils/leaveRequests";

type FilterId = "all" | "pending" | "approved" | "rejected";

const props = defineProps<{
  isManagerMode?: boolean;
}>();

const emit = defineEmits<{
  summaryChange: [
    {
      total: number;
      pending: number;
      review: number;
    },
  ];
}>();

const leaveRequests = ref<LeaveRequest[]>([]);
const employees = ref<EmployeeOption[]>([]);
const currentUserEmployee = ref<EmployeeOption | null>(null);

const isLoading = ref(false);
const errorMessage = ref("");

const activeFilter = ref<FilterId>(props.isManagerMode ? "pending" : "all");
const showAdvancedFilters = ref(false);

const selectedEmployeeId = ref<number | null>(null);
const selectedEmployeeDetails = ref<EmployeeOption | null>(null);

const dateFromFilter = ref("");
const dateToFilter = ref("");

const isLoadingEmployees = ref(false);
const isLoadingMoreEmployees = ref(false);
const hasMoreEmployees = ref(true);
const employeeErrorMessage = ref("");

const isDetailModalOpen = ref(false);
const selectedRequest = ref<LeaveRequest | null>(null);

const isEmployeeSearchOpen = ref(false);
const employeeSearchQuery = ref("");
const activeEmployeeQuery = ref("");

const employeePageSize = 80;
const nextEmployeePage = ref(1);

let employeeSearchTimer: ReturnType<typeof setTimeout> | null = null;
let employeeLoadRequestId = 0;

const filters = computed(
  (): Array<{ id: FilterId; label: string }> => [
    { id: "all", label: props.isManagerMode ? "All Employee" : "All History" },
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
  ],
);

const localizedDatePlaceholder = computed(() => {
  try {
    const formatter = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(new Date(2001, 10, 22));

    return parts
      .map((part) => {
        if (part.type === "day") return "DD";
        if (part.type === "month") return "MM";
        if (part.type === "year") return "YYYY";
        return part.value;
      })
      .join("");
  } catch {
    return "YYYY-MM-DD";
  }
});

const selectedEmployee = computed(
  () =>
    selectedEmployeeDetails.value ??
    employees.value.find(
      (employee) => employee.id === selectedEmployeeId.value,
    ) ?? {
      id: 0,
      name: "",
      company: "",
      department: "",
    },
);

const selectedEmployeeName = computed(() => selectedEmployee.value.name);
const filteredEmployees = computed(() => employees.value);

const hasActiveAdvancedFilters = computed(
  () =>
    Boolean(selectedEmployeeId.value) ||
    Boolean(dateFromFilter.value) ||
    Boolean(dateToFilter.value),
);

const statusFilteredRequests = computed(() => {
  switch (activeFilter.value) {
    case "pending":
      return leaveRequests.value.filter(
        (request) => request.state === "confirm" || request.state === "validate1",
      );

    case "approved":
      return leaveRequests.value.filter(
        (request) => request.state === "validate",
      );

    case "rejected":
      return leaveRequests.value.filter(
        (request) => request.state === "refuse",
      );

    default:
      return leaveRequests.value;
  }
});

const displayedRequests = computed(() => {
  const startBoundary = parseFilterDate(dateFromFilter.value);
  const endBoundary = parseFilterDate(dateToFilter.value);

  return statusFilteredRequests.value.filter((request) => {
    const matchesEmployee =
      !selectedEmployeeName.value ||
      request.employeeName === selectedEmployeeName.value;

    if (!matchesEmployee) return false;

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
  const groups = new Map<
    string,
    {
      key: string;
      label: string;
      sortValue: number;
      requests: LeaveRequest[];
    }
  >();

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
  total: leaveRequests.value.length,
  pending: leaveRequests.value.filter((request) => request.state === "confirm")
    .length,
  review: leaveRequests.value.filter((request) => request.state === "validate1")
    .length,
}));

const loadLeaveRequests = async () => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    if (props.isManagerMode) {
      leaveRequests.value = await fetchAllEmployeesLeaveRequests();
    } else {
      leaveRequests.value = await fetchLeaveRequests();
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Unable to load leave requests.";
  } finally {
    isLoading.value = false;
  }
};

const loadEmployees = async (reset = false) => {
  if (!props.isManagerMode) return;
  if (reset) {
    isLoadingEmployees.value = true;
    employeeErrorMessage.value = "";
    hasMoreEmployees.value = true;
    nextEmployeePage.value = 1;
  } else {
    if (isLoadingMoreEmployees.value || !hasMoreEmployees.value) return;
    isLoadingMoreEmployees.value = true;
  }

  const requestQuery = activeEmployeeQuery.value;
  const requestPage = reset ? 1 : nextEmployeePage.value;
  const requestOffset = (requestPage - 1) * employeePageSize;
  const requestId = ++employeeLoadRequestId;

  try {
    const result = await fetchEmployees({
      offset: requestOffset,
      limit: employeePageSize,
      query: requestQuery,
    });

    if (
      requestId !== employeeLoadRequestId ||
      requestQuery !== activeEmployeeQuery.value
    ) {
      return;
    }

    employees.value = reset
      ? result.records
      : [...employees.value, ...result.records];

    hasMoreEmployees.value = result.hasMore;
    nextEmployeePage.value = requestPage + 1;

    if (selectedEmployeeId.value != null) {
      const matchingEmployee = employees.value.find(
        (employee) => employee.id === selectedEmployeeId.value,
      );

      if (matchingEmployee) {
        selectedEmployeeDetails.value = matchingEmployee;
      }
    }
  } catch (error) {
    if (requestId !== employeeLoadRequestId) return;

    if (reset) {
      employees.value = [];
      hasMoreEmployees.value = false;
    }

    employeeErrorMessage.value =
      error instanceof Error ? error.message : "Unable to load employees.";
  } finally {
    if (reset) {
      isLoadingEmployees.value = false;
    } else {
      isLoadingMoreEmployees.value = false;
    }
  }
};

const loadMoreEmployees = async (event: CustomEvent) => {
  const infiniteScroll = event.target as HTMLIonInfiniteScrollElement | null;

  await loadEmployees(false);
  await infiniteScroll?.complete();

  if (infiniteScroll) {
    infiniteScroll.disabled = !hasMoreEmployees.value;
  }
};

const openRequestDetail = (request: LeaveRequest) => {
  selectedRequest.value = request;
  isDetailModalOpen.value = true;
};

const openRequestDetailById = (requestId: number) => {
  const matchedRequest = leaveRequests.value.find(
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

const openEmployeeSearch = () => {
  employeeSearchQuery.value = "";
  activeEmployeeQuery.value = "";
  isEmployeeSearchOpen.value = true;
  void loadEmployees(true);
};

const closeEmployeeSearch = () => {
  isEmployeeSearchOpen.value = false;
};

const selectEmployee = (employeeId: number) => {
  selectedEmployeeId.value = employeeId;
  selectedEmployeeDetails.value =
    employees.value.find((employee) => employee.id === employeeId) ?? null;

  closeEmployeeSearch();
};

const clearEmployeeFilter = () => {
  selectedEmployeeId.value = null;
  selectedEmployeeDetails.value = null;
  closeEmployeeSearch();
};

const clearAdvancedFilters = () => {
  selectedEmployeeId.value = null;
  selectedEmployeeDetails.value = null;
  dateFromFilter.value = "";
  dateToFilter.value = "";
};

const getLeaveTypeEnglishName = (name: string) => {
  return name.split(" - ")[0] || name;
};

const getLeaveTypeKhmerName = (name: string) => {
  return name.split(" - ")[1] || "";
};

const formatDate = (value: string) => {
  const date = parseRequestDate(value);

  if (!date) return value || "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const formatDateRange = (start: string, end: string) => {
  const startLabel = formatDate(start);
  const endLabel = formatDate(end);

  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
};

const formatStateLabel = (state: string) => {
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

const badgeClass = (state: string) => {
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

const parseRequestDate = (value: string) => {
  if (!value) return null;

  const normalizedValue = value.includes(" ") ? value.replace(" ", "T") : value;
  const date = new Date(normalizedValue);

  return Number.isNaN(date.getTime()) ? null : date;
};

const parseFilterDate = (value: string) => {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
};

const getRequestSortValue = (request: LeaveRequest) =>
  parseRequestDate(request.dateFrom)?.getTime() ?? 0;

const requestTypeIcon = (leaveType: string) => {
  const normalizedType = leaveType.toLowerCase();

  if (normalizedType.includes("sick")) return medkitOutline;
  if (normalizedType.includes("personal")) return personOutline;
  if (normalizedType.includes("annual")) return calendarClearOutline;
  if (normalizedType.includes("unpaid")) return airplaneOutline;

  return sparklesOutline;
};

const tileTone = (leaveType: string) => {
  const normalizedType = leaveType.toLowerCase();

  if (normalizedType.includes("sick")) return "tone-blue";
  if (normalizedType.includes("personal")) return "tone-coral";
  if (normalizedType.includes("annual")) return "tone-lilac";

  return "tone-sand";
};

onMounted(async () => {
  if (props.isManagerMode) {
    void loadEmployees(true);
  }
  void loadLeaveRequests();
  currentUserEmployee.value = await fetchCurrentUserEmployee();
});

watch(
  requestSummary,
  (summary) => {
    emit("summaryChange", summary);
  },
  { immediate: true },
);

watch(employeeSearchQuery, (value) => {
  if (employeeSearchTimer) {
    clearTimeout(employeeSearchTimer);
  }

  employeeSearchTimer = setTimeout(() => {
    activeEmployeeQuery.value = value.trim();
    void loadEmployees(true);
  }, 250);
});

onBeforeUnmount(() => {
  if (employeeSearchTimer) {
    clearTimeout(employeeSearchTimer);
  }
});

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
</style>
