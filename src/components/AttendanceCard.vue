<template>
  <ion-card class="attendance-card">
    <ion-card-content class="attendance-row">
      <div>
        <strong>{{ formatDisplayDate(record.attendance_date) }}</strong>
        <p>{{ formatTime(record.check_in) }} - {{ formatTime(record.check_out) }}</p>
      </div>
      <div class="right">
        <status-badge :status="record.status" />
        <p>Worked: {{ formatDurationFromHours(record.worked_hours) }}</p>
        <p>Late: {{ formatDurationFromMinutes(record.late_minutes) }}</p>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { IonCard, IonCardContent } from "@ionic/vue";
import StatusBadge from "@/components/StatusBadge.vue";
import type { Tables } from "@/types/database.types";
import { formatDisplayDate, formatDurationFromHours, formatDurationFromMinutes } from "@/utils/format";

defineProps<{ record: Tables<"attendance_records"> }>();

function formatTime(value: string | null) {
  return value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--";
}
</script>

<style scoped>
.attendance-card {
  margin: 0;
}

.attendance-row {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 12px 14px;
}

p {
  color: var(--ion-color-medium);
  font-size: 0.82rem;
  margin: 5px 0 0;
}

.right {
  text-align: right;
}
</style>
