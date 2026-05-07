<template>
  <ion-page>
    <ion-content :fullscreen="true" class="leave-balance-page">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <AppAsyncState :state="combinedState" @retry="loadData">
        <template #loading>
          <section class="balance-shell">
            <div class="page-header">
              <div>
                <p class="eyebrow">Employee Portal</p>
                <h1>Leave Balance</h1>
              </div>
            </div>
            <div class="loading-skeletons">
              <div v-for="i in 3" :key="i" class="skeleton-item">
                <AppSkeleton shape="squircle" width="48px" height="48px" />
                <div style="flex: 1">
                  <AppSkeleton width="60%" height="20px" />
                  <AppSkeleton width="100%" height="8px" margin="10px 0" />
                  <AppSkeleton width="40%" height="12px" />
                </div>
              </div>
            </div>
          </section>
        </template>

        <section class="balance-shell">
          <div class="page-header">
            <div>
              <p class="eyebrow">Employee Portal</p>
              <h1>Leave Balance</h1>
            </div>
          </div>

          <div v-if="allocations.length === 0" class="empty-state">
            <div class="empty-icon">
              <ion-icon :icon="calendarOutline" />
            </div>
            <h3>No Allocations Found</h3>
            <p>You don't have any active leave allocations for this period.</p>
          </div>

          <template v-else>
            <div class="summary-card">
              <div class="summary-main">
                <div class="summary-info">
                  <span>Total Remaining</span>
                  <strong>{{ formatDays(totalRemaining) }} Days</strong>
                </div>
                <div class="summary-visual">
                  <div class="progress-ring">
                    <svg viewBox="0 0 36 36" class="circular-chart">
                      <path
                        class="circle-bg"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        class="circle"
                        :stroke-dasharray="`${usagePercentage}, 100`"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <text x="18" y="20.35" class="percentage">
                        {{ usagePercentage }}%
                      </text>
                    </svg>
                  </div>
                </div>
              </div>
              <div class="summary-footer">
                <div class="footer-stat">
                  <span class="dot used"></span>
                  <span>Allocated: {{ formatDays(totalEntitlement) }}d</span>
                </div>
                <div class="footer-stat">
                  <span class="dot pending"></span>
                  <span>Taken: {{ formatDays(totalTaken) }}d</span>
                </div>
              </div>
            </div>

            <div class="section-title">
              <h2>By Leave Type</h2>
            </div>

            <div class="balance-list">
              <div v-for="item in balances" :key="item.id" class="balance-item">
                <div
                  class="item-icon"
                  :style="{ backgroundColor: item.color + '15', color: item.color }"
                >
                  <ion-icon :icon="item.icon" />
                </div>
                <div class="item-content">
                  <div class="item-header">
                    <div class="item-title-group">
                      <h3>{{ getLeaveTypeEnglishName(item.name) }}</h3>
                      <span
                        v-if="getLeaveTypeKhmerName(item.name)"
                        class="khmer-item-name"
                        >{{ getLeaveTypeKhmerName(item.name) }}</span
                      >
                    </div>
                    <span class="item-total"
                      >{{ formatDays(item.available) }} /
                      {{ formatDays(item.entitlement) }}</span
                    >
                  </div>
                  <div class="item-progress">
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        :style="{
                          width:
                            item.entitlement > 0
                              ? (item.available / item.entitlement) * 100 + '%'
                              : '0%',
                          backgroundColor: item.color,
                        }"
                      ></div>
                    </div>
                  </div>
                  <div class="item-details">
                    <span class="taken-stat"
                      >Taken: {{ formatDays(item.taken) }}d</span
                    >
                    <span v-if="item.dateTo">Until {{ item.dateTo }}</span>
                    <span v-else>No Expiry</span>
                    <span class="state-tag" :class="item.state">{{
                      item.state
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </section>
      </AppAsyncState>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonContent,
  IonPage,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
} from "@ionic/vue";
import { useNotification } from "@/composables/useNotification";
import AppSkeleton from "@/components/AppSkeleton.vue";
import AppAsyncState from "@/components/AppAsyncState.vue";
import {
  calendarOutline,
  medicalOutline,
  airplaneOutline,
  briefcaseOutline,
  alertCircleOutline,
  sparklesOutline,
} from "ionicons/icons";
import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useTimeoffStore } from "@/stores/timeoff.store";

import { useLeaveBalance } from "@/composables/useLeaveBalance";
import { formatDays } from "@/utils/date";

