<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>My Requests</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ion-refresh="refresh">
        <ion-refresher-content pulling-text="Pull to refresh requests" refreshing-text="Refreshing requests..." />
      </ion-refresher>

      <div class="app-page app-stack requests-page">
        <ion-segment v-model="segment" scrollable>
          <ion-segment-button value="leave">
            <ion-label>Leave</ion-label>
          </ion-segment-button>
          <ion-segment-button value="overtime">
            <ion-label>Overtime</ion-label>
          </ion-segment-button>
          <ion-segment-button value="correction">
            <ion-label>Correction</ion-label>
          </ion-segment-button>
        </ion-segment>

        <app-loading-card v-if="loading" />

        <ion-list v-else-if="current.length" class="app-list requests-list">
          <request-card
            v-for="item in current"
            :key="item.id"
            :status="item.status"
            :title="requestTitle(item)"
            :subtitle="item.reason || `Created ${item.created_at.slice(0, 10)}`"
          />
        </ion-list>

        <app-empty-state
          v-else
          title="No requests"
          :message="`You have no ${segment} requests yet.`"
        />
      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button
          :aria-label="`Create ${segment} request`"
          @click="openModal"
        >
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>

      <ion-modal
        class="create-request-modal"
        :is-open="modalOpen"
        :style="modalStyle"
        @did-dismiss="closeModal"
      >
        <ion-header>
          <ion-toolbar>
            <ion-title>New {{ segment }} request</ion-title>
            <ion-button slot="end" fill="clear" @click="closeModal">
              Close
            </ion-button>
          </ion-toolbar>
        </ion-header>

        <ion-content>
          <div class="app-form-shell request-form-shell">
            <ion-text color="medium">
              <p class="form-help">Fields marked with * are required.</p>
            </ion-text>

            <ion-list class="request-form-list">
              <template v-if="segment === 'leave'">
                <ion-note color="medium" class="field-caption">
                  Leave type *
                </ion-note>

                <ion-item class="request-form-field">
                  <ion-select
                    v-model="form.leaveTypeId"
                    interface="popover"
                    aria-label="Leave type"
                    label-placement="stacked"
                  >
                    <ion-select-option v-if="!leaveTypes.length" :value="1">
                      Default leave type
                    </ion-select-option>

                    <ion-select-option
                      v-for="leaveType in leaveTypes"
                      :key="leaveType.id"
                      :value="leaveType.id"
                    >
                      {{ leaveType.name }}
                    </ion-select-option>
                  </ion-select>
                </ion-item>

                <ion-note
                  v-if="errors.leaveTypeId"
                  color="danger"
                  class="field-error"
                >
                  {{ errors.leaveTypeId }}
                </ion-note>
              </template>

              <ion-item class="request-form-field">
                <ion-input
                  v-model="form.start"
                  :type="startInputType"
                  :label="`${startLabel} *`"
                  label-placement="stacked"
                />
              </ion-item>

              <ion-note v-if="errors.start" color="danger" class="field-error">
                {{ errors.start }}
              </ion-note>

              <ion-item class="request-form-field">
                <ion-input
                  v-model="form.end"
                  :type="endInputType"
                  :label="endLabel"
                  label-placement="stacked"
                />
              </ion-item>

              <ion-item class="request-form-field">
                <ion-textarea
                  v-model.trim="form.reason"
                  label="Reason *"
                  label-placement="stacked"
                />
              </ion-item>

              <ion-note v-if="errors.reason" color="danger" class="field-error">
                {{ errors.reason }}
              </ion-note>
            </ion-list>

            <ion-button expand="block" :disabled="saving" @click="create">
              {{ saving ? "Submitting..." : "Submit request" }}
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>

      <ion-toast
        v-model:is-open="toastOpen"
        :message="toastMessage"
        :color="toastColor"
        :duration="3500"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
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
  IonSelect,
  IonSelectOption,
  IonText,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
  onIonViewWillEnter,
} from "@ionic/vue";
import { addOutline } from "ionicons/icons";
import { computed, reactive, ref, watch } from "vue";
import AppEmptyState from "@/components/AppEmptyState.vue";
import AppLoadingCard from "@/components/AppLoadingCard.vue";
import RequestCard from "@/components/RequestCard.vue";
import {
  createCorrectionRequest,
  createLeaveRequest,
  createOvertimeRequest,
  getCorrectionRequests,
  getLeaveRequests,
  getOvertimeRequests,
} from "@/services/requestService";
import { getLeaveTypes } from "@/services/settingsService";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";

type Segment = "leave" | "overtime" | "correction";
type LeaveType = Awaited<ReturnType<typeof getLeaveTypes>>[number];

type RequestForm = {
  leaveTypeId: number | null;
  start: string;
  end: string;
  reason: string;
};

type RequestFormErrors = Partial<Record<keyof RequestForm, string>>;

const auth = useAuthStore();
const segment = ref<Segment>("leave");
const loading = ref(false);
const saving = ref(false);
const modalOpen = ref(false);
const leaveTypes = ref<LeaveType[]>([]);

const lists = reactive<Record<Segment, any[]>>({
  leave: [],
  overtime: [],
  correction: [],
});

const form = reactive<RequestForm>(createEmptyForm());
const errors = reactive<RequestFormErrors>({});

const current = computed(() => lists[segment.value]);

