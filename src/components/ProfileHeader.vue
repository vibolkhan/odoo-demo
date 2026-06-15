<template>
  <ion-card class="profile-header"><ion-card-content>
    <div class="avatar">{{ initials }}</div><div><h2>{{ name }}</h2><p>{{ subtitle }}</p><status-badge :status="status" /></div>
  </ion-card-content></ion-card>
</template>
<script setup lang="ts">
import { IonCard, IonCardContent } from "@ionic/vue";
import { computed } from "vue";
import StatusBadge from "@/components/StatusBadge.vue";
const props = defineProps<{ name: string; status: string; subtitle: string }>();
const initials = computed(() => props.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase());
</script>
<style scoped>
.profile-header ion-card-content { display: flex; align-items: center; gap: 16px; }
.avatar { display: grid; place-items: center; width: 58px; height: 58px; border-radius: 18px; background: var(--ion-color-primary); color: white; font-weight: 800; font-size: 1.2rem; }
h2, p { margin: 0 0 5px; } p { color: var(--ion-color-medium); }
</style>
