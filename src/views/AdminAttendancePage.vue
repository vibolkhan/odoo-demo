<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab3"></ion-back-button>
        </ion-buttons>
        <ion-title>All Attendances</ion-title>
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
              employeeOptions.length > 0 &&
              (employeeSearch || showAllEmployees)
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
      <div v-if="records.length > 0 && !loading" class="stats-summary">
        <div class="stat-item">
          <span class="stat-value">{{ totalWorkedHours.toFixed(1) }}</span>
          <span class="stat-label">Total Hours</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ records.length }}</span>
          <span class="stat-label">Records</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ totalOvertimeHours.toFixed(1) }}</span>
          <span class="stat-label">OT Hours</span>
        </div>
      </div>

      <div class="attendance-list">
        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Loading attendances...</p>
        </div>

        <div v-else-if="records.length === 0" class="empty-state">
          <ion-icon :icon="listOutline"></ion-icon>
          <p>No attendance records found.</p>
        </div>

        <div v-else class="record-grid">
          <div
            v-for="record in records"
            :key="record.id"
            class="record-card"
            @click="openDetail(record.id)"
          >
            <div class="card-header">
              <h3>{{ getEmployeeName(record) }}</h3>
              <span
                class="status-badge"
                :class="record.check_out ? 'checked-out' : 'checked-in'"
              >
                {{ record.check_out ? "Completed" : "Working" }}
              </span>
            </div>

            <div class="card-body">
              <div class="time-row">
                <div class="time-col">
                  <span class="label">Check In</span>
                  <span class="value">{{
                    formatDateTime(record.check_in)
                  }}</span>
                </div>
                <div class="time-col" v-if="record.check_out">
                  <span class="label">Check Out</span>
                  <span class="value">{{
                    formatDateTime(record.check_out)
                  }}</span>
                </div>
              </div>

              <div class="stats-row" v-if="record.worked_hours">
                <span class="worked-hours">
                  <ion-icon :icon="timeOutline"></ion-icon>
                  {{ formatHours(record.worked_hours) }} hrs
                </span>
                <span class="overtime" v-if="record.overtime_hours > 0">
                  +{{ formatHours(record.overtime_hours) }} OT
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
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
  IonToggle,
  IonLabel,
  modalController,
} from "@ionic/vue";
import {
  timeOutline,
  listOutline,
  filterOutline,
  closeCircle,
  chevronDownOutline,
} from "ionicons/icons";
import { ref, onMounted, watch, computed } from "vue";
import { useAuthStore } from "@/stores/auth.store";
import { useUserStore } from "@/stores/user.store";
import AttendanceDetailModal from "@/components/AttendanceDetailModal.vue";
import DateInput from "@/components/DateInput.vue";

const authStore = useAuthStore();
const userStore = useUserStore();
const records = ref([]);
const loading = ref(true);

// Computed Totals
const totalWorkedHours = computed(() =>
  records.value.reduce((sum, r) => sum + (r.worked_hours || 0), 0),
);

const totalOvertimeHours = computed(() =>
  records.value.reduce((sum, r) => sum + (r.overtime_hours || 0), 0),
);

// Filter State
const showFilters = ref(false);
const dateFrom = ref("");
const dateTo = ref("");
const isMyTeam = ref(false);
const employeeSearch = ref("");
const employeeOptions = ref([]);
const selectedEmployees = ref([]);

const toggleFilters = () => {
  showFilters.value = !showFilters.value;
};

const onEmployeeFocus = () => {
  if (employeeOptions.value.length === 0) {
    loadEmployees(true);
  } else {
    showAllEmployees.value = true;
  }
};

const onEmployeeBlur = () => {
  // Delay hiding to allow click event on suggestions to fire
  setTimeout(() => {
    showAllEmployees.value = false;
  }, 200);
};

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
  } finally {
    loadingEmployees.value = false;
  }
};