const modalStyle = computed(() => ({
  "--height": segment.value === "leave" ? "560px" : "500px",
}));

const { showError, showToast, toastColor, toastMessage, toastOpen } = useToast();

const startLabel = computed(() => {
  if (segment.value === "leave") return "Start date";
  if (segment.value === "overtime") return "Overtime date";
  return "Requested check-in";
});

const endLabel = computed(() => {
  if (segment.value === "leave") return "End date";
  if (segment.value === "overtime") return "End time";
  return "Requested check-out";
});

const startInputType = computed(() =>
  segment.value === "correction" ? "datetime-local" : "date",
);

const endInputType = computed(() => {
  if (segment.value === "correction") return "datetime-local";
  if (segment.value === "overtime") return "time";
  return "date";
});

function createEmptyForm(): RequestForm {
  return {
    leaveTypeId: null,
    start: "",
    end: "",
    reason: "",
  };
}

function resetForm() {
  Object.assign(form, createEmptyForm());
  form.leaveTypeId = leaveTypes.value[0]?.id || 1;
  clearErrors();
}

function clearErrors() {
  Object.keys(errors).forEach((key) => {
    delete errors[key as keyof RequestForm];
  });
}

function validateForm() {
  clearErrors();

  if (segment.value === "leave" && !form.leaveTypeId) {
    errors.leaveTypeId = "Select a leave type.";
  }

  if (!form.start) {
    errors.start = `${startLabel.value} is required.`;
  }

  if (!form.reason) {
    errors.reason = "Reason is required.";
  }

  return !Object.keys(errors).length;
}

function requestTitle(item: any) {
  return item.start_date
    ? `${item.start_date} to ${item.end_date}`
    : item.overtime_date || `Correction #${item.id}`;
}

async function load() {
  if (!auth.employee?.id) return;

  loading.value = true;

  try {
    const [leave, overtime, correction, leaveTypeRows] = await Promise.all([
      getLeaveRequests(auth.employee.id),
      getOvertimeRequests(auth.employee.id),
      getCorrectionRequests(auth.employee.id),
      getLeaveTypes(),
    ]);

    lists.leave = leave;
    lists.overtime = overtime;
    lists.correction = correction;
    leaveTypes.value = leaveTypeRows;

    if (!form.leaveTypeId) {
      form.leaveTypeId = leaveTypeRows[0]?.id || 1;
    }
  } catch (error) {
    showError(error);
  } finally {
    loading.value = false;
  }
}

async function refresh(event: CustomEvent) {
  try {
    await load();
  } finally {
    (event.target as HTMLIonRefresherElement).complete();
  }
}

function openModal() {
  resetForm();
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  resetForm();
}

async function create() {
  if (!auth.employee?.id) return;
  if (!validateForm()) return;

  saving.value = true;

  try {
    if (segment.value === "leave") {
      await createLeaveRequest({
        employee_id: auth.employee.id,
        leave_type_id: Number(form.leaveTypeId),
        start_date: form.start,
        end_date: form.end || form.start,
        total_days: 1,
        reason: form.reason,
      });
    } else if (segment.value === "overtime") {
      await createOvertimeRequest({
        employee_id: auth.employee.id,
        overtime_date: form.start,
        start_time: "17:00",
        end_time: form.end || "18:00",
        total_hours: 1,
        reason: form.reason,
      });
    } else {
      await createCorrectionRequest({
        employee_id: auth.employee.id,
        requested_check_in: form.start,
        requested_check_out: form.end || null,
        reason: form.reason,
      });
    }

    modalOpen.value = false;
    resetForm();
    showToast("Request submitted.");
    await load();
  } catch (error) {
    showError(error);
  } finally {
    saving.value = false;
  }
}

watch(segment, resetForm);
onIonViewWillEnter(load);
</script>

<style scoped>
.requests-page {
  align-items: stretch;
}

.requests-list {
  justify-self: stretch;
  margin: 0;
  max-width: none;
  padding: 0;
  width: 100%;
}

.requests-list :deep(ion-item),
.requests-list :deep(.request-card),
.requests-list :deep(ion-card) {
  text-align: left;
}

.create-request-modal {
  --backdrop-opacity: 0.38;
  --border-radius: 18px;
  --box-shadow: 0 18px 48px rgba(20, 32, 68, 0.24);
  --max-height: 86vh;
  --width: min(92vw, 460px);
}

.create-request-modal::part(content) {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.create-request-modal ion-toolbar {
  --background: #ffffff;
}

.create-request-modal ion-content {
  --background: #ffffff;
}

.request-form-shell {
  padding: 18px;
}

.request-form-list {
  display: grid;
  gap: 12px;
}

.request-form-field {
  --background: #ffffff;
  --border-color: rgba(49, 87, 213, 0.16);
  --border-radius: 10px;
  --border-style: solid;
  --border-width: 1px;
  --inner-border-width: 0;
  --min-height: 64px;
  --padding-bottom: 4px;
  --padding-end: 12px;
  --padding-start: 12px;
  --padding-top: 4px;
}

.form-help {
  margin: 0 0 12px;
}

.field-caption {
  display: block;
  margin: 4px 4px 0;
  text-align: left;
}

.field-error {
  display: block;
  margin: 4px 4px 10px;
  text-align: left;
}

@media (max-width: 560px) {
  .request-form-shell {
    padding: 16px;
  }
}
</style>