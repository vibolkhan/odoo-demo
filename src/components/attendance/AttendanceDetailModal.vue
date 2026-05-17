<template>
  <ion-page>
    <ion-content class="attendance-detail-modal" :scroll-y="true">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Fetching attendance details...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!record" class="empty-state">
        <div class="empty-icon-box">
          <ion-icon :icon="searchOutline" />
        </div>
        <h3>Record Not Found</h3>
        <p>We couldn't retrieve the details for this attendance record.</p>
        <ion-button fill="clear" @click="dismiss">Go Back</ion-button>
      </div>

      <!-- Main Shell -->
      <section v-else class="request-detail-shell">
        <div class="modal-handle"></div>

        <!-- Header -->
        <div class="request-detail-header">
          <div>
            <p class="detail-eyebrow">Attendance Detail</p>
            <div class="employee-header-row">
              <AppAvatar
                :name="getEmployeeName()"
                :size="36"
                variant="emerald"
              />
              <h2>{{ getEmployeeName() }}</h2>
            </div>
            <p class="detail-subtitle">
              {{ formatDate(record.check_in) }}
            </p>
          </div>

          <ion-button
            fill="clear"
            class="detail-close-button app-modal-close-button"
            aria-label="Close attendance details"
            @click="dismiss"
          >
            <ion-icon :icon="close" aria-hidden="true" />
          </ion-button>
        </div>

        <!-- Status Hero Card -->
        <div class="detail-hero-card">
          <div class="detail-hero-main">
            <div
              class="type-tile detail-type-tile"
              :class="record.check_out ? 'tone-emerald' : 'tone-blue'"
            >
              <ion-icon
                :icon="record.check_out ? checkmarkCircleOutline : timeOutline"
              />
            </div>

            <div class="detail-hero-copy">
              <div class="status-stack">
                <span
                  class="status-pill"
                  :class="record.check_out ? 'status-approved' : 'status-review'"
                >
                  {{ record.check_out ? "Completed" : "Working Now" }}
                </span>

                <span
                  v-if="record.overtime_status"
                  class="status-pill ot-pill"
                  :class="getOTStatusClass(record.overtime_status)"
                >
                  OT: {{ formatOTStatus(record.overtime_status) }}
                </span>
              </div>

              <p class="detail-duration" v-if="record.display_name">
                <strong>{{ getWorkedTime() }}</strong>
              </p>

              <p class="detail-duration" v-else-if="record.worked_hours">
                Total Worked:
                <strong>{{ formatHours(record.worked_hours) }} Hours</strong>
              </p>

              <p class="detail-duration" v-else>Session is still active</p>
            </div>
          </div>
        </div>

        <!-- Timeline Section -->
        <div class="detail-section-card timeline-card">
          <span class="detail-section-label">Shift Timeline</span>

          <div class="timeline-container">
            <!-- Check In -->
            <div class="timeline-item">
              <div class="timeline-marker start"></div>

              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-type">Check In</span>
                  <span class="timeline-time">
                    {{ formatTime(record.check_in) }}
                  </span>
                </div>

                <div class="timeline-details-grid">
                  <div class="timeline-detail-item">
                    <span class="label">Mode</span>
                    <span class="value">
                      <ion-icon :icon="getModeIcon(record.in_mode)" />
                      {{ formatMode(record.in_mode) }}
                    </span>
                  </div>

                  <div class="timeline-detail-item">
                    <span class="label">IP Address</span>
                    <span class="value">{{ record.in_ip_address || "-" }}</span>
                  </div>

                  <div class="timeline-detail-item">
                    <span class="label">Localisation</span>
                    <span class="value">{{ formatLocalisation(record.in_city, record.in_country_name) }}</span>
                  </div>

                  <div class="timeline-detail-item" v-if="record.in_browser">
                    <span class="label">Browser</span>
                    <span class="value">{{ record.in_browser }}</span>
                  </div>

                  <div class="timeline-detail-item full-width">
                    <span class="label">GPS Coordinates</span>
                    <div class="value-row">
                      <span class="value">{{ record.in_latitude?.toFixed(6) }}, {{ record.in_longitude?.toFixed(6) }}</span>
                      <a 
                        v-if="hasGPS(record.in_latitude, record.in_longitude)"
                        class="maps-link"
                        :href="getMapsUrl(record.in_latitude, record.in_longitude)" 
                        target="_blank"
                      >
                        <ion-icon :icon="mapOutline" />
                        View on Maps
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Check Out -->
            <div class="timeline-item" :class="{ pending: !record.check_out }">
              <div class="timeline-marker end"></div>

              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-type">Check Out</span>
                  <span class="timeline-time">
                    {{ formatTime(record.check_out) }}
                  </span>
                </div>

                <div v-if="record.check_out" class="timeline-details-grid">
                  <div class="timeline-detail-item">
                    <span class="label">Mode</span>
                    <span class="value">
                      <ion-icon :icon="getModeIcon(record.out_mode)" />
                      {{ formatMode(record.out_mode) }}
                    </span>
                  </div>

                  <div class="timeline-detail-item">
                    <span class="label">IP Address</span>
                    <span class="value">{{ record.out_ip_address || "-" }}</span>
                  </div>

                  <div class="timeline-detail-item">
                    <span class="label">Localisation</span>
                    <span class="value">{{ formatLocalisation(record.out_city, record.out_country_name) }}</span>
                  </div>

                  <div class="timeline-detail-item" v-if="record.out_browser">
                    <span class="label">Browser</span>
                    <span class="value">{{ record.out_browser }}</span>
                  </div>

                  <div class="timeline-detail-item full-width">
                    <span class="label">GPS Coordinates</span>
                    <div class="value-row">
                      <span class="value">{{ record.out_latitude?.toFixed(6) }}, {{ record.out_longitude?.toFixed(6) }}</span>
                      <a 
                        v-if="hasGPS(record.out_latitude, record.out_longitude)"
                        class="maps-link"
                        :href="getMapsUrl(record.out_latitude, record.out_longitude)" 
                        target="_blank"
                      >
                        <ion-icon :icon="mapOutline" />
                        View on Maps
                      </a>
                    </div>
                  </div>
                </div>
                <p v-else class="pending-text">Awaiting checkout...</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary Statistics (Moved Above Technical Grid) -->
        <div
          v-if="record.worked_hours"
          class="detail-section-card summary-card"
        >
          <span class="detail-section-label">Shift Summary</span>

          <div class="stats-row">
            <div class="stat-block">
              <div
                class="stat-value blue"
                :class="{ 'stat-value-sm': record.display_name?.length > 8 }"
              >
                {{ getWorkedTime() }}
              </div>
              <div class="stat-label">Worked Time</div>
            </div>

            <div class="stat-divider"></div>

            <div class="stat-block">
              <div
                class="stat-value amber"
              >
                {{ getWorkedExtraHours() }}
              </div>
              <div class="stat-label">Worked Extra Hours</div>
            </div>

            <div class="stat-divider"></div>

            <div class="stat-block">
              <div
                class="stat-value emerald"
              >
                {{ getExtraHours() }}
              </div>
              <div class="stat-label">Extra Hours</div>
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
  IonIcon,
  IonButton,
  IonSpinner,
  modalController,
} from "@ionic/vue";
import { useNotification } from "@/composables/useNotification";

