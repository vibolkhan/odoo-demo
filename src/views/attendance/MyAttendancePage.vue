<template>
  <ion-page>
    <ion-content :fullscreen="true" class="request-list-page">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <section class="catalog-shell">
        <div class="page-header">
          <div>
            <p class="eyebrow">Attendance Tracking</p>
            <h1>My Attendances</h1>
          </div>
        </div>

        <!-- Stats Grid -->
        <div v-if="showSkeleton" class="stats-summary stats-summary-skeleton">
          <div v-for="i in 3" :key="`attendance-stat-skeleton-${i}`" class="stat-item">
            <AppSkeleton width="42px" height="24px" />
            <AppSkeleton width="60px" height="12px" margin="8px 0 0" />
          </div>
        </div>

        <div
          class="stats-summary"
          v-else-if="records.length > 0 && !userStore.loading.myAttendances"
        >
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

        <div v-if="showSkeleton" class="request-list">
          <div v-for="i in 5" :key="i" class="request-card skeleton-card">
            <div class="card-main">
              <AppSkeleton shape="squircle" width="52px" height="52px" />
              <div class="request-copy">
                <AppSkeleton width="60%" height="18px" />
                <AppSkeleton width="40%" height="14px" margin="8px 0 0" />
                <div class="hours-tag">
                  <AppSkeleton width="40px" height="20px" />
                  <AppSkeleton width="40px" height="20px" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="userStore.error.myAttendances" class="error-panel">
          <ion-icon :icon="alertCircleOutline"></ion-icon>
          <p>{{ userStore.error.myAttendances }}</p>
          <ion-button fill="clear" size="small" @click="loadData">
            Try Again
          </ion-button>
        </div>

        <AppEmptyState
          v-else-if="records.length === 0"
          :icon="timeOutline"
          title="No records yet"
          description="Your attendance history will appear here once you check in or out for the day."
          variant="blue"
        />

        <div v-else class="request-list">
          <div
            v-for="record in records"
            :key="record.id"
            class="request-card"
            @click="openDetail(record.id)"
            role="button"
            tabindex="0"
            @keydown.enter="openDetail(record.id)"
            :aria-label="`Attendance on ${formatDate(record.check_in)}, from ${formatTime(record.check_in)} to ${record.check_out ? formatTime(record.check_out) : 'current'}`"
          >
            <div class="card-main">
              <div
                class="type-tile"
                :class="record.check_out ? 'tone-blue' : 'tone-coral'"
              >
                <ion-icon :icon="timeOutline" />
              </div>

              <div class="request-copy">
                <div class="request-topline">
                  <div class="type-name-group">
                    <h5>{{ formatDate(record.check_in) }}</h5>
                  </div>
                  <span
                    class="status-pill"
                    :class="
                      record.check_out ? 'status-approved' : 'status-pending'
                    "
                  >
                    {{ record.check_out ? "Completed" : "Working" }}
                  </span>
                </div>

                <p class="request-dates">
                  {{ formatTime(record.check_in) }}
                  <span class="separator" aria-hidden="true">
                    <ion-icon :icon="chevronForwardOutline" style="font-size: 10px; opacity: 0.5; vertical-align: middle;" />
                  </span>
                  {{ record.check_out ? formatTime(record.check_out) : "Working" }}
                </p>

                <div
                  v-if="record.in_city || record.out_city"
                  class="location-info"
                >
                  <ion-icon :icon="locationOutline"></ion-icon>
                  <span>{{ record.in_city || record.out_city }}</span>
                </div>

                <div
                  class="hours-tag"
                  v-if="record.worked_hours > 0 || record.overtime_hours > 0"
                >
                  <span class="worked"
                    >{{ record.worked_hours.toFixed(1) }}h</span
                  >
                  <span class="ot" v-if="record.overtime_hours > 0"
                    >+{{ record.overtime_hours.toFixed(1) }} OT</span
                  >
                </div>
              </div>

              <ion-icon
                class="card-chevron"
                :icon="chevronForwardOutline"
              ></ion-icon>
            </div>
          </div>
        </div>

        <ion-infinite-scroll
          :key="infiniteScrollKey"
          threshold="100px"
          :disabled="!userStore.myAttendancePagination.hasMore || isLoadingMore"
          @ionInfinite="loadMore"
        >
          <ion-infinite-scroll-content
            loading-spinner="bubbles"
            loading-text="Loading more attendances..."
          />
        </ion-infinite-scroll>
      </section>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonPage,
  IonButton,
  IonContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  modalController,
} from "@ionic/vue";
import {
  timeOutline,
  locationOutline,
  chevronForwardOutline,
} from "ionicons/icons";
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/user.store";
import AttendanceDetailModal from "@/components/attendance/AttendanceDetailModal.vue";
import AppSkeleton from "@/components/common/AppSkeleton.vue";
import AppEmptyState from "@/components/common/AppEmptyState.vue";
import { useMinimumSkeleton } from "@/composables/useMinimumSkeleton";

