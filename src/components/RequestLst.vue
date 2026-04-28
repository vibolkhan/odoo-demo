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
      <div class="filter-field">
        <label class="filter-label" for="employee-filter">Employee</label>

        <ion-item
          id="employee-filter"
          lines="none"
          class="filter-input-shell searchable-trigger"
          button
          :detail="false"
          :disabled="isLoadingEmployees || !employees.length"
          @click="openEmployeeSearch"
        >
          <ion-input
            :value="selectedEmployeeName"
            readonly
            class="searchable-input"
            :placeholder="
              isLoadingEmployees ? 'Loading employees...' : 'All employees'
            "
          />
        </ion-item>
      </div>

      <div class="date-grid">
        <div class="filter-field">
          <label class="filter-label" for="date-from-filter">From</label>

          <ion-item
            id="date-from-filter"
            lines="none"
            class="filter-input-shell"
          >
            <ion-input v-model="dateFromFilter" type="date" />
          </ion-item>
        </div>

        <div class="filter-field">
          <label class="filter-label" for="date-to-filter">To</label>

          <ion-item id="date-to-filter" lines="none" class="filter-input-shell">
            <ion-input v-model="dateToFilter" type="date" />
          </ion-item>
        </div>
      </div>

      <ion-button
        expand="block"
        fill="outline"
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
                  <h5>{{ getLeaveTypeEnglishName(request.leaveType) }}</h5>

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

    <ion-modal
      :is-open="isDetailModalOpen"
      :breakpoints="[0, 0.65, 0.92]"
      :initial-breakpoint="0.65"
      :backdrop-breakpoint="0"
      :expand-to-scroll="false"
      handle="true"
      @didDismiss="closeRequestDetail"
    >
      <ion-content class="request-detail-modal" :scroll-y="true">
        <section v-if="selectedRequest" class="request-detail-shell">
          <div class="request-detail-header">
            <div>
              <p class="detail-eyebrow">Leave Request</p>
              <h2>{{ selectedRequest.leaveType }}</h2>
              <p class="detail-subtitle">
                {{
                  formatDateRange(
                    selectedRequest.dateFrom,
                    selectedRequest.dateTo,
                  )
                }}
              </p>
            </div>

            <ion-button
              fill="clear"
              class="detail-close-button"
              aria-label="Close request details"
              @click="closeRequestDetail"
            >
              <ion-icon :icon="closeOutline" size="large" aria-hidden="true" />
            </ion-button>
          </div>

          <div class="detail-hero-card">
            <div class="detail-hero-main">
              <div
                class="type-tile detail-type-tile"
                :class="tileTone(selectedRequest.leaveType)"
              >
                <ion-icon
                  :icon="requestTypeIcon(selectedRequest.leaveType)"
                  aria-hidden="true"
                />
              </div>

              <div class="detail-hero-copy">
                <span
                  class="status-pill"
                  :class="badgeClass(selectedRequest.state)"
                >
                  {{ formatStateLabel(selectedRequest.state) }}
                </span>

                <p class="detail-duration">
                  {{
                    selectedRequest.durationDisplay || "Duration not provided"
                  }}
                </p>

                <p v-if="selectedRequest.needsAction" class="detail-attention">
                  This request needs action.
                </p>
              </div>
            </div>
          </div>

          <div class="detail-grid">
            <div class="detail-card">
              <span>Employee</span>
              <strong>{{ selectedRequest.employeeName || "-" }}</strong>
            </div>

            <div class="detail-card">
              <span>Department</span>
              <strong>{{ selectedRequest.departmentName || "-" }}</strong>
            </div>

            <div class="detail-card">
              <span>Company</span>
              <strong>{{ selectedRequest.companyName || "-" }}</strong>
            </div>

            <div class="detail-card">
              <span>Request ID</span>
              <strong>#{{ selectedRequest.id }}</strong>
            </div>
          </div>

          <div class="detail-section-card">
            <span class="detail-section-label">Schedule</span>
            <h3>
              {{
                formatDateRange(
                  selectedRequest.dateFrom,
                  selectedRequest.dateTo,
                )
              }}
            </h3>
            <p>
              {{
                selectedRequest.durationDisplay ||
                "No duration summary available."
              }}
            </p>
          </div>

          <div class="detail-section-card">
            <span class="detail-section-label">Reason</span>
            <h3>Notes</h3>
            <p>
              {{
                selectedRequest.reason ||
                "No reason was provided for this leave request."
              }}
            </p>
          </div>
        </section>
      </ion-content>
    </ion-modal>

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
  IonInput,
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

