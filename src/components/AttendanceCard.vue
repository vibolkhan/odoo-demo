<template>
  <ion-card><ion-card-content class="attendance-row">
    <div><strong>{{ record.attendance_date }}</strong><p>{{ formatTime(record.check_in) }} - {{ formatTime(record.check_out) }}</p></div>
    <div class="right"><status-badge :status="record.status" /><p>{{ record.worked_hours }}h · {{ record.late_minutes }}m late</p></div>
  </ion-card-content></ion-card>
</template>
<script setup lang="ts">
import { IonCard, IonCardContent } from "@ionic/vue";
import StatusBadge from "@/components/StatusBadge.vue";
import type { Tables } from "@/types/database.types";
defineProps<{ record: Tables<"attendance_records"> }>();
function formatTime(value: string | null) { return value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"; }
</script>
<style scoped>
.attendance-row { display: flex; justify-content: space-between; gap: 12px; }
p { margin: 5px 0 0; color: var(--ion-color-medium); font-size: .82rem; }
.right { text-align: right; }
</style>
