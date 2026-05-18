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
            <LeaveApprovalCard
              v-for="request in finalRequests"
              :key="request.id"
              :request="request"
              :format-date-range="formatDateRange"
              @open="openDetail"
            />
        </div>

        <ion-infinite-scroll
          :key="infiniteScrollKey"
          threshold="100px"
          :disabled="!hasMoreRequests || isLoadingMore"
          @ionInfinite="loadMore"
        >
          <ion-infinite-scroll-content
            loading-spinner="bubbles"
            loading-text="Loading more requests..."
          />
        </ion-infinite-scroll>
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
  IonIcon,
  IonButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from "@ionic/vue";
import {
  filterOutline,
  fileTrayOutline,
} from "ionicons/icons";
import LeaveRequestDetailModal from "@/components/leave/LeaveRequestDetailModal.vue";
import AppSkeleton from "@/components/common/AppSkeleton.vue";
import EmployeeFilterPanel from "@/components/common/EmployeeFilterPanel.vue";
import LeaveApprovalCard from "@/components/leave/LeaveApprovalCard.vue";
import { useLeaveApprovalsPage } from "@/composables/useLeaveApprovalsPage";

const {
  loading,
  showSkeleton,
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
  onEmployeeSearch,
  onEmployeeFocus,
  onEmployeeBlur,
  onEmployeeScroll,
  selectEmployee,
  removeEmployee,
} = useLeaveApprovalsPage();
</script>

<style scoped>
.request-list {
  padding-bottom: calc(env(safe-area-inset-bottom) + 20px);
}

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
