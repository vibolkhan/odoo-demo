<template>
  <div class="request-shell">
    <!-- <section class="balance-grid">
      <article class="balance-card annual">
        <p class="balance-label">Total Leave</p>
        <p class="balance-value">14</p>
        <span class="balance-meta">Days</span>
      </article>

      <article class="balance-card sick">
        <p class="balance-label">Total Remaining</p>
        <p class="balance-value">08</p>
        <p class="balance-meta">Days</p>
      </article>
    </section> -->

    <section class="form-card">
      <div class="form-header">
        <div>
          <h2>Request Details</h2>
        </div>
      </div>

      <div class="form-grid">
        <div class="field-block">
          <label class="field-label" for="employee">Employee</label>
          <ion-item id="employee" lines="none" class="field">
            <ion-select
              v-model="selectedEmployeeId"
              label-placement="stacked"
              class="leave-type-select"
              :disabled="isLoadingEmployees || !employees.length"
              interface="popover"
              placeholder="Select employee"
            >
              <ion-select-option
                v-for="employee in employees"
                :key="employee.id"
                :value="employee.id"
              >
                {{ employee.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </div>

        <div class="field-block">
          <label class="field-label" for="company">Company</label>
          <ion-item id="company" lines="none" class="field readonly-field">
            <ion-input
              :value="selectedEmployee.company"
              readonly
              placeholder="Company will appear here"
            />
          </ion-item>
        </div>

        <div class="field-block field-block-full">
          <label class="field-label" for="department">Department</label>
          <ion-item id="department" lines="none" class="field readonly-field">
            <ion-input
              :value="selectedEmployee.department"
              readonly
              placeholder="Department will appear here"
            />
          </ion-item>
        </div>

        <p v-if="employeeErrorMessage" class="field-message error-message">
          {{ employeeErrorMessage }}
        </p>

        <div class="field-block field-block-full">
          <label class="field-label" for="leave-type">Leave type</label>
          <ion-item id="leave-type" lines="none" class="field">
            <ion-select
              v-model="leaveType"
              label-placement="stacked"
              class="leave-type-select"
            >
              <ion-select-option value="annual">Annual Leave</ion-select-option>
              <ion-select-option value="sick">Sick Leave</ion-select-option>
              <ion-select-option value="unpaid">Unpaid Leave</ion-select-option>
            </ion-select>
          </ion-item>
        </div>

        <div class="field-block">
          <label class="field-label" for="start-date">Start date</label>
          <ion-item id="start-date" lines="none" class="field date-field">
            <ion-input v-model="startDate" type="date" />
            <span v-if="!startDate" class="date-placeholder">mm/dd/yyyy</span>
          </ion-item>
        </div>

        <div class="field-block">
          <label class="field-label" for="end-date">End date</label>
          <ion-item id="end-date" lines="none" class="field date-field">
            <ion-input v-model="endDate" type="date" />
            <span v-if="!endDate" class="date-placeholder">mm/dd/yyyy</span>
          </ion-item>
        </div>

        <div class="field-block field-block-full">
          <ion-item lines="none" class="field checkbox-field">
            <ion-checkbox v-model="isHalfDay" label-placement="end">
              Half day
            </ion-checkbox>
          </ion-item>
        </div>

        <div class="field-block field-block-full">
          <label class="field-label" for="reason">Reason for leave</label>
          <ion-item id="reason" lines="none" class="field textarea-field">
            <ion-textarea
              v-model="reason"
              :auto-grow="true"
              placeholder="Share a short note for your manager or team."
            />
          </ion-item>
        </div>
      </div>

      <div class="upload-card">
        <input
          id="supporting-document"
          class="upload-input"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          @change="handleFileChange"
        />

        <label class="upload-label" for="supporting-document">
          <span class="upload-label-main">
            <ion-icon
              class="upload-icon"
              :icon="attachOutline"
              aria-hidden="true"
            />
            <span class="upload-copy">
              {{ selectedFileName || "Upload document if needed" }}
            </span>
          </span>
        </label>
      </div>

      <ion-button expand="block" class="submit-button">
        Request Approval
      </ion-button>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonCheckbox,
  IonIcon,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonTextarea,
} from "@ionic/vue";
import { attachOutline } from "ionicons/icons";
import { computed, onMounted, ref } from "vue";
import { fetchEmployees, type EmployeeOption } from "@/utils/employees";

const leaveType = ref("annual");
const employees = ref<EmployeeOption[]>([]);
const selectedEmployeeId = ref<number | null>(null);
const startDate = ref("");
const endDate = ref("");
const isHalfDay = ref(false);
const reason = ref("");
const selectedFileName = ref("");
const isLoadingEmployees = ref(false);
const employeeErrorMessage = ref("");

const selectedEmployee = computed(
  () =>
    employees.value.find((employee) => employee.id === selectedEmployeeId.value) ?? {
      id: 0,
      name: "",
      company: "",
      department: "",
    },
);

const loadEmployees = async () => {
  isLoadingEmployees.value = true;
  employeeErrorMessage.value = "";

  try {
    const fetchedEmployees = await fetchEmployees();
    employees.value = fetchedEmployees;
    selectedEmployeeId.value = fetchedEmployees[0]?.id ?? null;
  } catch (error) {
    employees.value = [];
    selectedEmployeeId.value = null;
    employeeErrorMessage.value =
      error instanceof Error ? error.message : "Unable to load employees.";
  } finally {
    isLoadingEmployees.value = false;
  }
};

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  selectedFileName.value = input.files?.[0]?.name ?? "";
};