import { useDateTimeFormatter } from "@/composables/useDateTimeFormatter";
import { useNotification } from "@/composables/useNotification";
import { alertCircleOutline } from "ionicons/icons";

const userStore = useUserStore();
const { myAttendances: records } = storeToRefs(userStore);
const pageSize = 10;
const isLoadingMore = ref(false);
const infiniteScrollKey = ref(0);

const { showSkeleton } = useMinimumSkeleton(
  () => userStore.loading.myAttendances && records.value.length === 0,
  1000,
);

const { formatTime, formatDate } = useDateTimeFormatter();
const { showToast } = useNotification();

const totalWorkedHours = computed(() =>
  records.value.reduce((sum, r) => sum + (r.worked_hours || 0), 0),
);

const totalOvertimeHours = computed(() =>
  records.value.reduce((sum, r) => sum + (r.overtime_hours || 0), 0),
);

onMounted(() => {
  loadData();
});

const handleRefresh = async (event) => {
  await loadData();
  event.target.complete();
};

async function loadData() {
  try {
    await userStore.fetchMyAttendances({ limit: pageSize }, true);
    infiniteScrollKey.value += 1;
  } catch (error) {
    console.error("Error fetching attendances:", error);
    await showToast("Failed to load attendance records.", "danger");
  }
}

async function loadMore(event) {
  const infiniteScroll = event.target;

  if (isLoadingMore.value || !userStore.myAttendancePagination.hasMore) {
    await infiniteScroll?.complete();
    return;
  }

  isLoadingMore.value = true;

  try {
    await userStore.fetchMyAttendances(
      {
        limit: pageSize,
        offset: userStore.myAttendancePagination.offset,
      },
      false,
    );
  } catch (error) {
    console.error("Error fetching more attendances:", error);
    await showToast("Failed to load more attendance records.", "danger");
  } finally {
    isLoadingMore.value = false;
    await infiniteScroll?.complete();
  }
}

async function openDetail(recordId) {
  const modal = await modalController.create({
    component: AttendanceDetailModal,
    componentProps: {
      recordId,
    },
    breakpoints: [0, 0.5, 0.92],
    initialBreakpoint: 0.92,
  });
  await modal.present();
}

</script>

<style scoped>
.request-list-page {
  --background: var(--app-bg);
  background-image: radial-gradient(circle at top left, rgba(46, 102, 219, 0.16), transparent 34%);
  --padding-top: calc(env(safe-area-inset-top) + 18px);
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-bottom: calc(env(safe-area-inset-bottom) + 110px);
}

.catalog-shell {
  display: grid;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.eyebrow {
  margin: 0 0 4px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
  letter-spacing: 0.04em;
}

h1 {
  margin: 0;
  font-size: clamp(1.65rem, 5vw, 1.9rem);
  line-height: 1.12;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.stats-summary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 24px;
  padding: 24px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  color: white;
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.25);
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

.request-list {
  display: grid;
  gap: 14px;
}

.request-card {
  position: relative;
  border-radius: 24px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
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
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

.tone-coral {
  background: rgba(225, 29, 72, 0.1);
  color: #e11d48;
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
  color: var(--text-primary);
  line-height: 1.2;
}

.request-dates {
  margin: 2px 0 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.separator {
  color: #cbd5e1;
  margin: 0 4px;
}

.location-info {
  margin: 2px 0 0;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.location-info ion-icon {
  font-size: 14px;
}

.status-pill {
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 0.65rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-approved {
  background: #dcfce7;
  color: #166534;
}

.card-chevron {
  font-size: 1.1rem;
  color: #cbd5e1;
}

.state-card {
  padding: 48px 24px;
  text-align: center;
  background: var(--card-bg);
  border-radius: 32px;
  color: var(--text-secondary);
}

.state-card ion-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
  opacity: 0.5;
}

.state-card h3 {
  margin: 0 0 8px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.state-card p {
  font-size: 1rem;
  margin: 0;
  color: var(--text-secondary);
}

.hours-tag {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.hours-tag .worked {
  font-size: 0.75rem;
  font-weight: 800;
  color: #2563eb;
  background: rgba(37, 99, 235, 0.1);
  padding: 2px 8px;
  border-radius: 6px;
}

.hours-tag .ot {
  font-size: 0.75rem;
  font-weight: 800;
  color: #d97706;
  background: rgba(217, 119, 6, 0.1);
  padding: 2px 8px;
  border-radius: 6px;
}

.error-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 16px;
  text-align: center;
  color: #e11d48;
  background: rgba(225, 29, 72, 0.05);
  border-radius: 24px;
  border: 1px dashed rgba(225, 29, 72, 0.2);
}

.error-panel ion-icon {
  font-size: 32px;
}

.error-panel p {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
}
</style>