import {
  close,
  timeOutline,
  checkmarkCircleOutline,
  locationOutline,
  phonePortraitOutline,
  desktopOutline,
  globeOutline,
  browsersOutline,
  searchOutline,
  mapOutline,
} from "ionicons/icons";

import { ref, onMounted } from "vue";
import { useUserStore } from "@/stores/user.store";
import AppAvatar from "@/components/common/AppAvatar.vue";

const props = defineProps({
  recordId: {
    type: Number,
    required: true,
  },
});

const loading = ref(true);
const record = ref(null);
const userStore = useUserStore();
const { showToast } = useNotification();

onMounted(() => {
  fetchDetail();
});

const dismiss = () => {
  modalController.dismiss();
};

async function fetchDetail() {
  loading.value = true;

  try {
    const result = await userStore.fetchAttendanceDetail(props.recordId);

    if (result) {
      record.value = result;
    }
  } catch (error) {
    console.error("Error fetching attendance details:", error);
    await showToast("Failed to load attendance details.", "danger");
  } finally {
    loading.value = false;
  }
}

function getEmployeeName() {
  if (
    record.value?.employee_id &&
    typeof record.value.employee_id === "object" &&
    record.value.employee_id.display_name
  ) {
    return record.value.employee_id.display_name;
  }

  return record.value?.display_name || "Unknown Employee";
}

