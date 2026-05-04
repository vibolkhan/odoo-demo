<template>
  <ion-page>
    <ion-content :fullscreen="true" class="leave-balance-page">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      <section class="balance-shell">
        <div class="page-header">
          <div>
            <p class="eyebrow">Employee Portal</p>
            <h1>Leave Balance</h1>
          </div>
          <div v-if="loading.leaveAllocations || loading.leaveRequests" class="header-loader">
            <ion-spinner name="crescent" />
          </div>
        </div>

        <div v-if="error.leaveAllocations || error.leaveRequests" class="error-banner">
          <ion-icon :icon="alertCircleOutline" />
          <p>{{ error.leaveAllocations || error.leaveRequests }}</p>
          <button @click="loadData">Retry</button>
        </div>

        <div v-if="!loading.leaveAllocations && !loading.leaveRequests && !(error.leaveAllocations || error.leaveRequests) && allocations.length === 0" class="empty-state">
          <div class="empty-icon">
            <ion-icon :icon="calendarOutline" />
          </div>
          <h3>No Allocations Found</h3>
          <p>You don't have any active leave allocations for this period.</p>
        </div>

        <div v-if="!loading.leaveAllocations && !loading.leaveRequests && !(error.leaveAllocations || error.leaveRequests) && allocations.length > 0" class="summary-card">
          <div class="summary-main">
            <div class="summary-info">
              <span>Total Remaining</span>
              <strong>{{ formatDays(totalRemaining) }} Days</strong>
            </div>
            <div class="summary-visual">
              <div class="progress-ring">
                <svg viewBox="0 0 36 36" class="circular-chart">
                  <path class="circle-bg"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path class="circle"
                    :stroke-dasharray="`${usagePercentage}, 100`"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" class="percentage">{{ usagePercentage }}%</text>
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

        <div v-if="!loading.leaveAllocations && !loading.leaveRequests && !(error.leaveAllocations || error.leaveRequests) && allocations.length > 0" class="section-title">
          <h2>By Leave Type</h2>
        </div>

        <div v-if="!loading.leaveAllocations && !loading.leaveRequests && !(error.leaveAllocations || error.leaveRequests)" class="balance-list">
          <div v-for="item in balances" :key="item.id" class="balance-item">
            <div class="item-icon" :style="{ backgroundColor: item.color + '15', color: item.color }">
              <ion-icon :icon="item.icon" />
            </div>
            <div class="item-content">
              <div class="item-header">
                <div class="item-title-group">
                  <h3>{{ getLeaveTypeEnglishName(item.name) }}</h3>
                  <span v-if="getLeaveTypeKhmerName(item.name)" class="khmer-item-name">{{ getLeaveTypeKhmerName(item.name) }}</span>
                </div>
                <span class="item-total">{{ formatDays(item.available) }} / {{ formatDays(item.entitlement) }}</span>
              </div>
              <div class="item-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: item.entitlement > 0 ? (item.available / item.entitlement * 100) + '%' : '0%', backgroundColor: item.color }"></div>
                </div>
              </div>
              <div class="item-details">
                <span class="taken-stat">Taken: {{ formatDays(item.taken) }}d</span>
                <span v-if="item.dateTo">Until {{ item.dateTo }}</span>
                <span v-else>No Expiry</span>
                <span class="state-tag" :class="item.state">{{ item.state }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading.leaveAllocations || loading.leaveRequests" class="loading-skeletons">
          <div v-for="i in 3" :key="i" class="skeleton-item">
            <ion-skeleton-text animated style="width: 48px; height: 48px; border-radius: 16px" />
            <div style="flex: 1">
              <ion-skeleton-text animated style="width: 60%; height: 20px" />
              <ion-skeleton-text animated style="width: 100%; height: 8px; margin: 10px 0" />
              <ion-skeleton-text animated style="width: 40%; height: 12px" />
            </div>
          </div>
        </div>
      </section>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonContent,
  IonPage,
  IonIcon,
  IonSpinner,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
} from "@ionic/vue";
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

const timeoffStore = useTimeoffStore();
const {
  leaveAllocations: allocations,
  leaveRequests: requests,
  loading,
  error,
} = storeToRefs(timeoffStore);

const loadData = async () => {
  try {
    await Promise.all([
      timeoffStore.fetchLeaveAllocations(),
      timeoffStore.fetchLeaveRequests(),
    ]);
  } catch (err) {
    console.error("Failed to load leave data:", err);
  }
};