import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { fetchEmployees, type EmployeeOption } from "@/utils/employees";
import { fetchLeaveRequests, type LeaveRequest } from "@/utils/leaveRequests";

type FilterId = "all" | "pending" | "review" | "attention";

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

const isLoading = ref(false);
const errorMessage = ref("");

const activeFilter = ref<FilterId>("all");
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

const filters: Array<{ id: FilterId; label: string }> = [
  { id: "all", label: "All History" },
  { id: "pending", label: "Pending" },
  { id: "review", label: "Review" },
  { id: "attention", label: "Need Action" },
];

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
        (request) => request.state === "confirm",
      );

    case "review":
      return leaveRequests.value.filter(
        (request) => request.state === "validate1",
      );

    case "attention":
      return leaveRequests.value.filter((request) => request.needsAction);

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
    leaveRequests.value = await fetchLeaveRequests();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Unable to load leave requests.";
  } finally {
    isLoading.value = false;
  }
};

const loadEmployees = async (reset = false) => {
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

    default:
      return "Unknown";
  }
};

const badgeClass = (state: string) =>
  state === "validate1" ? "status-review" : "status-pending";

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

onMounted(() => {
  void loadEmployees(true);
  void loadLeaveRequests();
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
});
</script>

<style scoped>
.request-list-shell {
  display: grid;
  gap: 16px;
  padding-bottom: 84px;
}

.filter-strip {
  display: flex;
  gap: 8px;
  padding: 4px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.68);
  overflow-x: auto;
  scrollbar-width: none;
}

.filter-strip::-webkit-scrollbar {
  display: none;
}

.filter-segment {
  flex: 1 0 auto;
  min-width: max-content;
  min-height: 40px;
  border: 0;
  border-radius: 14px;
  padding: 0 16px;
  background: transparent;
  color: #526173;
  font-size: 0.92rem;
  font-weight: 700;
  white-space: nowrap;
}

.filter-segment.active {
  background: #2e66db;
  color: #ffffff;
  box-shadow: 0 10px 18px rgba(46, 102, 219, 0.24);
}

.filter-segment:active {
  transform: scale(0.97);
}

.filter-toggle-row {
  display: flex;
  justify-content: flex-end;
  margin-top: -4px;
}

.filter-toggle-button {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 14px;
  padding: 0;
  background: rgba(255, 255, 255, 0.88);
  color: #2e66db;
  box-shadow: 0 8px 20px rgba(55, 75, 105, 0.08);
}

.filter-toggle-button.active {
  background: #2e66db;
  color: #ffffff;
  box-shadow: 0 10px 18px rgba(46, 102, 219, 0.24);
}

.filter-toggle-button ion-icon {
  font-size: 1.1rem;
}

.filter-toggle-button:active {
  transform: scale(0.97);
}

.filter-panel {
  display: grid;
  gap: 14px;
  padding: 16px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12px 28px rgba(55, 75, 105, 0.08);
}

.date-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.filter-field {
  display: grid;
  gap: 8px;
}

