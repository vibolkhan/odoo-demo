<template>
  <div class="request-list-shell">
    <section class="filter-strip" aria-label="Request filters">
      <button
        v-for="filter in filters"
        :key="filter.id"
        type="button"
        class="filter-chip"
        :class="{ active: activeFilter === filter.id }"
        @click="activeFilter = filter.id"
      >
        {{ filter.label }}
      </button>
    </section>

    <div class="filter-toggle-row">
      <button
        type="button"
        class="filter-toggle-text"
        :class="{ active: showAdvancedFilters }"
        @click="showAdvancedFilters = !showAdvancedFilters"
      >
        Filter
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

      <div class="filter-field">
        <label class="filter-label" for="date-from-filter">From</label>
        <ion-item id="date-from-filter" lines="none" class="filter-input-shell">
          <ion-input v-model="dateFromFilter" type="date" />
        </ion-item>
      </div>

      <div class="filter-field">
        <label class="filter-label" for="date-to-filter">To</label>
        <ion-item id="date-to-filter" lines="none" class="filter-input-shell">
          <ion-input v-model="dateToFilter" type="date" />
        </ion-item>
      </div>

      <ion-button
        fill="outline"
        class="clear-filters-button"
        :disabled="!hasActiveAdvancedFilters"
        @click="clearAdvancedFilters"
      >
        Clear
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
      <ion-button fill="outline" @click="loadLeaveRequests"
        >Try Again</ion-button
      >
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
          <h4>{{ group.label }}</h4>
          <p>{{ group.requests.length }} REQUESTS</p>
        </header>

        <div class="month-stack">
          <article
            v-for="request in group.requests"
            :key="request.id"
            class="request-card"
          >
            <div class="card-main">
              <div class="type-tile" :class="tileTone(request.leaveType)">
                <ion-icon
                  :icon="requestTypeIcon(request.leaveType)"
                  aria-hidden="true"
                />
              </div>

              <div class="request-copy">
                <h5>{{ request.leaveType }}</h5>
                <p v-if="request.employeeName" class="employee-name">
                  {{ request.employeeName }}
                </p>
                <p class="request-dates">
                  {{ formatDateRange(request.dateFrom, request.dateTo) }}
                </p>
                <span class="status-pill" :class="badgeClass(request.state)">
                  {{ formatStateLabel(request.state) }}
                </span>
              </div>

              <!-- <div class="request-side">
                <p class="duration-number">
                  {{ formatDurationValue(request) }}
                </p>
                <p class="duration-text">{{ formatDurationLabel(request) }}</p>
              </div> -->
            </div>
          </article>
        </div>
      </section>
    </section>

    <ion-modal
      :is-open="isEmployeeSearchOpen"
      css-class="employee-search-overlay"
      @didDismiss="closeEmployeeSearch"
    >
      <ion-content class="employee-search-modal" :scroll-y="true">
        <div class="employee-search-sticky">
          <div class="employee-search-header">
            <h3>Select Employee</h3>
            <ion-button fill="clear" size="small" @click="clearEmployeeFilter">
              All employees
            </ion-button>
          </div>

          <ion-searchbar
            v-model="employeeSearchQuery"
            placeholder="Search by name, company, or department"
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
              <p>{{ employee.name }}</p>
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
  fileTrayOutline,
  medkitOutline,
  personOutline,
  sparklesOutline,
} from "ionicons/icons";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { fetchEmployees, type EmployeeOption } from "@/utils/employees";
import { fetchLeaveRequests, type LeaveRequest } from "@/utils/leaveRequests";

type FilterId = "all" | "pending" | "review" | "attention";

const leaveRequests = ref<LeaveRequest[]>([]);
const employees = ref<EmployeeOption[]>([]);
const isLoading = ref(false);
const errorMessage = ref("");
const activeFilter = ref<FilterId>("all");
const selectedEmployeeId = ref<number | null>(null);
const selectedEmployeeDetails = ref<EmployeeOption | null>(null);
const showAdvancedFilters = ref(true);
const dateFromFilter = ref("");
const dateToFilter = ref("");
const isLoadingEmployees = ref(false);
const isLoadingMoreEmployees = ref(false);
const hasMoreEmployees = ref(true);
const employeeErrorMessage = ref("");
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

    if (!matchesEmployee) {
      return false;
    }

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
    if (isLoadingMoreEmployees.value || !hasMoreEmployees.value) {
      return;
    }

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
    if (requestId !== employeeLoadRequestId) {
      return;
    }

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
  clearEmployeeFilter();
  dateFromFilter.value = "";
  dateToFilter.value = "";
};

