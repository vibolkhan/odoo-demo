<template><ion-badge :color="color">{{ label }}</ion-badge></template>
<script setup lang="ts">
import { IonBadge } from "@ionic/vue";
import { computed } from "vue";
const props = defineProps<{ status?: string | null }>();
const label = computed(() => props.status || "unknown");
const color = computed(() => ({
  approved: "success", present: "success", active: "success", pending: "warning",
  late: "warning", rejected: "danger", absent: "danger", inactive: "medium",
}[label.value.toLowerCase()] || "primary"));
</script>