.filter-label {
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.filter-input-shell {
  --background: #f7f9fc;
  --border-radius: 18px;
  --padding-start: 14px;
  --inner-padding-end: 14px;
  --min-height: 54px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
}

.searchable-input {
  pointer-events: none;
}

.clear-filters-button {
  min-height: 50px;
  --border-radius: 18px;
  --border-color: #d5dfeb;
  --color: #475569;
  font-weight: 800;
  text-transform: none;
}

.filter-message {
  margin: -6px 0 0;
  font-size: 0.88rem;
}

.error-message {
  color: #b42318;
}

.request-list {
  display: grid;
  gap: 22px;
}

.month-group {
  display: grid;
  gap: 12px;
}

.month-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.month-head h4 {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 850;
  color: #0f172a;
}

.month-head p {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.14em;
  color: #7f8a99;
  text-transform: uppercase;
}

.month-stack {
  display: grid;
  gap: 12px;
}

.request-card {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(55, 75, 105, 0.08);
  cursor: pointer;
  transition: transform 120ms ease;
}

.request-card:active {
  transform: scale(0.98);
}

.request-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 6px;
  background: linear-gradient(180deg, #2e66db, #4f8cff);
}

.card-main {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 12px 14px 12px 16px;
}

.type-tile {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  font-size: 1.25rem;
  background: #eaf1fb;
  color: #2e66db;
}

.tone-lilac {
  background: #eaf1fb;
  color: #2e66db;
}

.tone-blue {
  background: #edf6ff;
  color: #2563eb;
}

.tone-coral {
  background: #fff1f2;
  color: #e11d48;
}

.tone-sand {
  background: #fff7ed;
  color: #ea580c;
}

.request-copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.request-topline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.request-copy h5 {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.2;
  font-weight: 850;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.request-dates {
  margin: 0;
  font-size: 0.84rem;
  font-weight: 800;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.employee-name {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 0.64rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.status-pending {
  background: #ddd6fe;
  color: #6d5b96;
}

.status-review {
  background: #dbeafe;
  color: #1d4ed8;
}

.card-chevron {
  font-size: 0.9rem;
  color: #cbd5e1;
}

.state-card {
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 32px 20px;
  border-radius: 24px;
  background: #ffffff;
  text-align: center;
  color: #657285;
  box-shadow: 0 18px 34px rgba(25, 40, 67, 0.06);
}

.state-card.error {
  color: #a13f3f;
  background: #fff5f5;
}

.state-card ion-icon {
  font-size: 1.8rem;
}

.request-detail-modal {
  --background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
  --padding-top: 22px;
  --padding-start: 18px;
  --padding-end: 18px;
  --padding-bottom: calc(env(safe-area-inset-bottom) + 24px);
}

.request-detail-shell {
  display: grid;
  gap: 18px;
}

.request-detail-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.detail-eyebrow {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b;
}

.request-detail-header h2 {
  margin: 8px 0 0;
  font-size: 1.55rem;
  line-height: 1.2;
  font-weight: 850;
  color: #0f172a;
}

.detail-subtitle {
  margin: 8px 0 0;
  font-size: 0.92rem;
  color: #64748b;
}

.detail-close-button {
  width: 40px;
  height: 40px;
  margin: 0;
  --color: #1d4ed8;
  --border-radius: 14px;
  --background: rgba(255, 255, 255, 0.88);
  --box-shadow: 0 8px 20px rgba(55, 75, 105, 0.08);
}

.detail-close-button ion-icon {
  font-size: 1.1rem;
}

.detail-hero-card,
.detail-section-card {
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12px 28px rgba(55, 75, 105, 0.08);
}

.detail-hero-main {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
}

.detail-type-tile {
  width: 58px;
  height: 58px;
  font-size: 1.5rem;
}

.detail-duration {
  margin: 10px 0 0;
  font-size: 1rem;
  font-weight: 800;
  color: #1e293b;
}

.detail-attention {
  margin: 8px 0 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: #c2410c;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-card {
  padding: 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.88);
}

.detail-card span,
.detail-section-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}

.detail-card strong {
  display: block;
  margin-top: 6px;
  font-size: 0.95rem;
  color: #0f172a;
}

.detail-section-card h3 {
  margin: 10px 0 0;
  font-size: 1.05rem;
  font-weight: 850;
  color: #0f172a;
}

.detail-section-card p {
  margin: 8px 0 0;
  font-size: 0.92rem;
  line-height: 1.5;
  color: #526173;
}

.employee-search-modal {
  --background: #f8fbff;
  --padding-top: 18px;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-bottom: calc(env(safe-area-inset-bottom) + 24px);
}

:global(.employee-search-overlay) {
  --width: 100vw;
  --height: 100vh;
  --max-width: 100vw;
  --max-height: 100vh;
  --border-radius: 0;
}

.employee-search-sticky {
  position: sticky;
  top: 0;
  z-index: 10;
  padding-bottom: 12px;
  background: #f8fbff;
}

.employee-search-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.employee-search-header p {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b;
}

.employee-search-header h3 {
  margin: 6px 0 0;
  font-size: 1.45rem;
  font-weight: 850;
  color: #0f172a;
}

.employee-searchbar {
  padding: 12px 0 0;
}

.employee-searchbar::part(container) {
  min-height: 52px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.employee-results {
  margin-top: 10px;
  background: transparent;
  padding-bottom: 28px;
}

.employee-option {
  --border-radius: 18px;
  --background: #ffffff;
  margin-bottom: 10px;
  box-shadow: 0 8px 20px rgba(55, 75, 105, 0.06);
}

.employee-option h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: #1e293b;
}

.employee-option p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.88rem;
}

.employee-empty-state {
  padding: 24px 6px 8px;
  text-align: center;
  color: #6c7b8d;
}

@media (max-width: 640px) {
  .date-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .month-head h4 {
    font-size: 1.4rem;
  }

  .month-head p {
    font-size: 0.7rem;
    letter-spacing: 0.12em;
  }
}
</style>