const onEmployeeSearch = async (event) => {
  employeeSearch.value = event.target.value;
  loadEmployees(true);
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
  isMyTeam.value = false;
  selectedEmployees.value = [];
  employeeSearch.value = "";
  loadEmployees(true);
};

// Automatic filter application
watch(
  [selectedEmployees, dateFrom, dateTo, isMyTeam],
  () => {
    fetchAttendances();
  },
  { deep: true },
);

onMounted(() => {
  fetchAttendances();
});

const handleRefresh = async (event) => {
  await fetchAttendances();
  event.target.complete();
};

async function fetchAttendances() {
  loading.value = true;
  try {
    const uid = Number(authStore.userId);

    // Build dynamic domain
    const domain = [["employee_id.active", "=", true]];

    if (selectedEmployees.value.length > 0) {
      domain.push([
        "employee_id",
        "in",
        selectedEmployees.value.map((e) => e.id),
      ]);
    }

    if (isMyTeam.value) {
      domain.push(["employee_id.parent_id.user_id", "=", uid]);
    }

    if (dateFrom.value) {
      domain.push(["check_in", ">=", dateFrom.value + " 00:00:00"]);
    }

    if (dateTo.value) {
      domain.push(["check_in", "<=", dateTo.value + " 23:59:59"]);
    }

    const result = await userStore.fetchAllAttendances(domain);
    records.value = result;
  } catch (error) {
    console.error("Error fetching attendances:", error);
  } finally {
    loading.value = false;
  }
}

async function openDetail(recordId) {
  const modal = await modalController.create({
    component: AttendanceDetailModal,
    componentProps: {
      recordId,
    },
  });
  await modal.present();
}

function getEmployeeName(record) {
  if (
    record.employee_id &&
    typeof record.employee_id === "object" &&
    record.employee_id.display_name
  ) {
    return record.employee_id.display_name;
  }
  return "Unknown Employee";
}

function formatDateTime(dateStr) {
  if (!dateStr) return "N/A";

  // Odoo returns UTC times without 'Z'. We append 'Z' to parse it correctly as UTC.
  const date = new Date(dateStr + "Z");
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHours(hours) {
  if (!hours) return "0.0";
  return hours.toFixed(2);
}
</script>

<style scoped>
.attendance-list {
  padding-bottom: 20px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-secondary);
  text-align: center;
}

.empty-state ion-icon {
  font-size: 48px;
  color: #cbd5e1;
  margin-bottom: 12px;
}

.record-grid {
  display: grid;
  gap: 16px;
}

.record-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.record-card:active {
  transform: scale(0.98);
  background: var(--app-bg);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.status-badge {
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.status-badge.checked-in {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.status-badge.checked-out {
  background: var(--border-color);
  color: var(--text-secondary);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.time-row {
  display: flex;
  gap: 24px;
}

.time-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.time-col .label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
}

.time-col .value {
  font-size: 0.95rem;
  color: var(--text-primary);
  font-weight: 500;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-color);
}

.worked-hours {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  padding: 4px 10px;
  border-radius: 8px;
}

.overtime {
  font-size: 0.85rem;
  font-weight: 600;
  color: #d97706;
  background: rgba(245, 158, 11, 0.1);
  padding: 4px 10px;
  border-radius: 8px;
}

/* Filter Styles */
.filter-panel {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
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
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-left: 4px;
}

.custom-searchbar {
  --background: var(--app-bg);
  --border-radius: 12px;
  padding: 0;
  height: 44px;
}

.employee-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
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
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:active {
  background: var(--border-color);
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
  background: rgba(37, 99, 235, 0.1);
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

.team-toggle {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px;
}

.team-toggle ion-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}

ion-button {
  --border-radius: 10px;
  font-weight: 700;
}

/* Stats Summary */
.stats-summary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  color: white;
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2);
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 800;
}

.stat-label {
  font-size: 0.7rem;
  font-weight: 600;
  opacity: 0.85;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
}
</style>
