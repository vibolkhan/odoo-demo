<template>
  <div class="request-shell">
    <section class="form-card">
      <div class="form-grid">
        <div class="field-block field-block-full">
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
                isLoadingEmployees ? 'Loading employees...' : 'Select employee'
              "
            />
          </ion-item>
        </div>

        <div
          v-if="selectedEmployeeName"
          class="employee-summary field-block-full"
        >
          <div>
            <span>Company</span>
            <strong>{{ selectedEmployee.company || "-" }}</strong>
          </div>

          <div>
            <span>Department</span>
            <strong>{{ selectedEmployee.department || "-" }}</strong>
          </div>
        </div>

        <p v-if="employeeErrorMessage" class="field-message error-message">
          {{ employeeErrorMessage }}
        </p>

        <div class="field-block field-block-full">
          <label class="field-label" for="leave-type">Leave Type</label>

          <ion-item
            id="leave-type"
            lines="none"
            class="field leave-type-field"
            :class="{ 'has-value': Boolean(selectedLeaveTypeName) }"
          >
            <ion-select
              v-model="leaveType"
              interface="modal"
              :interface-options="leaveTypeSelectInterfaceOptions"
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

        <div class="date-grid field-block-full">
          <div class="field-block">
            <label class="field-label" for="start-date">Start Date</label>

            <div class="date-field-block">
              <ion-item
                id="start-date"
                lines="none"
                class="field date-field date-trigger"
                button
                :detail="false"
                @click="openDatePicker('start')"
              >
                <div
                  class="date-display"
                  :class="{ 'date-display-placeholder': !startDate }"
                >
                  {{ startDate || localizedDatePlaceholder }}
                </div>
                <ion-icon
                  slot="end"
                  :icon="calendarOutline"
                  aria-hidden="true"
                  class="date-field-icon"
                />
              </ion-item>
            </div>
          </div>

          <div class="field-block">
            <label class="field-label" for="end-date">End Date</label>

            <div class="date-field-block">
              <ion-item
                id="end-date"
                lines="none"
                class="field date-field date-trigger"
                button
                :detail="false"
                @click="openDatePicker('end')"
              >
                <div
                  class="date-display"
                  :class="{ 'date-display-placeholder': !endDate }"
                >
                  {{ endDate || localizedDatePlaceholder }}
                </div>
                <ion-icon
                  slot="end"
                  :icon="calendarOutline"
                  aria-hidden="true"
                  class="date-field-icon"
                />
              </ion-item>
            </div>
          </div>
        </div>

        <div class="field-block field-block-full">
          <ion-item lines="none" class="field checkbox-field">
            <ion-checkbox v-model="isHalfDay" label-placement="end">
              Half day request
            </ion-checkbox>
          </ion-item>
        </div>

        <div class="field-block field-block-full">
          <label class="field-label" for="reason">Reason</label>

          <ion-item id="reason" lines="none" class="field textarea-field">
            <ion-textarea
              v-model="reason"
              :auto-grow="true"
              placeholder="Write a short reason for your manager."
            />
          </ion-item>
        </div>
      </div>

      <!-- <div class="upload-card">
        <input
          id="supporting-document"
          class="upload-input"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          @change="handleFileChange"
        />

        <label class="upload-label" for="supporting-document">
          <ion-icon :icon="attachOutline" aria-hidden="true" />
          <span>{{ selectedFileName || "Attach document optional" }}</span>
        </label>
      </div> -->

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
        {{ isSubmittingRequest ? "Submitting..." : "Submit Request" }}
      </ion-button>
    </section>

    <ion-modal
      :is-open="isDatePickerOpen"
      :breakpoints="[0, 0.72, 0.9]"
      :initial-breakpoint="0.72"
      :backdrop-breakpoint="0"
      handle="true"
      @didDismiss="closeDatePicker"
    >
      <ion-content class="date-picker-modal">
        <section class="date-picker-shell">
          <div class="date-picker-header">
            <div>
              <p class="date-picker-eyebrow">Select</p>
              <h3>
                {{ activeDateField === "start" ? "Start Date" : "End Date" }}
              </h3>
            </div>

            <ion-button fill="clear" size="small" @click="closeDatePicker">
              Cancel
            </ion-button>
          </div>

          <ion-datetime
            v-model="draftDateValue"
            presentation="date"
            prefer-wheel="false"
            class="date-picker-calendar"
            :min="datePickerMin"
            :max="datePickerMax"
          />

          <ion-button expand="block" class="date-picker-confirm" @click="applyDateSelection">
            Done
          </ion-button>
        </section>
      </ion-content>
    </ion-modal>

    <ion-modal
      :is-open="isEmployeeSearchOpen"
      css-class="employee-search-overlay"
      @didDismiss="closeEmployeeSearch"
    >
      <ion-content class="employee-search-modal" :scroll-y="true">
        <div class="employee-search-sticky">
          <div class="employee-search-header">
            <div>
              <p>Select</p>
              <h3>Employee</h3>
            </div>

            <ion-button fill="clear" size="small" @click="closeEmployeeSearch">
              Close
            </ion-button>
          </div>

          <ion-searchbar
            v-model="employeeSearchQuery"
            class="employee-searchbar"
            placeholder="Search employee..."
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
              <h3>{{ employee.name }}</h3>
              <p v-if="employee.department || employee.company">
                {{ employee.department || employee.company }}
              </p>
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
  </div>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonDatetime,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonTextarea,
} from "@ionic/vue";

