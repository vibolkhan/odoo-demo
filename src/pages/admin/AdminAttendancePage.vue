<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Attendance</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="openCreate">
            <ion-icon slot="icon-only" :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="ion-padding filters">
        <ion-input v-model="date" type="date" label="Date" label-placement="stacked" fill="outline" @ion-change="load" />
        <ion-select v-model="employeeFilter" label="Employee" label-placement="stacked" interface="popover" fill="outline" @ion-change="load">
          <ion-select-option :value="0">All employees</ion-select-option>
          <ion-select-option v-for="employee in employees" :key="employee.id" :value="employee.id">
            {{ employee.first_name }} {{ employee.last_name }}
          </ion-select-option>
        </ion-select>
        <ion-select v-model="status" label="Status" label-placement="stacked" interface="popover" fill="outline" @ion-change="load">
          <ion-select-option value="">All statuses</ion-select-option>
          <ion-select-option v-for="option in statusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </ion-select-option>
        </ion-select>
      </div>

      <app-loading-card v-if="loading" />
      <ion-list v-else-if="records.length">
        <ion-item v-for="record in records" :key="record.id">
          <ion-label>
            <h2>{{ record.employees?.first_name }} {{ record.employees?.last_name }}</h2>
            <p>{{ record.attendance_date }} · {{ time(record.check_in) }} - {{ time(record.check_out) }} · {{ record.worked_hours }}h</p>
            <p class="record-note" v-if="record.note">{{ record.note }}</p>
          </ion-label>
          <status-badge :status="record.status" />
          <ion-buttons slot="end">
            <ion-button fill="clear" @click="openEdit(record)">
              <ion-icon slot="icon-only" :icon="createOutline" />
            </ion-button>
            <ion-button fill="clear" color="danger" @click="confirmDelete(record)">
              <ion-icon slot="icon-only" :icon="trashOutline" />
            </ion-button>
          </ion-buttons>
        </ion-item>
      </ion-list>
      <app-empty-state v-else title="No attendance" message="No attendance records match the filters." />

      <ion-modal :is-open="modalOpen" @did-dismiss="closeModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ editingId ? "Edit attendance" : "Create attendance" }}</ion-title>
            <ion-buttons slot="end">
              <ion-button fill="clear" @click="closeModal">
                <ion-icon slot="icon-only" :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-list>
            <ion-item>
              <ion-select v-model="form.employee_id" label="Employee" label-placement="stacked" interface="popover">
                <ion-select-option v-for="employee in employees" :key="employee.id" :value="employee.id">
                  {{ employee.first_name }} {{ employee.last_name }}
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-input v-model="form.attendance_date" type="date" label="Date" label-placement="stacked" />
            </ion-item>
            <ion-item>
              <ion-select v-model="form.status" label="Status" label-placement="stacked" interface="popover">
                <ion-select-option v-for="option in statusOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-input v-model="form.check_in" type="datetime-local" label="Check in" label-placement="stacked" />
            </ion-item>
            <ion-item>
              <ion-input v-model="form.check_out" type="datetime-local" label="Check out" label-placement="stacked" />
            </ion-item>
            <ion-item>
              <ion-input v-model="form.worked_hours" type="number" min="0" step="0.25" label="Worked hours" label-placement="stacked" />
            </ion-item>
            <ion-item>
              <ion-input v-model="form.late_minutes" type="number" min="0" label="Late minutes" label-placement="stacked" />
            </ion-item>
            <ion-item>
              <ion-input v-model="form.early_leave_minutes" type="number" min="0" label="Early leave minutes" label-placement="stacked" />
            </ion-item>
            <ion-item>
              <ion-input v-model="form.overtime_minutes" type="number" min="0" label="Overtime minutes" label-placement="stacked" />
            </ion-item>
            <ion-item>
              <ion-textarea v-model="form.note" auto-grow label="Note" label-placement="stacked" />
            </ion-item>
          </ion-list>
          <ion-button expand="block" class="save-button" :disabled="saving" @click="save">
            <ion-icon slot="start" :icon="saveOutline" />
            {{ editingId ? "Save changes" : "Create attendance" }}
          </ion-button>
        </ion-content>
      </ion-modal>

      <ion-alert
        :is-open="deleteAlertOpen"
        header="Delete attendance"
        message="This attendance record will be permanently deleted."
        :buttons="deleteButtons"
        @did-dismiss="deleteAlertOpen = false"
      />
      <ion-toast v-model:is-open="toastOpen" :message="toastMessage" :color="toastColor" :duration="3500" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonAlert,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
  onIonViewWillEnter,
} from "@ionic/vue";
import { addOutline, closeOutline, createOutline, saveOutline, trashOutline } from "ionicons/icons";
import { computed, onMounted, reactive, ref } from "vue";
import AppEmptyState from "@/components/AppEmptyState.vue";
import AppLoadingCard from "@/components/AppLoadingCard.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { useToast } from "@/composables/useToast";
import {
  createAttendanceRecord,
  deleteAttendanceRecord,
  getAttendanceRecords,
  updateAttendanceRecord,
} from "@/services/attendanceService";
import { getEmployees } from "@/services/employeeService";
import { useAuthStore } from "@/stores/auth";
import type { TablesInsert, TablesUpdate } from "@/types/database.types";

type AttendanceRecord = Awaited<ReturnType<typeof getAttendanceRecords>>[number];
type Employee = Awaited<ReturnType<typeof getEmployees>>[number];

