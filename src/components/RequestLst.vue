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
      <p>No leave requests in this filter.</p>
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
  </div>
</template>

<script setup lang="ts">
import { IonButton, IonIcon, IonSpinner } from "@ionic/vue";
import {
  alertCircleOutline,
  airplaneOutline,
  calendarClearOutline,
  fileTrayOutline,
  medkitOutline,
  personOutline,
  sparklesOutline,
} from "ionicons/icons";
import { computed, onMounted, ref } from "vue";
import { fetchLeaveRequests, type LeaveRequest } from "@/utils/leaveRequests";

type FilterId = "all" | "pending" | "review" | "attention";

const leaveRequests = ref<LeaveRequest[]>([]);
const isLoading = ref(false);
const errorMessage = ref("");
const activeFilter = ref<FilterId>("all");

const filters: Array<{ id: FilterId; label: string }> = [
  { id: "all", label: "All History" },
  { id: "pending", label: "Pending" },
  { id: "review", label: "Review" },
  { id: "attention", label: "Need Action" },
];

const displayedRequests = computed(() => {
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
  void loadLeaveRequests();
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

@media (max-width: 640px) {
  h1 {
    font-size: 1.65rem;
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
