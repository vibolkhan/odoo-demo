<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>My Attendance</ion-title></ion-toolbar></ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ion-refresh="refresh"><ion-refresher-content pulling-text="Pull to refresh attendance" refreshing-text="Refreshing attendance..." /></ion-refresher>
      <div class="app-filter-shell">
        <ion-input v-model="month" type="month" label="Month" label-placement="stacked" fill="outline" @ion-change="load" />
        <p class="record-count">{{ records.length }} daily attendance record{{ records.length === 1 ? "" : "s" }}</p>
      </div>
      <app-loading-card v-if="loading" />
      <app-empty-state v-else-if="!records.length" title="No attendance yet" message="No records were found for this month." />
      <div v-else class="app-page app-stack attendance-list">
        <attendance-card v-for="record in records" :key="record.id" :record="record" />
      </div>
      <ion-toast v-model:is-open="toastOpen" :message="toastMessage" :color="toastColor" :duration="3500" />
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { IonContent, IonHeader, IonInput, IonPage, IonRefresher, IonRefresherContent, IonTitle, IonToast, IonToolbar, onIonViewWillEnter } from "@ionic/vue";
import { ref } from "vue";
import AppEmptyState from "@/components/AppEmptyState.vue";
import AppLoadingCard from "@/components/AppLoadingCard.vue";
import AttendanceCard from "@/components/AttendanceCard.vue";
import { useAuthStore } from "@/stores/auth";
import { getMyAttendanceHistory } from "@/services/attendanceService";
import { useToast } from "@/composables/useToast";
import type { Tables } from "@/types/database.types";
const auth = useAuthStore();
const month = ref(formatLocalMonth(new Date()));
const records = ref<Tables<"attendance_records">[]>([]);
const loading = ref(false);
const { showError, toastColor, toastMessage, toastOpen } = useToast();
async function load() {
  if (!auth.employee?.id) return;
  loading.value = true;
  const start = `${month.value}-01`;
  const end = getMonthEnd(month.value);
  try { records.value = await getMyAttendanceHistory(auth.employee.id, start, end); } catch (error) { showError(error, "Unable to load attendance."); } finally { loading.value = false; }
}
async function refresh(event: CustomEvent) { try { await load(); } finally { (event.target as HTMLIonRefresherElement).complete(); } }
function formatLocalMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function getMonthEnd(value: string) {
  const [year, monthNumber] = value.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return `${value}-${String(lastDay).padStart(2, "0")}`;
}
onIonViewWillEnter(load);
</script>
<style scoped>
.record-count { margin: 10px 2px 0; color: var(--ion-color-medium); font-size: .85rem; }
.attendance-list { gap: 8px; }
</style>