onMounted(() => {
  void loadEmployees();
});
</script>

<style scoped>
.request-shell {
  display: grid;
  gap: 18px;
}

.hero-card,
.balance-card,
.form-card {
  border-radius: 24px;
  box-shadow: 0 16px 36px rgba(24, 41, 67, 0.08);
}

.hero-card {
  padding: 24px;
  background:
    radial-gradient(
      circle at top right,
      rgba(255, 255, 255, 0.18),
      transparent 28%
    ),
    linear-gradient(135deg, #18314b 0%, #275986 58%, #d68c4b 100%);
  color: #fff;
}

.eyebrow,
.section-label,
.balance-label {
  margin: 0;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  margin: 12px 0 10px;
  font-size: 2.1rem;
  line-height: 1.05;
}

.hero-copy {
  margin: 0;
  max-width: 32ch;
  color: rgba(255, 255, 255, 0.84);
  line-height: 1.5;
}

.balance-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.balance-card {
  padding: 18px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(20, 40, 64, 0.08);
}

.balance-card.annual {
  background: linear-gradient(180deg, #fff7ea 0%, #ffffff 100%);
}

.balance-card.sick {
  background: linear-gradient(180deg, #eef6ff 0%, #ffffff 100%);
}

.balance-value {
  margin: 10px 0 6px;
  font-size: 2.3rem;
  font-weight: 800;
  line-height: 1;
  color: #16273b;
}

.balance-meta {
  margin: 0;
  color: #5b6c81;
}

.form-card {
  padding: 20px 16px 16px;
  background: rgba(255, 255, 255, 0.97);
}

.form-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.section-label {
  color: #ba7228;
}

h2 {
  margin: 8px 0 0;
  font-size: 1.45rem;
  color: #152437;
}

.status-pill {
  padding: 8px 12px;
  border-radius: 999px;
  background: #eef3f8;
  color: #50627a;
  font-size: 0.82rem;
  font-weight: 700;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field-block {
  display: grid;
  gap: 8px;
}

.field-block-full {
  grid-column: 1 / -1;
}

.field-message {
  margin: -4px 0 0;
  font-size: 0.85rem;
}

.error-message {
  color: #b64646;
}

.field-label {
  font-size: 0.86rem;
  font-weight: 700;
  color: #44556c;
}

.field {
  --background: #f7f9fc;
  --border-radius: 18px;
  --padding-start: 14px;
  --inner-padding-end: 14px;
  --min-height: 56px;
}

.date-field {
  position: relative;
}

.date-placeholder {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #8a97a8;
  pointer-events: none;
  z-index: 1;
}

.leave-type-select {
  width: 100%;
}

.leave-type-select::part(container) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.textarea-field {
  --padding-top: 10px;
  --padding-bottom: 10px;
}

.readonly-field {
  opacity: 0.9;
}

.checkbox-field {
  --min-height: 52px;
}

.checkbox-field ion-checkbox {
  width: 100%;
  font-weight: 600;
  color: #44556c;
}

.upload-card {
  margin-top: 18px;
  border-radius: 22px;
  border: 2px dashed #d4dbe4;
  background: #e7edf4;
  overflow: hidden;
}

.upload-label {
  display: block;
  cursor: pointer;
  padding: 22px 24px;
  color: #5f6e80;
  font-size: 0.95rem;
}

.upload-label-main {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 58px;
}

.upload-icon {
  flex: 0 0 auto;
  font-size: 1.7rem;
  color: #596879;
}

.upload-input {
  display: none;
}

.upload-copy {
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.4;
  word-break: break-word;
}

.submit-button {
  margin-top: 18px;
  --background: #3b82f6;
  --border-radius: 18px;
  min-height: 54px;
  font-weight: 700;
}

@media (max-width: 640px) {
  .balance-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-header {
    display: grid;
  }
}
</style>
