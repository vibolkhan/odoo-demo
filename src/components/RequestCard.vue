<template>
  <ion-item><ion-label><h2>{{ title }}</h2><p>{{ subtitle }}</p></ion-label><status-badge slot="end" :status="status" /></ion-item>
</template>
<script setup lang="ts">
import { IonItem, IonLabel } from "@ionic/vue";
import StatusBadge from "@/components/StatusBadge.vue";
defineProps<{ status: string; subtitle: string; title: string }>();
</script>
