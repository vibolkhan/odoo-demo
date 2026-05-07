<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/profile"></ion-back-button>
        </ion-buttons>
        <ion-title>Leave Approvals</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="toggleFilters">
            <ion-icon slot="icon-only" :icon="filterOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Filter Panel -->
      <div v-if="showFilters" class="filter-panel">
        <div class="filter-item full">
          <label>Employee</label>
          <ion-searchbar
            v-model="employeeSearch"
            placeholder="Search employee..."
            @ionInput="onEmployeeSearch"
            @ionFocus="onEmployeeFocus"
            @ionBlur="onEmployeeBlur"
            class="custom-searchbar"
          ></ion-searchbar>
          <div
            v-if="
              employeeOptions.length > 0 && (employeeSearch || showAllEmployees)
            "
            class="employee-suggestions"
            @scroll="onEmployeeScroll"
          >
            <div
              v-for="emp in employeeOptions"
              :key="emp.id"
              class="suggestion-item"
              @click="selectEmployee(emp)"
            >
              {{ emp.name }}
            </div>
            <div v-if="loadingEmployees" class="suggestion-loading">
              <ion-spinner name="dots"></ion-spinner>
            </div>
          </div>
          <div
            v-if="selectedEmployees.length > 0"
            class="selected-tags-container"
          >
            <div
              v-for="emp in selectedEmployees"
              :key="emp.id"
              class="selected-tag"
            >
              <span>{{ emp.name }}</span>
              <ion-icon
                :icon="closeCircle"
                @click="removeEmployee(emp.id)"
              ></ion-icon>
            </div>
          </div>
        </div>

        <div class="date-grid">
          <DateInput v-model="dateFrom" placeholder="From" />
          <DateInput v-model="dateTo" placeholder="To" />
        </div>
      </div>

      <!-- Summary Stats -->
      <div v-if="showSkeleton" class="stats-summary stats-summary-skeleton">
        <div
          v-for="i in 3"
          :key="`leave-approval-stat-skeleton-${i}`"
          class="stat-item"
        >
          <AppSkeleton width="42px" height="24px" />
          <AppSkeleton width="56px" height="12px" margin="8px 0 0" />
        </div>
      </div>

      <div v-else-if="!loading" class="stats-summary">
        <div class="stat-item">
          <span class="stat-value">{{ filteredRequests.length }}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ pendingCount }}</span>
          <span class="stat-label">Pending</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ reviewCount }}</span>
          <span class="stat-label">Review</span>
        </div>
      </div>

      <!-- Status Quick Filter -->
      <div class="status-tabs">
        <button
          v-for="status in statusFilters"
          :key="status.id"
          class="status-tab"
          :class="{ active: activeStatus === status.id }"
          @click="activeStatus = status.id"
        >
          {{ status.label }}
        </button>
      </div>

      <div class="request-list">
        <div v-if="showSkeleton" class="record-grid">
          <div v-for="i in 5" :key="i" class="record-card skeleton-card">
            <div class="card-header">
              <div class="type-info">
                <AppSkeleton width="120px" height="18px" />
                <AppSkeleton width="80px" height="14px" margin="6px 0 0" />
              </div>
              <AppSkeleton width="60px" height="22px" shape="rect" />
            </div>
            <div class="card-body">
              <AppSkeleton width="160px" height="14px" />
              <AppSkeleton width="40px" height="24px" margin="8px 0 0" />
            </div>
          </div>
        </div>

        <div v-else-if="finalRequests.length === 0" class="empty-state">
          <ion-icon :icon="fileTrayOutline"></ion-icon>
          <p>No leave requests found.</p>
        </div>

        <div v-else class="record-grid">
          <div
            v-for="request in finalRequests"
            :key="request.id"
            class="record-card"
            @click="openDetail(request)"
          >
            <div class="card-header">
              <div class="type-info">
                <h3>{{ getLeaveTypeEnglishName(request.leaveType) }}</h3>
                <span class="employee-name">{{ request.employeeName }}</span>
              </div>
              <span class="status-badge" :class="badgeClass(request.state)">
                {{ formatStateLabel(request.state) }}
              </span>
            </div>

            <div class="card-body">
              <div class="date-row">
                <ion-icon :icon="calendarOutline"></ion-icon>
                <span>{{
                  formatDateRange(request.dateFrom, request.dateTo)
                }}</span>
              </div>

              <div class="duration-tag">
                {{ request.durationDisplay }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <LeaveRequestDetailModal
      :is-open="isDetailModalOpen"
      :request="selectedRequest"
      :manager-mode="true"
      @close="closeDetail"
      @updated="fetchRequests"
    />
  </ion-page>
</template>

<script setup>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonIcon,
  IonButton,
  IonSearchbar,
} from "@ionic/vue";
import { useNotification } from "@/composables/useNotification";
import {
  filterOutline,
  closeCircle,
  fileTrayOutline,
  calendarOutline,
  sparklesOutline,
} from "ionicons/icons";
import { ref, onMounted, watch, computed } from "vue";
import { useUserStore } from "@/stores/user.store";
import { useTimeoffStore } from "@/stores/timeoff.store";
import DateInput from "@/components/common/DateInput.vue";
import LeaveRequestDetailModal from "@/components/leave/LeaveRequestDetailModal.vue";
import AppSkeleton from "@/components/common/AppSkeleton.vue";
import { useMinimumSkeleton } from "@/composables/useMinimumSkeleton";