import { attachOutline, calendarOutline } from "ionicons/icons";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

import { fetchEmployees, type EmployeeOption } from "@/utils/employees";
import { fetchLeaveTypes, type LeaveTypeOption } from "@/utils/leaveTypes";
import { saveLeaveRequest } from "@/utils/leaveRequests";

const props = withDefaults(
  defineProps<{
    navigateAfterSubmit?: boolean;
    showHeader?: boolean;
  }>(),
  {
    navigateAfterSubmit: true,
    showHeader: true,
  },
);

const emit = defineEmits<{
  submitted: [];
}>();

const router = useRouter();

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
const isDatePickerOpen = ref(false);
const activeDateField = ref<"start" | "end">("start");
const draftDateValue = ref("");

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
const localizedDatePlaceholder = computed(() => {
  try {
    const formatter = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(new Date(2001, 10, 22));

    return parts
      .map((part) => {
        if (part.type === "day") return "DD";
        if (part.type === "month") return "MM";
        if (part.type === "year") return "YYYY";
        return part.value;
      })
      .join("");
  } catch {
    return "YYYY-MM-DD";
  }
});

const selectedLeaveTypeName = computed(
  () =>
    leaveTypes.value.find((option) => option.id === leaveType.value)?.name ??
    "",
);
const datePickerMin = computed(() => {
  if (activeDateField.value === "end" && startDate.value) {
    return startDate.value;
  }

  return undefined;
});

const datePickerMax = computed(() => {
  if (activeDateField.value === "start" && endDate.value) {
    return endDate.value;
  }

  return undefined;
});

