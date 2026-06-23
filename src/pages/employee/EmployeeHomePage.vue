<template>
  <ion-page><ion-header><ion-toolbar><ion-title>Good day, {{ firstName }}</ion-title></ion-toolbar></ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ion-refresh="refresh"><ion-refresher-content pulling-text="Pull to refresh home" refreshing-text="Refreshing home..." /></ion-refresher>
      <div class="app-page app-stack"><profile-header :name="fullName" :subtitle="`${employee?.employee_code || 'No employee code'} - ${department}`" :status="employee?.status || 'unknown'" />
      <app-loading-card v-if="loading" />
      <template v-else>
        <ion-grid><ion-row><ion-col size="6"><metric-card :icon="documentsOutline" label="Pending requests" :value="pendingRequestCount" color="warning" /></ion-col><ion-col size="6"><metric-card :icon="notificationsOutline" label="Unread notifications" :value="notificationCount" color="tertiary" /></ion-col></ion-row></ion-grid>
        <ion-card><ion-card-header><ion-card-subtitle>Today</ion-card-subtitle><ion-card-title>Attendance</ion-card-title></ion-card-header>
          <ion-card-content v-if="attendance"><ion-grid><ion-row><ion-col><small>Check in</small><strong>{{ formatTime(attendance.check_in) }}</strong></ion-col><ion-col><small>Check out</small><strong>{{ formatTime(attendance.check_out) }}</strong></ion-col></ion-row><ion-row><ion-col><small>Worked</small><strong>{{ formatDurationFromHours(attendance.worked_hours) }}</strong></ion-col><ion-col><small>Late</small><strong>{{ formatDurationFromMinutes(attendance.late_minutes) }}</strong></ion-col></ion-row></ion-grid><status-badge :status="attendance.status" /></ion-card-content>
          <app-empty-state v-else title="Not checked in" message="Scan the company QR code to start your day." />
        </ion-card>
        <div class="ion-padding"><ion-button expand="block" router-link="/employee/tabs/scan">Scan QR now</ion-button><ion-button expand="block" fill="outline" router-link="/employee/tabs/attendance">View attendance</ion-button></div>
      </template>
      </div>
      <ion-toast v-model:is-open="toastOpen" :message="toastMessage" :color="toastColor" :duration="3500" />
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonContent, IonGrid, IonHeader, IonPage, IonRefresher, IonRefresherContent, IonRow, IonTitle, IonToast, IonToolbar } from "@ionic/vue";
import { documentsOutline, notificationsOutline } from "ionicons/icons";
import { computed, onMounted, ref } from "vue";
import AppEmptyState from "@/components/AppEmptyState.vue"; import AppLoadingCard from "@/components/AppLoadingCard.vue"; import MetricCard from "@/components/MetricCard.vue"; import ProfileHeader from "@/components/ProfileHeader.vue"; import StatusBadge from "@/components/StatusBadge.vue";
import { getTodayEmployeeHomeData } from "@/services/attendanceService"; import { useAuthStore } from "@/stores/auth"; import { useToast } from "@/composables/useToast"; import type { Tables } from "@/types/database.types"; import { formatDurationFromHours, formatDurationFromMinutes } from "@/utils/format";
const auth = useAuthStore(); const employee = computed(() => auth.employee); const loading = ref(false); const attendance = ref<Tables<"attendance_records"> | null>(null); const pendingRequestCount = ref(0); const notificationCount = ref(0);
const fullName = computed(() => employee.value ? `${employee.value.first_name} ${employee.value.last_name}` : auth.user?.email || "Employee"); const firstName = computed(() => employee.value?.first_name || "there"); const department = computed(() => employee.value?.departments?.name || "No department");
const { showError, toastColor, toastMessage, toastOpen } = useToast(); function formatTime(v: string | null) { return v ? new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"; }
async function load() { if (!employee.value?.id || !auth.appUser?.id) return; loading.value = true; try { const data = await getTodayEmployeeHomeData(employee.value.id, auth.appUser.id); attendance.value = data.attendance; pendingRequestCount.value = data.pendingRequestCount; notificationCount.value = data.notificationCount; } catch (e) { showError(e); } finally { loading.value = false; } }
async function refresh(event: CustomEvent) { try { await load(); } finally { (event.target as HTMLIonRefresherElement).complete(); } } onMounted(load);
</script>
<style scoped>small, strong { display: block; } small { color: var(--ion-color-medium); margin-bottom: 4px; }</style>
