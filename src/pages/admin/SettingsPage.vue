<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Settings</ion-title>
        <ion-button slot="end" fill="clear" @click="load">Refresh</ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-segment v-model="segment" scrollable>
        <ion-segment-button value="qr">
          <ion-label>QR</ion-label>
        </ion-segment-button>
        <ion-segment-button value="departments">
          <ion-label>Departments</ion-label>
        </ion-segment-button>
        <ion-segment-button value="positions">
          <ion-label>Positions</ion-label>
        </ion-segment-button>
        <ion-segment-button value="leaveTypes">
          <ion-label>Leave Types</ion-label>
        </ion-segment-button>
      </ion-segment>

      <div class="ion-padding">
        <ion-button expand="block" @click="openCreateModal">Add {{ segmentLabel }}</ion-button>
      </div>

      <app-loading-card v-if="loading" />

      <div v-else-if="segment === 'qr' && current.length" class="qr-list">
        <ion-card v-for="item in current" :key="item.id" class="qr-card">
          <ion-card-content>
            <div class="qr-card-grid">
              <img
                class="qr-preview"
                :alt="`QR code for ${item.name}`"
                :src="getQrImageUrl(item.qr_code_value)"
              />

              <div class="qr-details">
                <div class="qr-title-row">
                  <div>
                    <h2>{{ item.name }}</h2>
                    <p>{{ item.location || "No location description" }}</p>
                  </div>
                  <status-badge :status="item.is_active ? 'active' : 'inactive'" />
                </div>

                <ion-note class="qr-value">{{ item.qr_code_value }}</ion-note>

                <div class="qr-actions">
                  <ion-button size="small" fill="outline" @click="downloadQrImage(item)">
                    <ion-icon slot="start" :icon="downloadOutline" />
                    Download image
                  </ion-button>
                  <ion-toggle :checked="item.is_active" @ion-change="toggleQr(item)">
                    Active
                  </ion-toggle>
                </div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <ion-list v-else-if="current.length">
        <ion-item v-for="item in current" :key="item.id">
          <ion-label>
            <h2>{{ item.name || item.title }}</h2>
            <p>{{ item.description || "No description" }}</p>
          </ion-label>
          <status-badge v-if="'is_active' in item" :status="item.is_active ? 'active' : 'inactive'" />
        </ion-item>
      </ion-list>

      <app-empty-state
        v-else
        title="No master data"
        :message="`No ${segmentLabel.toLowerCase()} found.`"
      />

      <ion-modal :is-open="modalOpen" @did-dismiss="modalOpen = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Add {{ segmentLabel }}</ion-title>
            <ion-button slot="end" fill="clear" @click="modalOpen = false">Close</ion-button>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-list>
            <ion-item>
              <ion-input
                v-model="form.name"
                :label="segment === 'positions' ? 'Title' : 'Name'"
                label-placement="stacked"
              />
            </ion-item>
            <ion-item v-if="segment === 'qr'">
              <ion-input
                v-model.trim="form.code"
                label="QR code value"
                label-placement="stacked"
              />
              <ion-button slot="end" fill="clear" aria-label="Generate QR value" @click="generateQrValue">
                <ion-icon slot="icon-only" :icon="refreshOutline" />
              </ion-button>
            </ion-item>
            <ion-item>
              <ion-textarea
                v-model="form.description"
                label="Description / location"
                label-placement="stacked"
              />
            </ion-item>
          </ion-list>

          <div v-if="segment === 'qr' && form.code" class="new-qr-preview">
            <img
              class="qr-preview"
              alt="New QR code preview"
              :src="getQrImageUrl(form.code)"
            />
            <ion-note>{{ form.code }}</ion-note>
          </div>

          <ion-button expand="block" @click="save">Create</ion-button>
        </ion-content>
      </ion-modal>

      <div class="ion-padding">
        <app-logout-button />
      </div>

      <ion-toast v-model:is-open="toastOpen" :message="toastMessage" :color="toastColor" :duration="3500" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToggle,
  IonToolbar,
} from "@ionic/vue";
import { BrowserQRCodeSvgWriter } from "@zxing/browser";
import { downloadOutline, refreshOutline } from "ionicons/icons";
import { computed, onMounted, reactive, ref } from "vue";
import AppEmptyState from "@/components/AppEmptyState.vue";
import AppLoadingCard from "@/components/AppLoadingCard.vue";
import AppLogoutButton from "@/components/AppLogoutButton.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { createQrLocation, updateQrLocation } from "@/services/adminService";
import {
  createDepartment,
  createLeaveType,
  createPosition,
  getSettingsData,
} from "@/services/settingsService";
import { useToast } from "@/composables/useToast";

