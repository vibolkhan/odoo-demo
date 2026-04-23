<template>
  <div class="request-shell">
    <section class="form-card">
      <div class="form-header">
        <div>
          <h2>Request Details</h2>
        </div>
      </div>

      <div class="form-grid">
        <div class="field-block">
          <label class="field-label" for="employee">Employee</label>
          <ion-item
            id="employee"
            lines="none"
            class="field searchable-trigger"
            button
            :detail="false"
            :disabled="isLoadingEmployees || !employees.length"
            @click="openEmployeeSearch"
          >
            <ion-input
              :value="selectedEmployeeName"
              readonly
              class="searchable-input"
              :placeholder="
                isLoadingEmployees ? 'Loading employees...' : 'Search employee'
              "
            />
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
              :disabled="isLoadingLeaveTypes || !leaveTypes.length"
              :placeholder="
                isLoadingLeaveTypes
                  ? 'Loading leave types...'
                  : 'Select leave type'
              "
            >
              <ion-select-option
                v-for="option in leaveTypes"
                :key="option.id"
                :value="option.id"
              >
                {{ option.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </div>

        <p v-if="leaveTypeErrorMessage" class="field-message error-message">
          {{ leaveTypeErrorMessage }}
        </p>

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

      <p v-if="submitErrorMessage" class="submit-message error-message">
        {{ submitErrorMessage }}
      </p>

      <p v-if="submitSuccessMessage" class="submit-message success-message">
        {{ submitSuccessMessage }}
      </p>

      <ion-button
        expand="block"
        class="submit-button"
        :disabled="isSubmittingRequest"
        @click="handleSubmitRequest"
      >
        {{ isSubmittingRequest ? "Submitting..." : "Request Approval" }}
      </ion-button>

      <ion-modal
        :is-open="isEmployeeSearchOpen"
        css-class="employee-search-overlay"
        @didDismiss="closeEmployeeSearch"
      >
        <ion-content class="employee-search-modal" :scroll-y="true">
          <div class="employee-search-sticky">
            <div class="employee-search-header">
              <h3>Select Employee</h3>
              <ion-button
                fill="clear"
                size="small"
                @click="closeEmployeeSearch"
              >
                Close
              </ion-button>
            </div>

            <ion-searchbar
              v-model="employeeSearchQuery"
              placeholder="Search by name, company, or department"
            />
          </div>

          <ion-list v-if="filteredEmployees.length" class="employee-results">
            <ion-item
              v-for="employee in filteredEmployees"
              :key="employee.id"
              button
              :detail="false"
              class="employee-option"
              @click="selectEmployee(employee.id)"
            >
              <ion-label>
                <p>{{ employee.name }}</p>
              </ion-label>
            </ion-item>
          </ion-list>

          <ion-infinite-scroll
            :disabled="!hasMoreEmployees"
            @ionInfinite="loadMoreEmployees"
          >
            <ion-infinite-scroll-content
              loading-spinner="bubbles"
              loading-text="Loading more employees..."
            />
          </ion-infinite-scroll>

          <div
            v-if="!filteredEmployees.length && !isLoadingEmployees"
            class="employee-empty-state"
          >
            No employees match your search.
          </div>
        </ion-content>
      </ion-modal>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonTextarea,
} from "@ionic/vue";
import { attachOutline } from "ionicons/icons";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { fetchEmployees, type EmployeeOption } from "@/utils/employees";
import { fetchLeaveTypes, type LeaveTypeOption } from "@/utils/leaveTypes";
import { saveLeaveRequest } from "@/utils/leaveRequests";

const leaveType = ref<number | null>(null);
const leaveTypes = ref<LeaveTypeOption[]>([]);
const employees = ref<EmployeeOption[]>([]);
const selectedEmployeeId = ref<number | null>(null);
const selectedEmployeeDetails = ref<EmployeeOption | null>(null);
const startDate = ref("");
const endDate = ref("");
const isHalfDay = ref(false);
const reason = ref("");
const selectedFileName = ref("");
const isLoadingEmployees = ref(false);
const isLoadingMoreEmployees = ref(false);
const hasMoreEmployees = ref(true);
const employeeErrorMessage = ref("");
const isLoadingLeaveTypes = ref(false);
const leaveTypeErrorMessage = ref("");
const submitErrorMessage = ref("");
const submitSuccessMessage = ref("");
const isSubmittingRequest = ref(false);
const isEmployeeSearchOpen = ref(false);
const employeeSearchQuery = ref("");
const activeEmployeeQuery = ref("");
const employeePageSize = 80;
const nextEmployeePage = ref(1);
let employeeSearchTimer: ReturnType<typeof setTimeout> | null = null;
let employeeLoadRequestId = 0;

const selectedEmployee = computed(
  () =>
    selectedEmployeeDetails.value ??
    employees.value.find(
      (employee) => employee.id === selectedEmployeeId.value,
    ) ?? {
      id: 0,
      name: "",
      company: "",
      department: "",
    },
);

const selectedEmployeeName = computed(() => selectedEmployee.value.name);
const filteredEmployees = computed(() => employees.value);

const loadLeaveTypes = async () => {
  isLoadingLeaveTypes.value = true;
  leaveTypeErrorMessage.value = "";

  try {
    const options = await fetchLeaveTypes({
      employeeId: selectedEmployeeId.value ?? false,
      dateFrom: startDate.value || undefined,
      dateTo: endDate.value || undefined,
    });

    leaveTypes.value = options;

    if (leaveType.value != null) {
      const hasSelectedOption = options.some(
        (option) => option.id === leaveType.value,
      );

      if (!hasSelectedOption) {
        leaveType.value = null;
      }
    }
  } catch (error) {
    leaveTypes.value = [];
    leaveType.value = null;
    leaveTypeErrorMessage.value =
      error instanceof Error ? error.message : "Unable to load leave types.";
  } finally {
    isLoadingLeaveTypes.value = false;
  }
};

const loadEmployees = async (reset = false) => {
  if (reset) {
    isLoadingEmployees.value = true;
    employeeErrorMessage.value = "";
    hasMoreEmployees.value = true;
    nextEmployeePage.value = 1;
  } else {
    if (isLoadingMoreEmployees.value || !hasMoreEmployees.value) {
      return;
    }

    isLoadingMoreEmployees.value = true;
  }

  const requestQuery = activeEmployeeQuery.value;
  const requestPage = reset ? 1 : nextEmployeePage.value;
  const requestOffset = (requestPage - 1) * employeePageSize;
  const requestId = ++employeeLoadRequestId;

  try {
    const result = await fetchEmployees({
      offset: requestOffset,
      limit: employeePageSize,
      query: requestQuery,
    });

    if (
      requestId !== employeeLoadRequestId ||
      requestQuery !== activeEmployeeQuery.value
    ) {
      return;
    }

    employees.value = reset
      ? result.records
      : [...employees.value, ...result.records];
    hasMoreEmployees.value = result.hasMore;
    nextEmployeePage.value = requestPage + 1;

    if (selectedEmployeeId.value != null) {
      const matchingEmployee = employees.value.find(
        (employee) => employee.id === selectedEmployeeId.value,
      );

      if (matchingEmployee) {
        selectedEmployeeDetails.value = matchingEmployee;
      }
    }
  } catch (error) {
    if (requestId !== employeeLoadRequestId) {
      return;
    }

    if (reset) {
      employees.value = [];
      hasMoreEmployees.value = false;
    }

    employeeErrorMessage.value =
      error instanceof Error ? error.message : "Unable to load employees.";
  } finally {
    if (reset) {
      isLoadingEmployees.value = false;
    } else {
      isLoadingMoreEmployees.value = false;
    }
  }
};

const loadMoreEmployees = async (event: CustomEvent) => {
  const infiniteScroll = event.target as HTMLIonInfiniteScrollElement | null;

  await loadEmployees(false);
  await infiniteScroll?.complete();

  if (infiniteScroll) {
    infiniteScroll.disabled = !hasMoreEmployees.value;
  }
};

const openEmployeeSearch = () => {
  employeeSearchQuery.value = "";
  activeEmployeeQuery.value = "";
  isEmployeeSearchOpen.value = true;
  void loadEmployees(true);
};

const closeEmployeeSearch = () => {
  isEmployeeSearchOpen.value = false;
};

const selectEmployee = (employeeId: number) => {
  selectedEmployeeId.value = employeeId;
  selectedEmployeeDetails.value =
    employees.value.find((employee) => employee.id === employeeId) ?? null;
  closeEmployeeSearch();
};

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  selectedFileName.value = input.files?.[0]?.name ?? "";
};