const statusOptions = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
  { value: "early_leave", label: "Early leave" },
  { value: "half_day", label: "Half day" },
  { value: "on_leave", label: "On leave" },
  { value: "public_holiday", label: "Public holiday" },
  { value: "missing_checkout", label: "Missing checkout" },
  { value: "missing_checkin", label: "Missing check-in" },
];

const auth = useAuthStore();
const date = ref(getLocalDate());
const status = ref("");
const employeeFilter = ref(0);
const records = ref<AttendanceRecord[]>([]);
const employees = ref<Employee[]>([]);
const loading = ref(false);
const saving = ref(false);
const modalOpen = ref(false);
const editingId = ref<number | null>(null);
const deletingId = ref<number | null>(null);
const deleteAlertOpen = ref(false);
const { showError, showToast, toastColor, toastMessage, toastOpen } = useToast();

const form = reactive({
  employee_id: 0,
  attendance_date: getLocalDate(),
  status: "present",
  check_in: "",
  check_out: "",
  worked_hours: "0",
  late_minutes: "0",
  early_leave_minutes: "0",
  overtime_minutes: "0",
  note: "",
});

const deleteButtons = computed(() => [
  { text: "Cancel", role: "cancel" },
  {
    text: "Delete",
    role: "destructive",
    handler: remove,
  },
]);

function getLocalDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function time(value: string | null) {
  return value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--";
}

function toInputDateTime(value: string | null) {
  if (!value) return "";
  const dateValue = new Date(value);
  const offset = dateValue.getTimezoneOffset() * 60_000;
  return new Date(dateValue.getTime() - offset).toISOString().slice(0, 16);
}

function toDatabaseDateTime(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function toNonNegativeNumber(value: string) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : 0;
}

function resetForm() {
  Object.assign(form, {
    employee_id: employees.value[0]?.id || 0,
    attendance_date: date.value || getLocalDate(),
    status: "present",
    check_in: "",
    check_out: "",
    worked_hours: "0",
    late_minutes: "0",
    early_leave_minutes: "0",
    overtime_minutes: "0",
    note: "",
  });
}

async function loadEmployees() {
  employees.value = await getEmployees();
  if (!form.employee_id) form.employee_id = employees.value[0]?.id || 0;
}

async function load() {
  loading.value = true;
  try {
    const startDate = date.value || undefined;
    records.value = await getAttendanceRecords({
      startDate,
      endDate: startDate,
      employeeId: employeeFilter.value || undefined,
      status: status.value || undefined,
    });
  } catch (error) {
    showError(error, "Unable to load attendance.");
  } finally {
    loading.value = false;
  }
}

async function refresh() {
  try {
    await loadEmployees();
    await load();
  } catch (error) {
    showError(error, "Unable to load attendance.");
  }
}

function openCreate() {
  editingId.value = null;
  resetForm();
  modalOpen.value = true;
}

function openEdit(record: AttendanceRecord) {
  editingId.value = record.id;
  Object.assign(form, {
    employee_id: record.employee_id,
    attendance_date: record.attendance_date,
    status: record.status,
    check_in: toInputDateTime(record.check_in),
    check_out: toInputDateTime(record.check_out),
    worked_hours: String(record.worked_hours),
    late_minutes: String(record.late_minutes),
    early_leave_minutes: String(record.early_leave_minutes),
    overtime_minutes: String(record.overtime_minutes),
    note: record.note || "",
  });
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
}

function buildPayload(): TablesInsert<"attendance_records"> | TablesUpdate<"attendance_records"> {
  if (!form.employee_id) throw new Error("Select an employee.");
  if (!form.attendance_date) throw new Error("Select an attendance date.");

  return {
    employee_id: Number(form.employee_id),
    attendance_date: form.attendance_date,
    status: form.status,
    check_in: toDatabaseDateTime(form.check_in),
    check_out: toDatabaseDateTime(form.check_out),
    worked_hours: toNonNegativeNumber(form.worked_hours),
    late_minutes: toNonNegativeNumber(form.late_minutes),
    early_leave_minutes: toNonNegativeNumber(form.early_leave_minutes),
    overtime_minutes: toNonNegativeNumber(form.overtime_minutes),
    note: form.note.trim() || null,
    updated_by: auth.appUser?.id || null,
  };
}

async function save() {
  saving.value = true;
  try {
    const payload = buildPayload();
    if (editingId.value) {
      await updateAttendanceRecord(editingId.value, payload);
      showToast("Attendance updated.");
    } else {
      await createAttendanceRecord({ ...payload, created_by: auth.appUser?.id || null } as TablesInsert<"attendance_records">);
      showToast("Attendance created.");
    }
    modalOpen.value = false;
    await load();
  } catch (error) {
    showError(error, "Unable to save attendance.");
  } finally {
    saving.value = false;
  }
}

function confirmDelete(record: AttendanceRecord) {
  deletingId.value = record.id;
  deleteAlertOpen.value = true;
}

async function remove() {
  if (!deletingId.value) return;
  try {
    await deleteAttendanceRecord(deletingId.value);
    showToast("Attendance deleted.");
    await load();
  } catch (error) {
    showError(error, "Unable to delete attendance.");
  } finally {
    deletingId.value = null;
  }
}

onMounted(refresh);
onIonViewWillEnter(refresh);
</script>

<style scoped>
.filters {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.record-note {
  margin-top: 4px;
  color: var(--ion-color-medium);
}

.save-button {
  margin-top: 16px;
}
</style>
