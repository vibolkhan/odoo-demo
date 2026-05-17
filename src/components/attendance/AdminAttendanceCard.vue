<template>
  <div class="record-card" @click="$emit('open', record.id)">
    <div class="card-header">
      <div class="header-left">
        <AppAvatar :name="employeeName" :size="32" variant="slate" />
        <h3>{{ employeeName }}</h3>
      </div>
      <span
        class="status-badge"
        :class="record.check_out ? 'checked-out' : 'checked-in'"
      >
        {{ record.check_out ? "Completed" : "Working" }}
      </span>
    </div>

    <div class="card-body">
      <div class="time-row">
        <div class="time-col">
          <span class="label">Check In</span>
          <span class="value">{{ formatDateTime(record.check_in) }}</span>
        </div>
        <div v-if="record.check_out" class="time-col">
          <span class="label">Check Out</span>
          <span class="value">{{ formatDateTime(record.check_out) }}</span>
        </div>
      </div>

      <div v-if="record.worked_hours" class="stats-row">
        <span class="worked-hours">
          <ion-icon :icon="timeOutline" />
          {{ formatHours(record.worked_hours) }} hrs
        </span>
        <span v-if="record.overtime_hours > 0" class="overtime">
          +{{ formatHours(record.overtime_hours) }} OT
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { IonIcon } from "@ionic/vue";
import { timeOutline } from "ionicons/icons";
import AppAvatar from "@/components/common/AppAvatar.vue";
import {
  formatDisplayDateTime as formatDateTime,
  formatHours,
} from "@/utils/date";

defineProps({
  record: {
    type: Object,
    required: true,
  },
  employeeName: {
    type: String,
    required: true,
  },
});

defineEmits(["open"]);
</script>

<style scoped>
.record-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.record-card:active {
  transform: scale(0.98);
  background: var(--app-bg);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.status-badge {
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.status-badge.checked-in {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.status-badge.checked-out {
  background: var(--border-color);
  color: var(--text-secondary);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.time-row {
  display: flex;
  gap: 24px;
}

.time-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.time-col .label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
}

.time-col .value {
  font-size: 0.95rem;
  color: var(--text-primary);
  font-weight: 500;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-color);
}

.worked-hours {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  padding: 4px 10px;
  border-radius: 8px;
}

.overtime {
  font-size: 0.85rem;
  font-weight: 600;
  color: #d97706;
  background: rgba(245, 158, 11, 0.1);
  padding: 4px 10px;
  border-radius: 8px;
}
</style>
