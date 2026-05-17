<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/profile"></ion-back-button>
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

      <EmployeeFilterPanel
        v-if="showFilters"
        v-model:date-from="dateFrom"
        v-model:date-to="dateTo"
        :employee-search="employeeSearch"
        :employee-options="employeeOptions"
        :selected-employees="selectedEmployees"
        :loading-employees="loadingEmployees"
        :show-all-employees="showAllEmployees"
        @employee-search="onEmployeeSearch"
        @employee-focus="onEmployeeFocus"
        @employee-blur="onEmployeeBlur"
        @employee-scroll="onEmployeeScroll"
        @select-employee="selectEmployee"
        @remove-employee="removeEmployee"
      />

      <AppAsyncState :state="attendanceState" @retry="fetchAttendances">
        <template #loading>
          <!-- Summary Stats Skeleton -->
          <div class="stats-summary stats-summary-skeleton">
            <div v-for="i in 3" :key="`admin-attendance-stat-skeleton-${i}`" class="stat-item">
              <AppSkeleton width="42px" height="24px" />
              <AppSkeleton width="60px" height="12px" margin="8px 0 0" />
            </div>
          </div>
          
          <div class="record-grid">
            <div v-for="i in 6" :key="i" class="record-card skeleton-card">
              <div class="card-header">
                <div class="header-left">
                  <AppSkeleton shape="squircle" width="32px" height="32px" />
                  <AppSkeleton width="120px" height="18px" />
                </div>
                <AppSkeleton width="60px" height="20px" shape="rect" />
              </div>
              <div class="card-body">
                <div class="time-row">
                  <AppSkeleton width="80px" height="14px" />
                  <AppSkeleton width="80px" height="14px" />
                </div>
                <div class="stats-row">
                  <AppSkeleton width="60px" height="24px" />
                </div>
              </div>
            </div>
          </div>
        </template>

        <div class="attendance-list">
          <div v-if="records.length > 0" class="stats-summary">
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

          <AppEmptyState
            v-if="records.length === 0"
            :icon="listOutline"
            title="No results found"
            description="We couldn't find any attendance records matching your current filter criteria."
            variant="slate"
          />

          <div v-else class="record-grid">
            <AdminAttendanceCard
              v-for="record in records"
              :key="record.id"
              :record="record"
              :employee-name="getEmployeeName(record)"
              @open="openDetail"
            />
          </div>

          <ion-infinite-scroll
            :key="infiniteScrollKey"
            threshold="100px"
            :disabled="!userStore.allAttendancePagination.hasMore || isLoadingMore"
            @ionInfinite="loadMore"
          >
            <ion-infinite-scroll-content
              loading-spinner="bubbles"
              loading-text="Loading more attendances..."
            />
          </ion-infinite-scroll>
        </div>
      </AppAsyncState>
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
  IonIcon,
  IonButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from "@ionic/vue";
import {
  listOutline,
  filterOutline,
} from "ionicons/icons";
import AppSkeleton from "@/components/common/AppSkeleton.vue";
import AppEmptyState from "@/components/common/AppEmptyState.vue";
import AppAsyncState from "@/components/common/AppAsyncState.vue";
import EmployeeFilterPanel from "@/components/common/EmployeeFilterPanel.vue";
import AdminAttendanceCard from "@/components/attendance/AdminAttendanceCard.vue";
import { useAdminAttendancePage } from "@/composables/useAdminAttendancePage";

const {
  userStore,
  records,
  isLoadingMore,
  infiniteScrollKey,
  showFilters,
  dateFrom,
  dateTo,
  employeeSearch,
  employeeOptions,
  selectedEmployees,
  loadingEmployees,
  showAllEmployees,
  totalWorkedHours,
  totalOvertimeHours,
  attendanceState,
  toggleFilters,
  fetchAttendances,
  loadMore,
  handleRefresh,
  openDetail,
  getEmployeeName,
  onEmployeeSearch,
  onEmployeeFocus,
  onEmployeeBlur,
  onEmployeeScroll,
  selectEmployee,
  removeEmployee,
} = useAdminAttendancePage();
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
  align-items: center;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
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

.stats-summary-skeleton {
  min-height: 96px;
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