import { useDateTimeFormatter } from "@/composables/useDateTimeFormatter";

const userStore = useUserStore();
const timeoffStore = useTimeoffStore();
const requests = ref([]);
const loading = ref(true);
const { showToast } = useNotification();
const { showSkeleton } = useMinimumSkeleton(loading, 1000);

const { formatDateRange } = (function() {
  const { formatDate } = useDateTimeFormatter();
  return {
    formatDateRange: (start, end) => {
      const s = formatDate(start);
      // Remove year for start if it's the same year
      const e = formatDate(end);
      return s === e ? s : `${s} - ${e}`;
    }
  };
})();


// Filter State
const showFilters = ref(false);
const dateFrom = ref("");
const dateTo = ref("");
const employeeSearch = ref("");
const employeeOptions = ref([]);
const selectedEmployees = ref([]);
const activeStatus = ref("pending");

const statusFilters = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

const toggleFilters = () => {
  showFilters.value = !showFilters.value;
};

// Employee Search Logic
const employeeOffset = ref(0);
const hasMoreEmployees = ref(true);
const loadingEmployees = ref(false);
const showAllEmployees = ref(false);

const loadEmployees = async (reset = false) => {
  if (loadingEmployees.value) return;
  if (!reset && !hasMoreEmployees.value) return;

  loadingEmployees.value = true;
  if (reset) {
    employeeOffset.value = 0;
    employeeOptions.value = [];
  }

  try {
    const result = await userStore.fetchEmployees({
      query: employeeSearch.value,
      offset: employeeOffset.value,
      limit: 10,
    });

    employeeOptions.value = [...employeeOptions.value, ...result.records];
    hasMoreEmployees.value = result.hasMore;
    employeeOffset.value += 10;
    showAllEmployees.value = !employeeSearch.value;
  } catch (error) {
    console.error("Error loading employees:", error);
    await showToast("Failed to load employees list.", "danger");
  } finally {
    loadingEmployees.value = false;
  }
};

const onEmployeeSearch = () => {
  loadEmployees(true);
};

const onEmployeeFocus = () => {
  if (employeeOptions.value.length === 0) {
    loadEmployees(true);
  } else {
    showAllEmployees.value = true;
  }
};

const onEmployeeBlur = () => {
  setTimeout(() => {
    showAllEmployees.value = false;
  }, 200);
};

const onEmployeeScroll = (event) => {
  const target = event.target;
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 20) {
    loadEmployees();
  }
};

const selectEmployee = (emp) => {
  if (!selectedEmployees.value.find((e) => e.id === emp.id)) {
    selectedEmployees.value.push(emp);
  }
  employeeSearch.value = "";
  employeeOptions.value = [];
  showAllEmployees.value = false;
};

const removeEmployee = (empId) => {
  selectedEmployees.value = selectedEmployees.value.filter(
    (e) => e.id !== empId,
  );
};

