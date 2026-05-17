<template>
  <div class="filter-panel">
    <div class="filter-item full">
      <label>Employee</label>
      <ion-searchbar
        :model-value="employeeSearch"
        placeholder="Search employee..."
        class="custom-searchbar"
        @ionInput="$emit('employee-search', $event)"
        @ionFocus="$emit('employee-focus')"
        @ionBlur="$emit('employee-blur')"
      />
      <div
        v-if="employeeOptions.length > 0 && (employeeSearch || showAllEmployees)"
        class="employee-suggestions"
        @scroll="$emit('employee-scroll', $event)"
      >
        <div
          v-for="employee in employeeOptions"
          :key="employee.id"
          class="suggestion-item"
          @click="$emit('select-employee', employee)"
        >
          {{ employee.name }}
        </div>
        <div v-if="loadingEmployees" class="suggestion-loading">
          <ion-spinner name="dots" />
        </div>
      </div>
      <div
        v-if="selectedEmployees.length > 0"
        class="selected-tags-container"
      >
        <div
          v-for="employee in selectedEmployees"
          :key="employee.id"
          class="selected-tag"
        >
          <span>{{ employee.name }}</span>
          <ion-icon
            :icon="closeCircle"
            @click="$emit('remove-employee', employee.id)"
          />
        </div>
      </div>
    </div>

    <div class="date-grid">
      <DateInput
        :model-value="dateFrom"
        placeholder="From"
        @update:modelValue="$emit('update:dateFrom', $event)"
      />
      <DateInput
        :model-value="dateTo"
        placeholder="To"
        @update:modelValue="$emit('update:dateTo', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { IonIcon, IonSearchbar, IonSpinner } from "@ionic/vue";
import { closeCircle } from "ionicons/icons";
import DateInput from "@/components/common/DateInput.vue";

defineProps({
  dateFrom: {
    type: String,
    default: "",
  },
  dateTo: {
    type: String,
    default: "",
  },
  employeeSearch: {
    type: String,
    default: "",
  },
  employeeOptions: {
    type: Array,
    default: () => [],
  },
  selectedEmployees: {
    type: Array,
    default: () => [],
  },
  loadingEmployees: Boolean,
  showAllEmployees: Boolean,
});

defineEmits([
  "update:dateFrom",
  "update:dateTo",
  "employee-search",
  "employee-focus",
  "employee-blur",
  "employee-scroll",
  "select-employee",
  "remove-employee",
]);
</script>

<style scoped>
.filter-panel {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
}

.filter-item.full {
  flex: 1 1 100%;
}

.date-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 380px) {
  .date-grid {
    grid-template-columns: 1fr;
  }
}

.filter-item label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-left: 4px;
}

.custom-searchbar {
  --background: var(--app-bg);
  --border-radius: 12px;
  padding: 0;
  height: 44px;
}

.employee-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  z-index: 100;
  margin-top: 4px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 12px 16px;
  font-size: 0.9rem;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:active {
  background: var(--border-color);
}

.suggestion-loading {
  display: flex;
  justify-content: center;
  padding: 12px;
}

.selected-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.selected-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  padding: 6px 12px;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 700;
}
</style>