const handleSubmitRequest = async () => {
  submitErrorMessage.value = "";
  submitSuccessMessage.value = "";

  if (!selectedEmployeeId.value) {
    submitErrorMessage.value = "Please select an employee.";
    return;
  }

  if (!leaveType.value) {
    submitErrorMessage.value = "Please select a leave type.";
    return;
  }

  if (!startDate.value || !endDate.value) {
    submitErrorMessage.value = "Please select both start and end dates.";
    return;
  }

  if (startDate.value > endDate.value) {
    submitErrorMessage.value =
      "End date must be the same as or after start date.";
    return;
  }

  isSubmittingRequest.value = true;

  try {
    await saveLeaveRequest({
      employeeId: selectedEmployeeId.value,
      leaveTypeId: leaveType.value,
      requestDateFrom: startDate.value,
      requestDateTo: endDate.value,
      requestUnitHalf: isHalfDay.value,
      reason: reason.value,
    });

    submitSuccessMessage.value = "Leave request submitted successfully.";
    reason.value = "";
    isHalfDay.value = false;
    selectedFileName.value = "";
  } catch (error) {
    submitErrorMessage.value =
      error instanceof Error
        ? error.message
        : "Unable to submit leave request.";
  } finally {
    isSubmittingRequest.value = false;
  }
};

