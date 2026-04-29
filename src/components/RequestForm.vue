<template>
  <div class="request-shell">
    <section class="form-card">
      <div class="form-grid">
        <!-- Leave Type Selection -->
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

        <!-- Date Selection -->
        <div class="date-grid field-block-full">
          <DateInput
            v-model="startDate"
            label="Start Date"
            :placeholder="localizedDatePlaceholder"
            :max="endDate || undefined"
          />

          <DateInput
            v-model="endDate"
            label="End Date"
            :placeholder="localizedDatePlaceholder"
            :min="startDate || undefined"
            :disabled="isHalfDay"
          />
        </div>

        <div class="field-block field-block-full">
          <ion-item lines="none" class="field checkbox-field">
            <ion-checkbox v-model="isHalfDay" label-placement="end">
              Half day request
            </ion-checkbox>
          </ion-item>
        </div>

        <!-- Reason -->
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

  </div>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonCheckbox,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonTextarea,
} from "@ionic/vue";
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import DateInput from "./DateInput.vue";

import {
  fetchCurrentUserEmployee,
  type EmployeeOption,
} from "@/utils/employees";
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

// Form State
const leaveType = ref<number | null>(null);
const leaveTypes = ref<LeaveTypeOption[]>([]);
const selectedEmployeeId = ref<number | null>(null);
const selectedEmployeeDetails = ref<EmployeeOption | null>(null);
const startDate = ref("");
const endDate = ref("");
const isHalfDay = ref(false);
const reason = ref("");

// UI State
const isLoadingLeaveTypes = ref(false);
const leaveTypeErrorMessage = ref("");
const submitErrorMessage = ref("");
const submitSuccessMessage = ref("");
const isSubmittingRequest = ref(false);

// Computed
const localizedDatePlaceholder = computed(() => {
  return "YYYY-MM-DD";
});

watch(isHalfDay, (val) => {
  if (val && startDate.value) {
    endDate.value = startDate.value;
  }
});

watch(startDate, (val) => {
  if (isHalfDay.value && val) {
    endDate.value = val;
  }
});

const selectedLeaveTypeName = computed(
  () =>
    leaveTypes.value.find((option) => option.id === leaveType.value)?.name ??
    "",
);

const leaveTypeSelectInterfaceOptions = {
  header: "Select Leave Type",
  subHeader: "Choose the leave type for this request.",
};

// Actions
const loadLeaveTypes = async () => {
  if (!selectedEmployeeId.value) return;

  isLoadingLeaveTypes.value = true;
  leaveTypeErrorMessage.value = "";

  try {
    const options = await fetchLeaveTypes({
      employeeId: selectedEmployeeId.value,
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

const loadCurrentUserEmployee = async () => {
  try {
    const employee = await fetchCurrentUserEmployee();
    if (employee) {
      selectedEmployeeId.value = employee.id;
      selectedEmployeeDetails.value = employee;
    }
  } catch (error) {
    console.error("Failed to load current user employee:", error);
  }
};

const resetForm = () => {
  leaveType.value = null;
  startDate.value = "";
  endDate.value = "";
  isHalfDay.value = false;
  reason.value = "";
  submitErrorMessage.value = "";
  submitSuccessMessage.value = "";
};

const handleSubmitRequest = async () => {
  submitErrorMessage.value = "";
  submitSuccessMessage.value = "";

  if (!selectedEmployeeId.value) {
    submitErrorMessage.value =
      "Unable to identify your employee record. Please try logging in again.";
    return;
  }

  if (!leaveType.value) {
    submitErrorMessage.value = "Please select a leave type.";
    return;
  }

  if (isHalfDay.value && startDate.value !== endDate.value) {
    submitErrorMessage.value =
      "Half-day requests must have the same start and end date.";
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

onMounted(async () => {
  await loadCurrentUserEmployee();
  void loadLeaveTypes();
});

watch([selectedEmployeeId, startDate, endDate], () => {
  void loadLeaveTypes();
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

.date-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
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

.submit-button {
  margin-top: 14px;
  min-height: 52px;
  font-weight: 850;
  --background: #2e66db;
  --border-radius: 18px;
  --box-shadow: 0 12px 24px rgba(46, 102, 219, 0.26);
}

@media (max-width: 380px) {
  .date-grid {
    grid-template-columns: 1fr;
  }
}
</style>
