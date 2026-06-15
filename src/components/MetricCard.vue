<template>
  <ion-card class="metric-card"><ion-card-content>
    <ion-icon :icon="icon" :color="color" /><strong>{{ value }}</strong><span>{{ label }}</span>
  </ion-card-content></ion-card>
</template>
<script setup lang="ts">
import { IonCard, IonCardContent, IonIcon } from "@ionic/vue";
defineProps<{ color?: string; icon: string; label: string; value: number | string }>();
</script>
<style scoped>
.metric-card { margin: 6px; height: 100%; }
.metric-card ion-card-content { display: grid; gap: 5px; }
.metric-card ion-icon { font-size: 24px; }
.metric-card strong { font-size: 1.6rem; }
.metric-card span { color: var(--ion-color-medium); font-size: .8rem; }
</style>