onMounted(() => {
  void loadEmployees(true);
  void loadLeaveTypes();
});

watch(employeeSearchQuery, (value) => {
  if (employeeSearchTimer) {
    clearTimeout(employeeSearchTimer);
  }

  employeeSearchTimer = setTimeout(() => {
    activeEmployeeQuery.value = value.trim();
    void loadEmployees(true);
  }, 250);
});

watch([selectedEmployeeId, startDate, endDate], () => {
  void loadLeaveTypes();
});

onBeforeUnmount(() => {
  if (employeeSearchTimer) {
    clearTimeout(employeeSearchTimer);
  }
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

.searchable-trigger {
  cursor: pointer;
}

.searchable-input {
  pointer-events: none;
}

.employee-search-modal {
  --padding-top: 18px;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-bottom: calc(env(safe-area-inset-bottom) + 24px);
}

:global(.employee-search-overlay) {
  --width: 100vw;
  --height: 100vh;
  --max-width: 100vw;
  --max-height: 100vh;
  --border-radius: 0;
}

.employee-search-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.employee-search-sticky {
  position: sticky;
  top: 0;
  z-index: 10;
  padding-top: 4px;
  background: var(--ion-background-color, #fff);
}

.employee-search-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #152437;
}

.employee-results {
  margin-top: 10px;
  background: transparent;
  padding-bottom: 28px;
}

.employee-option {
  --border-radius: 16px;
  --background: #f7f9fc;
  margin-bottom: 10px;
}

.employee-option p {
  margin: 4px 0 0;
  color: #5b6c81;
  font-size: 0.9rem;
}

.employee-empty-state {
  padding: 24px 6px 8px;
  text-align: center;
  color: #6c7b8d;
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

.submit-message {
  margin: 18px 0 0;
  font-size: 0.92rem;
}

.success-message {
  color: #18794e;
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
