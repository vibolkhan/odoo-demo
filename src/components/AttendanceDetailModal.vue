<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="dismiss">
            <ion-icon :icon="closeOutline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Attendance Detail</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" :fullscreen="true">
      <div v-if="loading" class="loading-state">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading details...</p>
      </div>
      <div v-else-if="!record" class="empty-state">
        <p>Record not found.</p>
      </div>
      <div v-else class="detail-container">
        <!-- Header / Employee Info -->
        <div class="employee-header">
          <h2>{{ getEmployeeName() }}</h2>
          <span class="status-badge" :class="record.check_out ? 'checked-out' : 'checked-in'">
            {{ record.check_out ? 'Completed' : 'Working' }}
          </span>
        </div>

        <!-- Times & Hours -->
        <div class="detail-card">
          <h3>Time Tracking</h3>
          <div class="time-grid">
            <div class="time-item">
              <span class="label">Check In</span>
              <span class="value">{{ formatDateTime(record.check_in) }}</span>
            </div>
            <div class="time-item">
              <span class="label">Check Out</span>
              <span class="value">{{ formatDateTime(record.check_out) }}</span>
            </div>
          </div>
          
          <div class="hours-row" v-if="record.worked_hours">
            <div class="hour-box">
              <span class="label">Worked Hours</span>
              <span class="value">{{ formatHours(record.worked_hours) }}h</span>
            </div>
            <div class="hour-box overtime" v-if="record.overtime_hours > 0">
              <span class="label">Overtime</span>
              <span class="value">{{ formatHours(record.overtime_hours) }}h</span>
            </div>
          </div>
        </div>

        <!-- Check In Details -->
        <div class="detail-card">
          <h3>Check In Details</h3>
          <div class="info-list">
            <div class="info-item" v-if="record.in_mode">
              <span class="label">Mode</span>
              <span class="value">{{ record.in_mode }}</span>
            </div>
            <div class="info-item" v-if="record.in_ip_address">
              <span class="label">IP Address</span>
              <span class="value">{{ record.in_ip_address }}</span>
            </div>
            <div class="info-item" v-if="record.in_browser">
              <span class="label">Browser</span>
              <span class="value">{{ record.in_browser }}</span>
            </div>
            <div class="info-item" v-if="record.in_city || record.in_country_name">
              <span class="label">Location</span>
              <span class="value">{{ [record.in_city, record.in_country_name].filter(Boolean).join(', ') }}</span>
            </div>
            <div class="info-item" v-if="record.in_latitude || record.in_longitude">
              <span class="label">Coordinates</span>
              <span class="value">{{ record.in_latitude }}, {{ record.in_longitude }}</span>
            </div>
          </div>
        </div>

        <!-- Check Out Details -->
        <div class="detail-card" v-if="record.check_out">
          <h3>Check Out Details</h3>
          <div class="info-list">
            <div class="info-item" v-if="record.out_mode">
              <span class="label">Mode</span>
              <span class="value">{{ record.out_mode }}</span>
            </div>
            <div class="info-item" v-if="record.out_ip_address">
              <span class="label">IP Address</span>
              <span class="value">{{ record.out_ip_address }}</span>
            </div>
            <div class="info-item" v-if="record.out_browser">
              <span class="label">Browser</span>
              <span class="value">{{ record.out_browser }}</span>
            </div>
            <div class="info-item" v-if="record.out_city || record.out_country_name">
              <span class="label">Location</span>
              <span class="value">{{ [record.out_city, record.out_country_name].filter(Boolean).join(', ') }}</span>
            </div>
            <div class="info-item" v-if="record.out_latitude || record.out_longitude">
              <span class="label">Coordinates</span>
              <span class="value">{{ record.out_latitude }}, {{ record.out_longitude }}</span>
            </div>
          </div>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
  modalController,
} from "@ionic/vue";
import { closeOutline } from "ionicons/icons";
import { ref, onMounted } from "vue";
import { postJsonRpc, getStoredUserId, DEFAULT_ALLOWED_COMPANY_IDS } from "@/utils/auth";

const props = defineProps<{
  recordId: number;
}>();

const loading = ref(true);
const record = ref<any>(null);

onMounted(() => {
  fetchDetail();
});

const dismiss = () => {
  modalController.dismiss();
};

async function fetchDetail() {
  loading.value = true;
  try {
    const uid = Number(getStoredUserId());
    const response = await postJsonRpc("/web/dataset/call_kw/hr.attendance/web_read", {
      model: "hr.attendance",
      method: "web_read",
      args: [[props.recordId]],
      kwargs: {
        context: {
          lang: "en_US",
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Bangkok",
          uid,
          allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
          bin_size: true,
        },
        specification: {
          overtime_status: {},
          employee_id: { fields: { display_name: {} } },
          check_in: {},
          check_out: {},
          worked_hours: {},
          overtime_hours: {},
          validated_overtime_hours: {},
          in_mode: {},
          in_ip_address: {},
          in_browser: {},
          in_country_name: {},
          in_city: {},
          in_latitude: {},
          in_longitude: {},
          out_mode: {},
          out_ip_address: {},
          out_browser: {},
          out_country_name: {},
          out_city: {},
          out_latitude: {},
          out_longitude: {},
          no_validated_overtime_hours: {},
          display_name: {},
        },
      },
    });

    if (response.result && response.result.length > 0) {
      record.value = response.result[0];
    }
  } catch (error) {
    console.error("Error fetching attendance details:", error);
  } finally {
    loading.value = false;
  }
}

function getEmployeeName() {
  if (record.value?.employee_id && typeof record.value.employee_id === 'object' && record.value.employee_id.display_name) {
    return record.value.employee_id.display_name;
  }
  return record.value?.display_name || "Unknown Employee";
}

function formatDateTime(dateStr: string | null | false) {
  if (!dateStr) return "N/A";
  
  const date = new Date(dateStr + "Z");
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHours(hours: number | null | false) {
  if (!hours) return "0.0";
  return hours.toFixed(2);
}
</script>

<style scoped>
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #64748b;
  text-align: center;
}

.detail-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 30px;
}

.employee-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.employee-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 99px;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
}

.status-badge.checked-in {
  background: #ecfdf5;
  color: #059669;
}

.status-badge.checked-out {
  background: #f1f5f9;
  color: #64748b;
}

.detail-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
  border: 1px solid #f1f5f9;
}

.detail-card h3 {
  margin: 0 0 16px;
  font-size: 1.1rem;
  font-weight: 700;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 12px;
}

.time-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.time-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.time-item .label {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
}

.time-item .value {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.hours-row {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px dashed #e2e8f0;
}

.hour-box {
  flex: 1;
  background: #f8fafc;
  padding: 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.hour-box .label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
}

.hour-box .value {
  font-size: 1.25rem;
  font-weight: 800;
  color: #2563eb;
}

.hour-box.overtime {
  background: #fffbeb;
}
.hour-box.overtime .value {
  color: #d97706;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item .label {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

.info-item .value {
  font-size: 0.9rem;
  color: #1e293b;
  font-weight: 600;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}
</style>