const timeoffStore = useTimeoffStore();
const {
  leaveAllocations: allocations,
  leaveRequests: requests,
} = storeToRefs(timeoffStore);

const combinedState = computed(() => {
  const states = [
    timeoffStore.asyncStates.leaveAllocations,
    timeoffStore.asyncStates.leaveRequests,
  ];
  if (states.some((s) => s.status === "loading")) return { status: "loading" };
  const errorState = states.find((s) => s.status === "error");
  if (errorState) return errorState;
  return { status: "success" };
});

const { showToast } = useNotification();
const {
  getLeaveTypeEnglishName,
  getLeaveTypeKhmerName,
  totalEntitlement,
  totalTaken,
  totalRemaining,
  usagePercentage,
  balances,
} = useLeaveBalance();

const loadData = async () => {
  try {
    await Promise.all([
      timeoffStore.fetchLeaveAllocations(),
      timeoffStore.fetchLeaveRequests(),
    ]);
  } catch (err) {
    console.error("Failed to load leave data:", err);
    await showToast("Failed to load leave balance data.", "danger");
  }
};

const handleRefresh = async (event) => {
  await loadData();
  event.target.complete();
};

onMounted(loadData);
</script>

<style scoped>
.leave-balance-page {
  --background: var(--app-bg);
  background-image: radial-gradient(
    circle at top left,
    rgba(46, 102, 219, 0.12),
    transparent 40%
  );
  --padding-top: calc(env(safe-area-inset-top) + 20px);
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-bottom: calc(env(safe-area-inset-bottom) + 100px);
}

.header-loader {
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #b91c1c;
}

.error-banner p {
  margin: 0;
  flex: 1;
  font-size: 0.9rem;
  font-weight: 600;
}

.error-banner button {
  background: #b91c1c;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
}

.taken-stat {
  color: #e11d48;
  font-weight: 700 !important;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  background: var(--card-bg);
  border-radius: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  font-size: 4rem;
  color: #cbd5e1;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px;
  font-weight: 800;
  color: var(--text-primary);
}

.empty-state p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.loading-skeletons {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-item {
  background: var(--card-bg);
  border-radius: 24px;
  padding: 16px;
  display: flex;
  gap: 16px;
}

.state-tag {
  margin-left: auto;
  font-size: 0.65rem;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 100px;
  background: var(--border-color);
  color: var(--text-secondary);
}

.state-tag.validate {
  background: #dcfce7;
  color: #15803d;
}

.state-tag.confirm {
  background: #fef9c3;
  color: #854d0e;
}

.balance-shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  margin-bottom: 8px;
}

.eyebrow {
  margin: 0 0 4px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

h1 {
  margin: 0;
  font-size: clamp(1.65rem, 5vw, 1.95rem);
  line-height: 1.12;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.summary-card {
  background: var(--card-bg);
  border-radius: 30px;
  padding: 24px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
}

.summary-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.summary-info span {
  display: block;
  font-size: 1rem;
  color: var(--text-secondary);
  font-weight: 600;
  margin-bottom: 4px;
}

.summary-info strong {
  display: block;
  font-size: 1.25rem;
  color: var(--text-primary);
  font-weight: 850;
}

.progress-ring {
  width: 80px;
  height: 80px;
}

.circular-chart {
  display: block;
  margin: 10px auto;
  max-width: 100%;
  max-height: 250px;
}

.circle-bg {
  fill: none;
  stroke: var(--border-color);
  stroke-width: 3.8;
}

.circle {
  fill: none;
  stroke: #2e66db;
  stroke-width: 3.8;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s ease;
}

.percentage {
  fill: var(--text-primary);
  font-family: inherit;
  font-size: 0.5rem;
  font-weight: 800;
  text-anchor: middle;
}

.summary-footer {
  display: flex;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.footer-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.used {
  background: #2e66db;
}
.dot.pending {
  background: #f59e0b;
}

.section-title h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 750;
  color: var(--text-primary);
}

.balance-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.balance-item {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  padding: 16px;
  display: flex;
  gap: 16px;
  transition: transform 0.2s ease;
}

.balance-item:active {
  transform: scale(0.98);
}

.item-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-header h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 750;
  color: var(--text-primary);
}

.item-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.khmer-item-name {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.item-total {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.item-progress {
  margin-bottom: 8px;
}

.progress-bar {
  height: 6px;
  background: var(--border-color);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
}

.item-details {
  display: flex;
  gap: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}
</style>