type SegmentKey = "qr" | "departments" | "positions" | "leaveTypes";
type MasterItem = Record<string, any>;

const segment = ref<SegmentKey>("qr");
const data = reactive<Record<SegmentKey, MasterItem[]>>({
  qr: [],
  departments: [],
  positions: [],
  leaveTypes: [],
});
const current = computed(() => data[segment.value]);
const segmentLabel = computed(() => ({
  qr: "QR location",
  departments: "department",
  positions: "position",
  leaveTypes: "leave type",
}[segment.value]));
const loading = ref(false);
const modalOpen = ref(false);
const form = reactive({ name: "", code: "", description: "" });
const { showError, showToast, toastColor, toastMessage, toastOpen } = useToast();
const qrWriter = new BrowserQRCodeSvgWriter();
const qrImageCache = new Map<string, string>();

async function load() {
  loading.value = true;
  try {
    const result = await getSettingsData();
    data.qr = result.qrLocations;
    data.departments = result.departments;
    data.positions = result.positions;
    data.leaveTypes = result.leaveTypes;
  } catch (error) {
    showError(error);
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  form.name = "";
  form.description = "";
  form.code = segment.value === "qr" ? createQrCodeValue() : "";
  modalOpen.value = true;
}

async function save() {
  try {
    if (segment.value === "qr") {
      await createQrLocation({
        name: form.name,
        qr_code_value: form.code,
        location: form.description,
        is_active: true,
      });
    } else if (segment.value === "departments") {
      await createDepartment({ name: form.name, description: form.description || null });
    } else if (segment.value === "positions") {
      await createPosition({ title: form.name, description: form.description || null });
    } else {
      await createLeaveType({ name: form.name, description: form.description || null });
    }

    modalOpen.value = false;
    showToast(`${segmentLabel.value} created.`);
    await load();
  } catch (error) {
    showError(error);
  }
}

async function toggleQr(item: MasterItem) {
  try {
    await updateQrLocation(item.id, { is_active: !item.is_active });
    await load();
  } catch (error) {
    showError(error);
  }
}

function generateQrValue() {
  form.code = createQrCodeValue();
}

function createQrCodeValue() {
  const suffix = crypto.randomUUID().split("-")[0].toUpperCase();
  return `HR_QR_${suffix}`;
}

function getQrImageUrl(value: string) {
  if (!value) return "";
  const cached = qrImageCache.get(value);
  if (cached) return cached;

  const svg = qrWriter.write(value, 512, 512);
  const svgText = new XMLSerializer().serializeToString(svg);
  const imageUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
  qrImageCache.set(value, imageUrl);
  return imageUrl;
}

async function downloadQrImage(item: MasterItem) {
  try {
    const image = await loadImage(getQrImageUrl(item.qr_code_value));
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to create QR image.");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${slugify(item.name || item.qr_code_value)}.png`;
    link.click();
  } catch (error) {
    showError(error, "Unable to download QR image.");
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to render QR image."));
    image.src = src;
  });
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "qr-code";
}

onMounted(load);
</script>

<style scoped>
.qr-list {
  display: grid;
  gap: 12px;
  padding: 0 16px 16px;
}

.qr-card {
  margin: 0;
}

.qr-card-grid {
  align-items: center;
  display: grid;
  gap: 16px;
  grid-template-columns: 112px minmax(0, 1fr);
}

.qr-preview {
  aspect-ratio: 1;
  background: #fff;
  border: 1px solid var(--ion-color-step-200, #d7d8da);
  border-radius: 8px;
  display: block;
  padding: 8px;
  width: 100%;
}

.qr-details {
  min-width: 0;
}

.qr-title-row {
  align-items: flex-start;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.qr-title-row h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px;
}

.qr-title-row p {
  color: var(--ion-color-medium);
  margin: 0;
}

.qr-value {
  display: block;
  margin-top: 10px;
  overflow-wrap: anywhere;
}

.qr-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  margin-top: 14px;
}

.new-qr-preview {
  align-items: center;
  display: grid;
  gap: 12px;
  justify-items: center;
  margin: 18px auto;
  max-width: 220px;
  text-align: center;
}

@media (max-width: 560px) {
  .qr-card-grid {
    grid-template-columns: 88px minmax(0, 1fr);
  }

  .qr-title-row {
    display: block;
  }

  .qr-title-row ion-badge {
    margin-top: 8px;
  }
}
</style>
