<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Scan Attendance</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card class="scan-card">
        <ion-card-content>
          <ion-icon :icon="qrCodeOutline" />
          <h2>Company QR scan</h2>
          <p>Scan the official workplace QR code to record attendance.</p>

          <ion-segment v-model="selectedAction" :disabled="loading || scanning">
            <ion-segment-button value="check_in">
              <ion-label>Check in</ion-label>
            </ion-segment-button>
            <ion-segment-button value="check_out">
              <ion-label>Check out</ion-label>
            </ion-segment-button>
          </ion-segment>

          <div v-if="scanning" class="scanner">
            <video ref="videoRef" autoplay muted playsinline />
            <div class="scanner-frame" />
          </div>

          <ion-note v-if="scanMessage" class="scan-message" :color="scanMessageColor">
            {{ scanMessage }}
          </ion-note>

          <ion-button
            v-if="!scanning"
            expand="block"
            :disabled="loading"
            @click="startScanner"
          >
            <ion-icon slot="start" :icon="scanOutline" />
            Scan QR code
          </ion-button>
          <ion-button v-else expand="block" fill="outline" color="medium" @click="stopScanner">
            Stop scanner
          </ion-button>
        </ion-card-content>
      </ion-card>

      <ion-accordion-group>
        <ion-accordion value="manual">
          <ion-item slot="header">
            <ion-label>Development QR entry</ion-label>
          </ion-item>
          <div slot="content" class="manual-entry">
            <ion-input
              v-model.trim="manualQrValue"
              fill="outline"
              label="QR code value"
              label-placement="stacked"
              placeholder="HR_QR_MAIN_OFFICE_001"
            />
            <ion-button
              expand="block"
              fill="outline"
              :disabled="loading || !manualQrValue"
              @click="submit(manualQrValue)"
            >
              Submit test QR value
            </ion-button>
          </div>
        </ion-accordion>
      </ion-accordion-group>

      <ion-card v-if="lastResult">
        <ion-card-header>
          <ion-card-subtitle>Last scan result</ion-card-subtitle>
          <ion-card-title>{{ lastAction }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>{{ lastResult.message }}</p>
          <ion-list>
            <ion-item>
              <ion-label>Check in</ion-label>
              <ion-note slot="end">{{ formatTime(lastResult.check_in) }}</ion-note>
            </ion-item>
            <ion-item>
              <ion-label>Check out</ion-label>
              <ion-note slot="end">{{ formatTime(lastResult.check_out) }}</ion-note>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <ion-toast v-model:is-open="toastOpen" :message="toastMessage" :color="toastColor" :duration="3500" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonAccordion,
  IonAccordionGroup,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToast,
  IonToolbar,
} from "@ionic/vue";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { qrCodeOutline, scanOutline } from "ionicons/icons";
import { nextTick, onBeforeUnmount, ref } from "vue";
import { processQrAttendance } from "@/services/attendanceService";
import { useToast } from "@/composables/useToast";
import { useAuthStore } from "@/stores/auth";

type ScanResult = {
  check_in?: string | null;
  check_out?: string | null;
  message?: string;
  success?: boolean;
};

const auth = useAuthStore();
const selectedAction = ref<"check_in" | "check_out">("check_in");
const manualQrValue = ref("");
const loading = ref(false);
const scanning = ref(false);
const scanMessage = ref("");
const scanMessageColor = ref<"medium" | "danger" | "success">("medium");
const lastResult = ref<ScanResult | null>(null);
const lastAction = ref("");
const videoRef = ref<HTMLVideoElement | null>(null);
const { showError, showToast, toastColor, toastMessage, toastOpen } = useToast();

let scannerControls: IScannerControls | null = null;
let stream: MediaStream | null = null;
let submittingScan = false;

async function requestCameraStream() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera access is not available on this device or browser.");
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
  } catch (error) {
    const name = error instanceof DOMException ? error.name : "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      throw new Error("Camera permission was denied. Allow camera access to scan the attendance QR code.");
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      throw new Error("No camera was found on this device.");
    }
    throw error;
  }
}

async function startScanner() {
  if (!auth.employee?.id) {
    showError(
      new Error("Your account is not linked to an employee profile. Ask Admin/HR to link app_users.employee_id before scanning."),
    );
    return;
  }

  if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    scanMessage.value = "Camera access on web requires HTTPS or localhost.";
    scanMessageColor.value = "danger";
    return;
  }

  scanning.value = true;
  scanMessage.value = "Allow camera access, then point the camera at the workplace QR code.";
  scanMessageColor.value = "medium";

  try {
    await nextTick();
    stream = await requestCameraStream();

    if (!videoRef.value) throw new Error("Scanner video element is not ready.");
    const reader = new BrowserQRCodeReader(undefined, {
      delayBetweenScanAttempts: 250,
      delayBetweenScanSuccess: 500,
    });

    scannerControls = await reader.decodeFromStream(stream, videoRef.value, (result) => {
      const qrCodeValue = result?.getText();
      if (!qrCodeValue || submittingScan) return;

      submittingScan = true;
      stopScanner();
      void submit(qrCodeValue).finally(() => {
        submittingScan = false;
      });
    });
  } catch (error) {
    stopScanner();
    showError(error, "Unable to start the QR scanner.");
  }
}

function stopScanner() {
  scanning.value = false;
  scannerControls?.stop();
  scannerControls = null;
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  if (videoRef.value) videoRef.value.srcObject = null;
}

async function submit(qrCodeValue: string) {
  if (!auth.employee?.id) {
    showError(
      new Error("Your account is not linked to an employee profile. Ask Admin/HR to link app_users.employee_id before scanning."),
    );
    return;
  }

  loading.value = true;
  try {
    const data = await processQrAttendance({
      qrCodeValue,
      logType: selectedAction.value,
      deviceId: navigator.userAgent,
      location: "Mobile app",
    });
    lastAction.value = selectedAction.value === "check_in" ? "Check In" : "Check Out";
    lastResult.value = data as ScanResult;
    scanMessage.value = `Scanned ${qrCodeValue}`;
    scanMessageColor.value = "success";
    showToast(lastResult.value.message || `${lastAction.value} recorded.`);
  } catch (error) {
    scanMessage.value = "The QR code was scanned, but attendance could not be recorded.";
    scanMessageColor.value = "danger";
    showError(error, "Unable to process QR attendance.");
  } finally {
    loading.value = false;
  }
}

function formatTime(value?: string | null) {
  return value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--";
}

onBeforeUnmount(stopScanner);
</script>

<style scoped>
.scan-card {
  text-align: center;
}

.scan-card ion-icon {
  color: var(--ion-color-primary);
  font-size: 72px;
}

.scan-card p {
  color: var(--ion-color-medium);
}

.scan-card ion-segment {
  margin: 18px 0;
}

.scanner {
  aspect-ratio: 3 / 4;
  background: #111;
  border-radius: 8px;
  margin: 16px 0;
  overflow: hidden;
  position: relative;
}

.scanner video {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.scanner-frame {
  border: 2px solid var(--ion-color-primary);
  border-radius: 8px;
  box-shadow: 0 0 0 999px rgba(0, 0, 0, 0.32);
  height: 54%;
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 72%;
}

.scan-message {
  display: block;
  margin: 12px 0;
}

.manual-entry {
  padding: 12px 16px 16px;
}

.manual-entry ion-button {
  margin-top: 12px;
}
</style>
