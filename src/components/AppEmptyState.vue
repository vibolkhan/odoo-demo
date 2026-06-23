<template>
  <div class="empty-state">
    <ion-icon :icon="icon || fileTrayOutline" />
    <h3>{{ title }}</h3>
    <p>{{ message }}</p>
  </div>
</template>
<script setup lang="ts">
import { IonIcon } from "@ionic/vue";
import { fileTrayOutline } from "ionicons/icons";
defineProps<{ icon?: string; message: string; title: string }>();
</script>
<style scoped>
.empty-state { padding: 44px 20px; text-align: center; color: var(--ion-color-medium); }
.empty-state ion-icon { font-size: 44px; color: var(--ion-color-primary); }
.empty-state h3 { margin: 12px 0 4px; color: var(--ion-text-color); }
.empty-state p { margin: 0; }
</style>
