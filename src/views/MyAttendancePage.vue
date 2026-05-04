<template>
  <ion-page>
    <ion-content :fullscreen="true" class="request-list-page">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <section class="catalog-shell">
        <!-- <div class="top-action-bar">
          <ion-button fill="clear" class="utility-button">
            <ion-icon :icon="notificationsOutline" size="large" />
          </ion-button>
        </div> -->

        <div class="page-header">
          <div>
            <p class="eyebrow">Attendance Tracking</p>
            <h1>My Attendances</h1>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid" v-if="records.length > 0 && !loading.myAttendances">
          <div class="stat-card">
            <span>Total Hours</span>
            <strong>{{ totalWorkedHours.toFixed(1) }}</strong>
          </div>
          <div class="stat-card">
            <span>Records</span>
            <strong>{{ records.length }}</strong>
          </div>
          <div class="stat-card">
            <span>OT Hours</span>
            <strong>{{ totalOvertimeHours.toFixed(1) }}</strong>
          </div>
        </div>

        <div v-if="loading.myAttendances" class="state-card">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Loading your attendances...</p>
        </div>

        <div v-else-if="records.length === 0" class="state-card">
          <ion-icon :icon="timeOutline" class="empty-icon"></ion-icon>
          <h3>No records yet</h3>
          <p>Your attendance history will appear here once you check in/out.</p>
        </div>

        <div v-else class="request-list">
          <div
            v-for="record in records"
            :key="record.id"
            class="request-card"
            @click="openDetail(record.id)"
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
                  <span class="separator">→</span>
                  {{ record.check_out ? formatTime(record.check_out) : "..." }}
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
      </section>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonPage,
  IonContent,
  IonButtons,
  IonBackButton,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonIcon,
  IonButton,
  modalController,
} from "@ionic/vue";
import {
  timeOutline,
  locationOutline,
  chevronForwardOutline,
  notificationsOutline,
} from "ionicons/icons";
import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/user.store";
import AttendanceDetailModal from "@/components/AttendanceDetailModal.vue";

const userStore = useUserStore();
const { myAttendances: records, loading } = storeToRefs(userStore);

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
    await userStore.fetchMyAttendances();
  } catch (error) {
    console.error("Error fetching attendances:", error);
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

function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr + "Z");
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr + "Z");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
</script>

<style scoped>
.request-list-page {
  --background:
    radial-gradient(
      circle at top left,
      rgba(46, 102, 219, 0.16),
      transparent 34%
    ),
    linear-gradient(180deg, #f8fbff 0%, #eef4fb 55%, #e8f0f8 100%);
  --padding-top: calc(env(safe-area-inset-top) + 18px);
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-bottom: calc(env(safe-area-inset-bottom) + 110px);
}

.catalog-shell {
  display: grid;
  gap: 16px;
}

.top-action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.utility-button {
  width: 52px;
  height: 52px;
  margin: 0;
  --background: rgba(255, 255, 255, 0.9);
  --border-radius: 20px;
  --color: #16243a;
  --box-shadow: 0 10px 24px rgba(45, 67, 100, 0.08);
}

.utility-button-back {
  --color: #16243a;
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
  color: #5b6b82;
  letter-spacing: 0.04em;
}

h1 {
  margin: 0;
  font-size: 2.15rem;
  line-height: 1.1;
  font-weight: 850;
  color: #0f172a;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stat-card {
  padding: 14px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 8px 22px rgba(55, 75, 105, 0.08);
}

.stat-card span {
  display: block;
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 650;
}

.stat-card strong {
  display: block;
  margin-top: 4px;
  font-size: 1.35rem;
  color: #0f172a;
}

.request-list {
  display: grid;
  gap: 14px;
}

.request-card {
  position: relative;
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid #f1f5f9;
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
  background: #eff6ff;
  color: #2563eb;
}

.tone-coral {
  background: #fff1f2;
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
  color: #1e293b;
  line-height: 1.2;
}

.request-dates {
  margin: 2px 0 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
}

.separator {
  color: #cbd5e1;
  margin: 0 4px;
}

.location-info {
  margin: 2px 0 0;
  font-size: 0.78rem;
  font-weight: 600;
  color: #94a3b8;
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
  background: #ffffff;
  border-radius: 32px;
  color: #94a3b8;
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
  color: #1e293b;
}

.state-card p {
  font-size: 1rem;
  margin: 0;
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
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 6px;
}

.hours-tag .ot {
  font-size: 0.75rem;
  font-weight: 800;
  color: #d97706;
  background: #fffbeb;
  padding: 2px 8px;
  border-radius: 6px;
}
</style>