const formatDate = (value: string) => {
  const date = parseRequestDate(value);

  if (!date) {
    return value || "-";
  }

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
  if (!value) {
    return null;
  }

  const normalizedValue = value.includes(" ") ? value.replace(" ", "T") : value;
  const date = new Date(normalizedValue);

  return Number.isNaN(date.getTime()) ? null : date;
};

const parseFilterDate = (value: string) => {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const getRequestSortValue = (request: LeaveRequest) =>
  parseRequestDate(request.dateFrom)?.getTime() ?? 0;

const extractDurationDays = (request: LeaveRequest) => {
  const matchedValue = request.durationDisplay.match(/\d+(\.\d+)?/);

  if (matchedValue) {
    return Number(matchedValue[0]);
  }

  const start = parseRequestDate(request.dateFrom);
  const end = parseRequestDate(request.dateTo);

  if (!start || !end) {
    return 0;
  }

  const startOnly = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const dayDifference =
    Math.round((endOnly.getTime() - startOnly.getTime()) / 86400000) + 1;

  return Math.max(dayDifference, 0);
};

const formatDurationValue = (request: LeaveRequest) => {
  const days = extractDurationDays(request);

  if (!days) {
    return "-";
  }

  return Number.isInteger(days) ? String(days) : days.toFixed(1);
};

const formatDurationLabel = (request: LeaveRequest) => {
  const days = extractDurationDays(request);

  return days === 1 ? "DAY TOTAL" : "DAYS TOTAL";
};

const requestTypeIcon = (leaveType: string) => {
  const normalizedType = leaveType.toLowerCase();

  if (normalizedType.includes("sick")) {
    return medkitOutline;
  }

  if (normalizedType.includes("personal")) {
    return personOutline;
  }

  if (normalizedType.includes("annual")) {
    return calendarClearOutline;
  }

  if (normalizedType.includes("unpaid")) {
    return airplaneOutline;
  }

  return sparklesOutline;
};

const tileTone = (leaveType: string) => {
  const normalizedType = leaveType.toLowerCase();

  if (normalizedType.includes("sick")) {
    return "tone-blue";
  }

  if (normalizedType.includes("personal")) {
    return "tone-coral";
  }

  if (normalizedType.includes("annual")) {
    return "tone-lilac";
  }

  return "tone-sand";
};

onMounted(() => {
  void loadEmployees(true);
  void loadLeaveRequests();
});

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
  gap: 22px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8a96a8;
}

h1,
h2 {
  margin: 0;
  color: #2f3947;
}

h1 {
  font-size: 1.9rem;
  font-weight: 800;
}

.refresh-button {
  --color: #4067c8;
  --background: rgba(64, 103, 200, 0.1);
  --border-radius: 999px;
  --box-shadow: none;
  min-height: 44px;
  font-weight: 700;
  text-transform: none;
}

.filter-strip {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(140px, 1fr);
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.filter-strip::-webkit-scrollbar {
  display: none;
}

.filter-toggle-row {
  display: flex;
  justify-content: flex-end;
}

.filter-toggle-text {
  border: 0;
  padding: 0;
  background: transparent;
  color: #7a8697;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
}

.filter-toggle-text.active {
  color: #355fc3;
}

.filter-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) repeat(2, minmax(0, 1fr)) auto;
  gap: 12px;
  align-items: end;
}

.filter-field {
  display: grid;
  gap: 8px;
}

.filter-message {
  margin: -6px 0 0;
  font-size: 0.88rem;
}

.filter-label {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #7a8697;
}

.filter-input-shell {
  --background: rgba(255, 255, 255, 0.96);
  --border-radius: 18px;
  --padding-start: 14px;
  --inner-padding-end: 14px;
  --min-height: 54px;
  box-shadow: 0 10px 28px rgba(31, 58, 97, 0.05);
}

