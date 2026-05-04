<template>
  <div class="date-input-container">
    <label v-if="label" class="field-label">{{ label }}</label>

    <ion-item
      lines="none"
      class="field date-field"
      :class="{ 'field-disabled': disabled, 'has-value': !!modelValue }"
      button
      :detail="false"
      @click="!disabled && openPicker()"
    >
      <div
        class="date-display"
        :class="{ 'date-display-placeholder': !modelValue }"
      >
        {{ displayValue || placeholder || "Select date" }}
      </div>
      <ion-icon
        slot="end"
        :icon="calendarOutline"
        aria-hidden="true"
        class="date-field-icon"
      />
    </ion-item>

    <ion-modal
      :is-open="isOpen"
      :breakpoints="[0, 0.72, 0.9]"
      :initial-breakpoint="0.72"
      :backdrop-breakpoint="0"
      handle="true"
      @didDismiss="closePicker"
    >
      <ion-content class="date-picker-modal">
        <section class="date-picker-shell">
          <div class="date-picker-header">
            <div>
              <p class="date-picker-eyebrow">Select</p>
              <h3>{{ label || "Date" }}</h3>
            </div>

            <ion-button
              fill="clear"
              class="detail-close-button"
              aria-label="Close date picker"
              @click="closePicker"
            >
              <ion-icon
                :icon="close"
                size="large"
                aria-hidden="true"
                class="close-icon"
              />
            </ion-button>
          </div>

          <ion-datetime
            v-model="draftValue"
            presentation="date"
            prefer-wheel="false"
            class="date-picker-calendar"
            :min="min"
            :max="max"
          />

          <div class="date-picker-actions">
            <ion-button
              fill="outline"
              class="date-picker-clear"
              @click="handleClear"
            >
              Clear
            </ion-button>
            <ion-button class="date-picker-confirm" @click="handleConfirm">
              Done
            </ion-button>
          </div>
        </section>
      </ion-content>
    </ion-modal>
  </div>
</template>

<script setup>
import {
  IonButton,
  IonContent,
  IonDatetime,
  IonIcon,
  IonItem,
  IonModal,
} from "@ionic/vue";
import { calendarOutline, close } from "ionicons/icons";
import { ref, computed } from "vue";

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "",
  },
  min: {
    type: String,
    default: "",
  },
  max: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const isOpen = ref(false);
const draftValue = ref("");

const displayValue = computed(() => {
  if (!props.modelValue) return "";
  const date = new Date(props.modelValue);
  if (isNaN(date.getTime())) return props.modelValue;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
});

const openPicker = () => {
  draftValue.value = props.modelValue || new Date().toISOString().slice(0, 10);
  isOpen.value = true;
};

const closePicker = () => {
  isOpen.value = false;
};

const handleConfirm = () => {
  if (draftValue.value) {
    emit("update:modelValue", draftValue.value.slice(0, 10));
  }
  closePicker();
};

const handleClear = () => {
  emit("update:modelValue", "");
  closePicker();
};
</script>

<style scoped>
.date-input-container {
  display: grid;
  gap: 7px;
}

.field-label {
  font-size: 0.82rem;
  font-weight: 800;
  color: #334155;
}

.field {
  --background: #f7f9fc;
  --border-radius: 18px;
  --padding-start: 10px;
  --inner-padding-end: 10px;
  --min-height: 44px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  transition: all 0.2s ease;
}

.field-disabled {
  opacity: 0.6;
  --background: #f8fafc;
  pointer-events: none;
}

.field:focus-within {
  border-color: #2e66db;
  box-shadow: 0 0 0 3px rgba(46, 102, 219, 0.14);
}

.date-field-icon {
  flex-shrink: 0;
  font-size: 1.1rem;
  color: #64748b;
}

.date-display {
  flex: 1;
  min-width: 0;
  font-size: 0.9rem;
  color: #0f172a;
}

.date-display-placeholder {
  color: #94a3b8;
}

/* Date Picker Modal Styles */
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

.date-picker-actions {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 12px;
}

.date-picker-confirm,
.date-picker-clear {
  margin: 0;
  min-height: 52px;
  font-weight: 850;
  --border-radius: 18px;
}

.date-picker-confirm {
  --background: #2e66db;
  --color: white;
}

.date-picker-clear {
  --color: #64748b;
  --border-color: #e2e8f0;
}

.detail-close-button {
  width: 48px;
  height: 48px;
  margin: 0;
  --color: #1d4ed8;
  --border-radius: 16px;
  --background: rgba(255, 255, 255, 0.95);
  --box-shadow: 0 10px 25px rgba(55, 75, 105, 0.12);
}

.detail-close-button ion-icon {
  font-size: 1.6rem;
}

.close-icon {
  font-size: 1.6rem;
}

@media (max-width: 480px) {
  .date-picker-modal {
    --padding-start: 12px;
    --padding-end: 12px;
  }
}
</style>