const handleRefresh = async (event) => {
  await loadData(true);
  event.target.complete();
};

onMounted(loadData);

const getLeaveTypeEnglishName = (name) => {
  return name.split(" - ")[0] || name;
};

const getLeaveTypeKhmerName = (name) => {
  return name.split(" - ")[1] || "";
};

const formatDays = (days) => {
  return days % 1 === 0 ? days.toString() : days.toFixed(1);
};

const totalEntitlement = computed(() => {
  return allocations.value
    .filter(a => a.state === 'validate')
    .reduce((sum, a) => sum + a.numberOfDays, 0);
});

const totalTaken = computed(() => {
  return requests.value
    .filter(r => r.state !== 'refuse' && r.state !== 'cancel')
    .reduce((sum, r) => sum + r.numberOfDays, 0);
});

const totalRemaining = computed(() => {
  return Math.max(0, totalEntitlement.value - totalTaken.value);
});

const usagePercentage = computed(() => {
  if (totalEntitlement.value === 0) return 0;
  return Math.round((totalRemaining.value / totalEntitlement.value) * 100);
});

const getIconForType = (name) => {
  const n = name.toLowerCase();
  if (n.includes('sick')) return medicalOutline;
  if (n.includes('annual')) return calendarOutline;
  if (n.includes('special')) return airplaneOutline;
  if (n.includes('business')) return briefcaseOutline;
  return sparklesOutline;
};

const getColorForType = (name) => {
  const n = name.toLowerCase();
  if (n.includes('sick')) return '#e11d48';
  if (n.includes('annual')) return '#2e66db';
  if (n.includes('special')) return '#f59e0b';
  if (n.includes('business')) return '#7c3aed';
  return '#10b981';
};

const balances = computed(() => {
  return allocations.value.map(alloc => {
    const allocated = alloc.numberOfDays;
    
    // Find taken days for this specific leave type
    // Note: Comparing leaveType display names might be brittle but it's what we have
    const taken = requests.value
      .filter(r => r.leaveType === alloc.leaveType && r.state !== 'refuse' && r.state !== 'cancel')
      .reduce((sum, r) => sum + r.numberOfDays, 0);

    const remaining = Math.max(0, allocated - taken);

    return {
      id: alloc.id,
      name: alloc.leaveType || alloc.name || 'Allocation',
      entitlement: allocated,
      taken: taken,
      available: remaining,
      dateTo: alloc.dateTo,
      state: alloc.state,
      icon: getIconForType(alloc.leaveType || alloc.name),
      color: getColorForType(alloc.leaveType || alloc.name)
    };
  });
});
</script>

<style scoped>
.leave-balance-page {
  --background: 
    radial-gradient(circle at top left, rgba(46, 102, 219, 0.12), transparent 40%),
    linear-gradient(180deg, #f8fbff 0%, #f0f5fa 100%);
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
  background: white;
  border-radius: 30px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}

.empty-icon {
  font-size: 4rem;
  color: #cbd5e1;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px;
  font-weight: 800;
  color: #1e293b;
}

.empty-state p {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
}

.loading-skeletons {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-item {
  background: white;
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
  background: #f1f5f9;
  color: #64748b;
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
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

h1 {
  margin: 0;
  font-size: 2.25rem;
  font-weight: 850;
  color: #0f172a;
}

.summary-card {
  background: white;
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
  color: #64748b;
  font-weight: 600;
  margin-bottom: 4px;
}

.summary-info strong {
  display: block;
  font-size: 2rem;
  color: #0f172a;
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
  stroke: #f1f5f9;
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
  fill: #0f172a;
  font-family: inherit;
  font-size: 0.5rem;
  font-weight: 800;
  text-anchor: middle;
}

.summary-footer {
  display: flex;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.footer-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.used { background: #2e66db; }
.dot.pending { background: #f59e0b; }

.section-title h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 750;
  color: #1e293b;
}

.balance-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.balance-item {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid white;
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
  color: #0f172a;
}

.item-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.khmer-item-name {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.item-total {
  font-size: 0.85rem;
  font-weight: 700;
  color: #64748b;
}

.item-progress {
  margin-bottom: 8px;
}

.progress-bar {
  height: 6px;
  background: #f1f5f9;
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
  color: #64748b;
}
</style>