function formatDate(dateStr) {
  if (!dateStr) return "N/A";

  const date = new Date(dateStr + "Z");

  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr) {
  if (!dateStr) return "-";

  const date = new Date(dateStr + "Z");

  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHours(hours) {
  if (!hours && hours !== 0) return "0.00";
  return Number(hours).toFixed(2);
}

function formatHHMM(hours) {
  if (!hours && hours !== 0) return "00:00";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatMode(mode) {
  if (!mode) return "Standard";

  const value = String(mode).toLowerCase();

  if (value.includes("systray")) return "Desktop";
  if (value.includes("manual")) return "Manual";
  if (value.includes("mobile")) return "Mobile";

  return mode;
}

function getModeIcon(mode) {
  if (!mode) return desktopOutline;

  return String(mode).toLowerCase().includes("mobile")
    ? phonePortraitOutline
    : desktopOutline;
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function isValidLocation(location) {
  return location && location !== "Unknown";
}

function formatOTStatus(status) {
  if (!status) return "";
  return status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
}

function getOTStatusClass(status) {
  switch (status) {
    case "approved":
      return "ot-approved";
    case "refused":
      return "ot-refused";
    case "to_approve":
      return "ot-pending";
    default:
      return "ot-draft";
  }
}

function getWorkedTime() {
  if (record.value?.display_name) {
    // Extract duration from "HH:MM (checkin-checkout)"
    return record.value.display_name.split(" ")[0];
  }
  return formatHours(record.value?.worked_hours);
}

function getWorkedExtraHours() {
  return formatHHMM(record.value?.overtime_hours);
}

function getExtraHours() {
  return formatHHMM(record.value?.validated_overtime_hours);
}

function getMapsUrl(lat, lng) {
  if (!hasGPS(lat, lng)) return "#";
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function hasGPS(lat, lng) {
  // Check if coordinates are provided and not exactly 0,0 which often means missing in Odoo
  return lat !== undefined && lng !== undefined && (lat !== 0 || lng !== 0);
}

function formatLocalisation(city, country) {
  const parts = [];
  if (city && city !== "Unknown") parts.push(city);
  if (country && country !== "Unknown") parts.push(country);
  return parts.length > 0 ? parts.join(", ") : "Unknown";
}
</script>

<style scoped>
.attendance-detail-modal {
  --background: var(--app-bg);
}

.request-detail-shell {
  display: grid;
  gap: 18px;
  padding: 18px 20px calc(40px + env(safe-area-inset-bottom));
}

.modal-handle {
  width: 42px;
  height: 5px;
  border-radius: 999px;
  background: var(--border-color);
  margin: 0 auto 2px;
}

.request-detail-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.detail-eyebrow {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.employee-header-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.employee-avatar-mini {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #84cc16; /* Lime green like in the image */
  color: white;
  display: grid;
  place-items: center;
  font-size: 0.9rem;
  font-weight: 800;
  flex-shrink: 0;
}

.request-detail-header h2 {
  margin: 0;
  font-size: 1.65rem;
  line-height: 1.1;
  font-weight: 900;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.detail-subtitle {
  margin: 8px 0 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.detail-hero-card,
.detail-section-card {
  padding: 20px;
  border-radius: 26px;
  background: var(--card-bg);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
  border: 1px solid var(--border-color);
}

.detail-hero-main {
  display: flex;
  gap: 18px;
  align-items: center;
}

.type-tile {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 22px;
  font-size: 1.75rem;
  flex-shrink: 0;
}

.tone-blue {
  background: rgba(59, 130, 246, 0.15);
  color: #2563eb;
}

.tone-emerald {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 850;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.status-review {
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
}

.status-approved {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.status-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.ot-pill {
  font-size: 0.7rem;
  border: 1px solid transparent;
}

.ot-approved {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border-color: rgba(16, 185, 129, 0.2);
}

.ot-pending {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
  border-color: rgba(245, 158, 11, 0.2);
}

.ot-refused {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border-color: rgba(239, 68, 68, 0.2);
}

.ot-draft {
  background: var(--app-bg);
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.detail-duration {
  margin: 10px 0 0;
  font-size: 0.92rem;
  color: var(--text-secondary);
}

.detail-duration strong {
  color: var(--text-primary);
  font-weight: 800;
}

/* Timeline */
.timeline-card {
  padding-bottom: 24px;
}

.timeline-container {
  margin-top: 20px;
  position: relative;
  padding-left: 8px;
}

.timeline-container::before {
  content: "";
  position: absolute;
  top: 10px;
  bottom: 10px;
  left: 17px;
  width: 2px;
  background: var(--border-color);
  z-index: 1;
}

.timeline-item {
  position: relative;
  padding-left: 40px;
  padding-bottom: 26px;
  z-index: 2;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-marker {
  position: absolute;
  left: 0;
  top: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  border: 4px solid #2563eb;
  z-index: 3;
  box-shadow: 0 0 0 4px var(--card-bg);
}

.timeline-marker.end {
  border-color: #059669;
}

.timeline-item.pending .timeline-marker {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.timeline-type {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-primary);
}

.timeline-time {
  font-size: 1rem;
  font-weight: 900;
  color: var(--text-primary);
}

.timeline-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 10px;
}

.timeline-detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.timeline-detail-item.full-width {
  grid-column: span 2;
  border-top: 1px solid var(--border-color);
  padding-top: 8px;
  margin-top: 4px;
}

.timeline-detail-item .label {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.timeline-detail-item .value {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.timeline-detail-item .value ion-icon {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.value-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.maps-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #2563eb;
  text-decoration: none;
  background: rgba(37, 99, 235, 0.08);
  padding: 4px 8px;
  border-radius: 6px;
}

.maps-link ion-icon {
  font-size: 0.9rem;
}

.pending-text {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-style: italic;
}

/* Detail Grid */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-stat {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 22px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.035);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.stat-icon.blue {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
}

.stat-icon.purple {
  background: rgba(167, 139, 250, 0.1);
  color: #7c3aed;
}

.stat-copy span {
  display: block;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.stat-copy strong {
  display: block;
  margin-top: 2px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

/* Summary */
.stats-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-top: 15px;
  text-align: center;
}

.stat-block {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.stat-value-sm {
  font-size: 1.1rem;
}

.stat-value.blue {
  color: #2563eb;
}

.stat-value.amber {
  color: #d97706;
}

.stat-value.emerald {
  color: #059669;
}

.stat-value.gray {
  color: var(--text-secondary);
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-top: 4px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--border-color);
}

.detail-section-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 15px;
}

/* Loading / Empty */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  padding: 30px;
  text-align: center;
}

.loading-state p {
  margin-top: 14px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.empty-icon-box {
  width: 80px;
  height: 80px;
  background: var(--card-bg);
  border-radius: 30px;
  display: grid;
  place-items: center;
  font-size: 2.5rem;
  color: var(--text-secondary);
  margin-bottom: 20px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
}

.empty-state h3 {
  margin: 0;
  font-weight: 800;
  color: var(--text-primary);
}

.empty-state p {
  margin: 10px 0 20px;
  color: var(--text-secondary);
  font-size: 0.95rem;
}
</style>