const leaveTypeSelectInterfaceOptions = {
  header: "Select Leave Type",
  subHeader: "Choose the leave type for this request.",
};

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

    if (
      leaveType.value != null &&
      !options.some((option) => option.id === leaveType.value)
    ) {
      leaveType.value = null;
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
    if (isLoadingMoreEmployees.value || !hasMoreEmployees.value) return;
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
    if (requestId !== employeeLoadRequestId) return;

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

const openDatePicker = (field: "start" | "end") => {
  activeDateField.value = field;
  const currentValue = field === "start" ? startDate.value : endDate.value;

  if (currentValue) {
    draftDateValue.value = currentValue;
  } else if (field === "end" && startDate.value) {
    draftDateValue.value = startDate.value;
  } else if (field === "start" && endDate.value) {
    draftDateValue.value = endDate.value;
  } else {
    draftDateValue.value = new Date().toISOString().slice(0, 10);
  }

  isDatePickerOpen.value = true;
};

const closeDatePicker = () => {
  isDatePickerOpen.value = false;
  draftDateValue.value = "";
};

const normalizeDateValue = (value: string) => value.slice(0, 10);

const applyDateSelection = () => {
  if (draftDateValue.value) {
    const normalizedDate = normalizeDateValue(draftDateValue.value);

    if (activeDateField.value === "start") {
      if (endDate.value && normalizedDate > endDate.value) {
        submitErrorMessage.value =
          "Start date must be the same as or before end date.";
        return;
      }

      startDate.value = normalizedDate;
    } else {
      if (startDate.value && normalizedDate < startDate.value) {
        submitErrorMessage.value =
          "End date must be the same as or after start date.";
        return;
      }

      endDate.value = normalizedDate;
    }
  }

  submitErrorMessage.value = "";
  closeDatePicker();
};

const resetForm = () => {
  leaveType.value = null;
  selectedEmployeeId.value = null;
  selectedEmployeeDetails.value = null;
  startDate.value = "";
  endDate.value = "";
  isHalfDay.value = false;
  reason.value = "";
  selectedFileName.value = "";
  isDatePickerOpen.value = false;
  draftDateValue.value = "";
  employeeSearchQuery.value = "";
  activeEmployeeQuery.value = "";
  submitErrorMessage.value = "";
  submitSuccessMessage.value = "";
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

    resetForm();
    submitSuccessMessage.value = "Leave request submitted successfully.";
    emit("submitted");

    if (props.navigateAfterSubmit) {
      await router.replace("/tabs/tab4");
    }
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
  gap: 12px;
}

.form-card {
  padding: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.form-header {
  margin-bottom: 12px;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}

h2 {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 850;
  color: #0f172a;
}

.subtitle {
  margin: 6px 0 0;
  font-size: 0.9rem;
  color: #64748b;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.field-block {
  display: grid;
  gap: 7px;
}

.field-block-full {
  grid-column: 1 / -1;
}

.field-label {
  font-size: 0.82rem;
  font-weight: 800;
  color: #334155;
}

.field {
  --background: #f7f9fc;
  --border-radius: 18px;
  --padding-start: 14px;
  --inner-padding-end: 14px;
  --min-height: 50px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
}

.field:focus-within {
  border-color: #2e66db;
  box-shadow: 0 0 0 3px rgba(46, 102, 219, 0.14);
}

.searchable-trigger {
  cursor: pointer;
}

.searchable-input {
  pointer-events: none;
}

.employee-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.employee-summary div {
  padding: 10px 12px;
  border-radius: 16px;
  background: #f1f5f9;
}

.employee-summary span {
  display: block;
  font-size: 0.68rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
}

.employee-summary strong {
  display: block;
  margin-top: 4px;
  font-size: 0.84rem;
  color: #0f172a;
}

.date-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.date-field {
  position: relative;
  --inner-padding-end: 10px;
}

.date-trigger {
  cursor: pointer;
}

.date-field-icon {
  flex-shrink: 0;
  font-size: 1.1rem;
  color: #64748b;
}

.date-display {
  flex: 1;
  min-width: 0;
  font-size: 1rem;
  color: #0f172a;
}

.date-display-placeholder {
  color: #94a3b8;
}

.leave-type-select {
  width: 100%;
  font-size: 0.92rem;
  font-weight: 650;
  color: #0f172a;
}

.leave-type-select::part(placeholder) {
  color: #7b8aa0;
  font-weight: 650;
}

.checkbox-field {
  --min-height: 48px;
}

.checkbox-field ion-checkbox {
  width: 100%;
  font-weight: 700;
  color: #334155;
}

.textarea-field {
  --padding-top: 6px;
  --padding-bottom: 6px;
}

.field-message,
.submit-message {
  margin: 0;
  font-size: 0.86rem;
}

.error-message {
  color: #b42318;
}

.success-message {
  color: #067647;
}

.upload-card {
  margin-top: 12px;
  border-radius: 18px;
  border: 1.5px dashed #cbd5e1;
  background: #f8fafc;
  overflow: hidden;
}

.upload-label {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 50px;
  padding: 0 14px;
  color: #475569;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
}

.upload-label ion-icon {
  font-size: 1.3rem;
  color: #2563eb;
}

.upload-input {
  display: none;
}

.submit-button {
  margin-top: 14px;
  min-height: 52px;
  font-weight: 850;
  --background: #2e66db;
  --border-radius: 18px;
  --box-shadow: 0 12px 24px rgba(46, 102, 219, 0.26);
}

.date-picker-modal {
  --background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
  --padding-top: 14px;
  --padding-start: 18px;
  --padding-end: 18px;
  --padding-bottom: calc(env(safe-area-inset-bottom) + 18px);
}

:global(.date-picker-modal .modal-wrapper),
:global(.date-picker-modal .modal-shadow) {
  border-radius: 28px 28px 0 0;
}

.date-picker-shell {
  display: grid;
  gap: 14px;
  max-width: 480px;
  margin: 0 auto;
}

.date-picker-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.date-picker-eyebrow {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b;
}

.date-picker-header h3 {
  margin: 6px 0 0;
  font-size: 1.45rem;
  font-weight: 850;
  color: #0f172a;
}

.date-picker-calendar {
  overflow: hidden;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12px 28px rgba(55, 75, 105, 0.08);
}

.date-picker-calendar::part(content) {
  height: auto;
}

@media (max-width: 480px) {
  .date-picker-modal {
    --padding-start: 12px;
    --padding-end: 12px;
  }

  .date-picker-shell {
    max-width: none;
  }
}

.date-picker-confirm {
  min-height: 50px;
  font-weight: 850;
  --background: #2e66db;
  --border-radius: 18px;
}

.employee-search-modal {
  --background: #f8fbff;
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

.employee-search-sticky {
  position: sticky;
  top: 0;
  z-index: 10;
  padding-bottom: 12px;
  background: #f8fbff;
}

.employee-search-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.employee-search-header p {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b;
}

.employee-search-header h3 {
  margin: 6px 0 0;
  font-size: 1.45rem;
  font-weight: 850;
  color: #0f172a;
}

.employee-searchbar {
  padding: 12px 0 0;
}

.employee-searchbar::part(container) {
  min-height: 52px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.employee-results {
  margin-top: 10px;
  background: transparent;
  padding-bottom: 28px;
}

.employee-option {
  --border-radius: 18px;
  --background: #ffffff;
  margin-bottom: 10px;
  box-shadow: 0 8px 20px rgba(55, 75, 105, 0.06);
}

.employee-option h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: #1e293b;
}

.employee-option p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.88rem;
}

.employee-empty-state {
  padding: 24px 6px 8px;
  text-align: center;
  color: #6c7b8d;
}

@media (max-width: 380px) {
  .employee-summary,
  .date-grid {
    grid-template-columns: 1fr;
  }
}
</style>
