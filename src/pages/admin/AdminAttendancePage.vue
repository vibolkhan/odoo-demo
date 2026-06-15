<template>
  <ion-page><ion-header><ion-toolbar><ion-title>Attendance</ion-title></ion-toolbar></ion-header><ion-content>
    <div class="ion-padding filters"><ion-input v-model="date" type="date" label="Date" label-placement="stacked" fill="outline" @ion-change="load" /><ion-select v-model="status" label="Status" interface="popover" @ion-change="load"><ion-select-option value="">All</ion-select-option><ion-select-option value="present">Present</ion-select-option><ion-select-option value="late">Late</ion-select-option><ion-select-option value="absent">Absent</ion-select-option></ion-select></div>
    <app-loading-card v-if="loading" /><ion-list v-else-if="records.length"><ion-item v-for="record in records" :key="record.id"><ion-label><h2>{{ record.employees?.first_name }} {{ record.employees?.last_name }}</h2><p>{{ record.attendance_date }} · {{ time(record.check_in) }} - {{ time(record.check_out) }} · {{ record.worked_hours }}h</p></ion-label><status-badge :status="record.status" /></ion-item></ion-list><app-empty-state v-else title="No attendance" message="No attendance records match the filters." />
    <ion-toast v-model:is-open="toastOpen" :message="toastMessage" :color="toastColor" :duration="3500" />
  </ion-content></ion-page>
</template>
<script setup lang="ts">
import { IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonPage, IonSelect, IonSelectOption, IonTitle, IonToast, IonToolbar } from "@ionic/vue"; import { onMounted, ref } from "vue"; import AppEmptyState from "@/components/AppEmptyState.vue"; import AppLoadingCard from "@/components/AppLoadingCard.vue"; import StatusBadge from "@/components/StatusBadge.vue"; import { getAttendanceRecords } from "@/services/attendanceService"; import { useToast } from "@/composables/useToast";
const date = ref(new Date().toISOString().slice(0, 10)); const status = ref(""); const records = ref<Awaited<ReturnType<typeof getAttendanceRecords>>>([]); const loading = ref(false); const { showError, toastColor, toastMessage, toastOpen } = useToast();
function time(v: string | null) { return v ? new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"; } async function load() { loading.value = true; try { records.value = await getAttendanceRecords({ startDate: date.value, endDate: date.value, status: status.value || undefined }); } catch (e) { showError(e); } finally { loading.value = false; } } onMounted(load);
</script>
<style scoped>.filters { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }</style>
