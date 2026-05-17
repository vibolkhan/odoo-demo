<template>
  <div class="record-card" @click="$emit('open', request)">
    <div class="card-header">
      <div class="type-info">
        <h3>{{ getLeaveTypeEnglishName(request.leaveType) }}</h3>
        <span class="employee-name">{{ request.employeeName }}</span>
      </div>
      <span class="status-badge" :class="getLeaveStatusClass(request.state)">
        {{ formatLeaveStateLabel(request.state) }}
      </span>
    </div>

    <div class="card-body">
      <div class="date-row">
        <ion-icon :icon="calendarOutline" />
        <span>{{ formatDateRange(request.dateFrom, request.dateTo) }}</span>
      </div>

      <div class="duration-tag">
        {{ request.durationDisplay }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { IonIcon } from "@ionic/vue";
import { calendarOutline } from "ionicons/icons";
import {
  formatLeaveStateLabel,
  getLeaveStatusClass,
  getLeaveTypeEnglishName,
} from "@/utils/leave";

defineProps({
  request: {
    type: Object,
    required: true,
  },
  formatDateRange: {
    type: Function,
    required: true,
  },
});

defineEmits(["open"]);
</script>

<style scoped>
.record-card {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.record-card:active {
  transform: scale(0.98);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.type-info h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
}

.employee-name {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
}

.status-pending {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.status-review {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.status-approved {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.status-refused {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.date-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.date-row ion-icon {
  color: #3b82f6;
}

.duration-tag {
  background: var(--app-bg);
  color: var(--text-secondary);
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  width: fit-content;
}
</style>