const resetFilters = () => {
  dateFrom.value = "";
  dateTo.value = "";
  selectedEmployees.value = [];
  employeeSearch.value = "";
  loadEmployees(true);
};

// Data Fetching
const fetchRequests = async () => {
  loading.value = true;
  try {
    requests.value = await timeoffStore.fetchCompanyLeaveRequests();
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    await showToast("Failed to load leave requests.", "danger");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchRequests();
});

const handleRefresh = async (event) => {
  await fetchRequests();
  event.target.complete();
};

// Filtering Logic (Client-side to keep it simple)
const filteredRequests = computed(() => {
  return requests.value.filter((request) => {
    // Employee Filter
    const matchesEmployee =
      selectedEmployees.value.length === 0 ||
      selectedEmployees.value.some((e) => e.name === request.employeeName);

    if (!matchesEmployee) return false;

    // Date Filter
    if (dateFrom.value || dateTo.value) {
      const reqDate = new Date(request.dateFrom);
      if (dateFrom.value && reqDate < new Date(dateFrom.value)) return false;
      if (dateTo.value && reqDate > new Date(dateTo.value + "T23:59:59"))
        return false;
    }

    return true;
  });
});

const finalRequests = computed(() => {
  return filteredRequests.value.filter((request) => {
    if (activeStatus.value === "all") return true;
    if (activeStatus.value === "pending")
      return request.state === "confirm" || request.state === "validate1";
    if (activeStatus.value === "approved") return request.state === "validate";
    if (activeStatus.value === "rejected") return request.state === "refuse";
    return true;
  });
});

// Stats
const pendingCount = computed(
  () =>
    filteredRequests.value.filter(
      (r) => r.state === "confirm" || r.state === "validate1",
    ).length,
);
const reviewCount = computed(
  () => filteredRequests.value.filter((r) => r.state === "validate1").length,
);

// Detail Modal
const isDetailModalOpen = ref(false);
const selectedRequest = ref(null);

const openDetail = (request) => {
  selectedRequest.value = request;
  isDetailModalOpen.value = true;
};

const closeDetail = () => {
  isDetailModalOpen.value = false;
  selectedRequest.value = null;
};

// Utils
const getLeaveTypeEnglishName = (name) => name.split(" - ")[0] || name;

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

</script>

<style scoped>
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-secondary);
  text-align: center;
}

.empty-state ion-icon {
  font-size: 64px;
  color: #cbd5e1;
  margin-bottom: 16px;
}

.record-grid {
  display: grid;
  gap: 16px;
}

.record-card {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.record-card:active {
  transform: scale(0.98);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.type-info h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
}

.employee-name {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
}

.status-pending {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}
.status-review {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}
.status-approved {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}
.status-refused {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.date-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.date-row ion-icon {
  color: #3b82f6;
}

.duration-tag {
  background: var(--app-bg);
  color: var(--text-secondary);
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  width: fit-content;
}

/* Filter Styles */
.filter-panel {
  background: var(--card-bg);
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.filter-row {
  display: flex;
  gap: 12px;
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

.filter-item label {
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-left: 4px;
}

.custom-searchbar {
  --background: var(--app-bg);
  --border-radius: 14px;
  padding: 0;
}

.employee-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  z-index: 100;
  margin-top: 6px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 14px 16px;
  font-size: 0.9rem;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.suggestion-item:active {
  background: var(--app-bg);
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
  gap: 6px;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  padding: 6px 14px;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 700;
}

/* Stats Summary */
.stats-summary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 24px;
  padding: 24px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  color: white;
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.25);
  margin-bottom: 24px;
}

.stats-summary-skeleton {
  min-height: 108px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 900;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 700;
  opacity: 0.9;
  text-transform: uppercase;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: rgba(255, 255, 255, 0.2);
}

/* Status Tabs */
.status-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 4px 16px;
  scrollbar-width: none;
}

.status-tabs::-webkit-scrollbar {
  display: none;
}

.status-tab {
  padding: 10px 20px;
  border-radius: 14px;
  background: var(--border-color);
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 700;
  border: none;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.status-tab.active {
  background: #3b82f6;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}
</style>