.filter-input-shell ion-select,
.filter-input-shell ion-input {
  width: 100%;
}

.searchable-trigger {
  cursor: pointer;
}

.searchable-input {
  pointer-events: none;
}

.clear-filters-button {
  min-height: 54px;
  --border-radius: 18px;
  --border-color: #cad5e4;
  --color: #4f6178;
  font-weight: 700;
  text-transform: none;
}

.filter-chip {
  border: 0;
  border-radius: 20px;
  min-height: 52px;
  padding: 0 24px;
  background: #e7edf5;
  color: #627080;
  font-size: 1rem;
  font-weight: 700;
  white-space: nowrap;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
}

.filter-chip.active {
  background: #355fc3;
  color: #fff;
}

.request-list {
  display: grid;
  gap: 26px;
}

.month-group {
  display: grid;
  gap: 14px;
}

.month-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.month-head h2 {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.05;
}

.month-head p {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  color: #7f8a99;
  text-transform: uppercase;
}

.month-stack {
  display: grid;
  gap: 16px;
}

.request-card {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.94);
  border-left: 6px solid #2e6aeb;
  box-shadow: 0 14px 34px rgba(31, 58, 97, 0.06);
}

.card-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background: linear-gradient(180deg, #2b65dd 0%, #2e6aeb 100%);
}

.card-main {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  align-items: start;
  gap: 16px;
  min-height: 150px;
  padding: 22px 22px 20px 20px;
}

.type-tile {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  font-size: 1.6rem;
  background: #eaf1fb;
  color: #2e66db;
}

.tone-lilac {
  background: #eaf1fb;
  color: #2e66db;
}

.tone-blue {
  background: #edf3fb;
  color: #536174;
}

.tone-coral {
  background: #eef3fb;
  color: #4e6178;
}

.tone-sand {
  background: #eef3fb;
  color: #5e6f84;
}

.request-copy {
  min-width: 0;
  /* padding-top: 2px; */
}

.request-copy h5 {
  margin: 0;
  line-height: 1.12;
  color: #313b48;
}

.employee-name {
  margin: 6px 0 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #2e66db;
}

.request-dates {
  margin: 8px 0 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #6d7786;
}

.request-side {
  display: grid;
  justify-items: end;
  align-self: end;
  gap: 0;
  min-width: 64px;
  padding-top: 48px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  margin-top: 16px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.status-pending {
  background: #d8cbfa;
  color: #6a5b96;
}

.status-review {
  background: #dfe9f7;
  color: #6a7888;
}

.duration-number {
  margin: 0;
  font-size: 3rem;
  font-weight: 900;
  line-height: 1;
  color: #2e66db;
}

.duration-text {
  margin: 0;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #8d98a7;
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

.employee-search-modal {
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

.employee-search-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.employee-search-sticky {
  position: sticky;
  top: 0;
  z-index: 10;
  padding-top: 4px;
  background: var(--ion-background-color, #fff);
}

.employee-search-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #152437;
}

.employee-results {
  margin-top: 10px;
  background: transparent;
  padding-bottom: 28px;
}

.employee-option {
  --border-radius: 16px;
  --background: #f7f9fc;
  margin-bottom: 10px;
}

.employee-option p {
  margin: 4px 0 0;
  color: #5b6c81;
  font-size: 0.9rem;
}

.employee-empty-state {
  padding: 24px 6px 8px;
  text-align: center;
  color: #6c7b8d;
}

@media (max-width: 640px) {
  h1 {
    font-size: 1.65rem;
  }

  .filter-panel {
    grid-template-columns: 1fr;
  }

  .page-head {
    align-items: flex-start;
  }

  .month-head h2 {
    font-size: 1.75rem;
  }

  .month-head p {
    font-size: 0.76rem;
    letter-spacing: 0.12em;
  }

  .card-main {
    grid-template-columns: 56px minmax(0, 1fr);
    padding: 20px 18px 18px;
  }

  .request-dates {
    font-size: 1rem;
  }

  .request-side {
    grid-column: 2;
    justify-items: end;
    min-width: 100%;
    padding-top: 12px;
  }

  .duration-number {
    font-size: 2.5rem;
  }
}
</style>
