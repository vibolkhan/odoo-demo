<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab3"></ion-back-button>
        </ion-buttons>
        <ion-title>All Attendances</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

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
          <div v-for="record in records" :key="record.id" class="record-card" @click="openDetail(record.id)">
            <div class="card-header">
              <h3>{{ getEmployeeName(record) }}</h3>
              <span class="status-badge" :class="record.check_out ? 'checked-out' : 'checked-in'">
                {{ record.check_out ? 'Completed' : 'Working' }}
              </span>
            </div>
            
            <div class="card-body">
              <div class="time-row">
                <div class="time-col">
                  <span class="label">Check In</span>
                  <span class="value">{{ formatDateTime(record.check_in) }}</span>
                </div>
                <div class="time-col" v-if="record.check_out">
                  <span class="label">Check Out</span>
                  <span class="value">{{ formatDateTime(record.check_out) }}</span>
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

<script setup lang="ts">
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
  modalController,
} from "@ionic/vue";
import { timeOutline, listOutline } from "ionicons/icons";
import { ref, onMounted } from "vue";
import { postJsonRpc, getStoredUserId, DEFAULT_ALLOWED_COMPANY_IDS } from "@/utils/auth";
import AttendanceDetailModal from "@/components/AttendanceDetailModal.vue";

const records = ref<any[]>([]);
const loading = ref(true);

onMounted(() => {
  fetchAttendances();
});

const handleRefresh = async (event: CustomEvent) => {
  await fetchAttendances();
  event.target.complete();
};

async function fetchAttendances() {
  loading.value = true;
  try {
    const uid = Number(getStoredUserId());
    const response = await postJsonRpc("/web/dataset/call_kw/hr.attendance/web_search_read", {
      model: "hr.attendance",
      method: "web_search_read",
      args: [],
      kwargs: {
        specification: {
          employee_id: { fields: { display_name: {} } },
          check_in: {},
          check_out: {},
          worked_hours: {},
          overtime_hours: {},
          validated_overtime_hours: {},
          overtime_status: {},
        },
        offset: 0,
        order: "check_in DESC",
        limit: 80,
        context: {
          lang: "en_US",
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Bangkok",
          uid,
          allowed_company_ids: DEFAULT_ALLOWED_COMPANY_IDS,
          bin_size: true,
        },
        count_limit: 10001,
        domain: [["employee_id.active", "=", true]],
      },
    });

    if (response.result && response.result.records) {
      records.value = response.result.records;
    }
  } catch (error) {
    console.error("Error fetching attendances:", error);
  } finally {
    loading.value = false;
  }
}

async function openDetail(recordId: number) {
  const modal = await modalController.create({
    component: AttendanceDetailModal,
    componentProps: {
      recordId,
    },
  });
  await modal.present();
}

function getEmployeeName(record: any) {
  if (record.employee_id && typeof record.employee_id === 'object' && record.employee_id.display_name) {
    return record.employee_id.display_name;
  }
  return "Unknown Employee";
}

function formatDateTime(dateStr: string | null | false) {
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

function formatHours(hours: number | null | false) {
  if (!hours) return "0.0";
  return hours.toFixed(2);
}
</script>

<style scoped>
.attendance-list {
  padding-bottom: 20px;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #64748b;
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
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
  border: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s ease;
}

.record-card:active {
  transform: scale(0.98);
  background: #f8fafc;
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
  color: #1e293b;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 0.75rem;
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
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
}

.time-col .value {
  font-size: 0.95rem;
  color: #334155;
  font-weight: 500;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px dashed #e2e8f0;
}

.worked-hours {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #3b82f6;
  background: #eff6ff;
  padding: 4px 10px;
  border-radius: 8px;
}

.overtime {
  font-size: 0.85rem;
  font-weight: 600;
  color: #d97706;
  background: #fffbeb;
  padding: 4px 10px;
  border-radius: 8px;
}
</style>
