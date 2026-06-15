<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>Scan Attendance</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <ion-card class="scan-card"><ion-card-content>
        <ion-icon :icon="qrCodeOutline" />
        <h2>Company QR Check-in</h2><p>Select an active location or enter its QR value for testing.</p>
        <ion-select v-if="locations.length" v-model="qrValue" fill="outline" label="Active QR location" label-placement="stacked">
          <ion-select-option v-for="location in locations" :key="location.id" :value="location.qr_code_value">{{ location.name }}</ion-select-option>
        </ion-select>
        <ion-input v-model.trim="qrValue" fill="outline" label="QR code value" label-placement="stacked" placeholder="HR_QR_MAIN_OFFICE_001" />
        <ion-grid><ion-row><ion-col><ion-button expand="block" :disabled="loading || !qrValue" @click="submit('check_in')">Check In</ion-button></ion-col>
        <ion-col><ion-button expand="block" color="tertiary" :disabled="loading || !qrValue" @click="submit('check_out')">Check Out</ion-button></ion-col></ion-row></ion-grid>
      </ion-card-content></ion-card>
      <ion-card v-if="lastResult"><ion-card-header><ion-card-subtitle>Last scan result</ion-card-subtitle><ion-card-title>{{ lastAction }}</ion-card-title></ion-card-header><ion-card-content><p>{{ lastResult.message }}</p><ion-list><ion-item><ion-label>Check in</ion-label><ion-note slot="end">{{ formatTime(lastResult.check_in) }}</ion-note></ion-item><ion-item><ion-label>Check out</ion-label><ion-note slot="end">{{ formatTime(lastResult.check_out) }}</ion-note></ion-item></ion-list></ion-card-content></ion-card>
      <ion-toast v-model:is-open="toastOpen" :message="toastMessage" :color="toastColor" :duration="3500" />
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonNote, IonPage, IonRow, IonSelect, IonSelectOption, IonTitle, IonToast, IonToolbar } from "@ionic/vue";
import { qrCodeOutline } from "ionicons/icons";
import { onMounted, ref } from "vue";
import { processQrAttendance } from "@/services/attendanceService";
import { getQrLocations } from "@/services/adminService";
import { useToast } from "@/composables/useToast";
import { useAuthStore } from "@/stores/auth";
type QrLocation = { id: number; is_active: boolean; name: string; qr_code_value: string };
type ScanResult = { check_in?: string | null; check_out?: string | null; message?: string; success?: boolean };
const qrValue = ref("");
const auth = useAuthStore();
const locations = ref<QrLocation[]>([]);
const loading = ref(false);
const lastResult = ref<ScanResult | null>(null);
const lastAction = ref("");
const { showError, showToast, toastColor, toastMessage, toastOpen } = useToast();
async function submit(logType: "check_in" | "check_out") {
  if (!auth.employee?.id) {
    showError(
      new Error("Your account is not linked to an employee profile. Ask Admin/HR to link app_users.employee_id before scanning."),
    );
    return;
  }
  loading.value = true;
  try {
    const data = await processQrAttendance({ qrCodeValue: qrValue.value, logType, deviceId: navigator.userAgent, location: "Mobile app" });
    lastAction.value = logType === "check_in" ? "Check In" : "Check Out";
    lastResult.value = data as ScanResult;
    showToast(lastResult.value.message || `${lastAction.value} recorded.`);
  } catch (error) { showError(error, "Unable to process QR attendance."); } finally { loading.value = false; }
}
function formatTime(value?: string | null) {
  return value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--";
}
onMounted(async () => {
  try {
    locations.value = (await getQrLocations()).filter((location: QrLocation) => location.is_active);
    qrValue.value = locations.value[0]?.qr_code_value || "HR_QR_MAIN_OFFICE_001";
  } catch (error) {
    qrValue.value = "HR_QR_MAIN_OFFICE_001";
    showError(error, "Unable to load active QR locations. You can still enter a QR value manually.");
  }
});
</script>
<style scoped>
.scan-card { text-align: center; } .scan-card ion-icon { font-size: 72px; color: var(--ion-color-primary); } .scan-card p { color: var(--ion-color-medium); } ion-select, ion-input { margin-top: 12px; text-align: left; }
</style>
