<template>
  <ion-page><ion-header><ion-toolbar><ion-title>HR Dashboard</ion-title><ion-button slot="end" fill="clear" @click="load"><ion-icon :icon="refresh" /></ion-button></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <app-loading-card v-if="loading" /><ion-grid v-else><ion-row><ion-col v-for="metric in metrics" :key="metric.label" size="6"><metric-card v-bind="metric" /></ion-col></ion-row></ion-grid>
      <ion-toast v-model:is-open="toastOpen" :message="toastMessage" :color="toastColor" :duration="3500" />
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { IonButton, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonPage, IonRow, IonTitle, IonToast, IonToolbar } from "@ionic/vue";
import { alertCircleOutline, calendarOutline, checkmarkCircleOutline, peopleOutline, refresh, timeOutline } from "ionicons/icons";
import { computed, onMounted, ref } from "vue"; import AppLoadingCard from "@/components/AppLoadingCard.vue"; import MetricCard from "@/components/MetricCard.vue"; import { getTodayDashboardSummary } from "@/services/adminService"; import { useToast } from "@/composables/useToast";
const loading = ref(false); const summary = ref<Record<string, number>>({}); const { showError, toastColor, toastMessage, toastOpen } = useToast();
const metrics = computed(() => [
  { label: "Total employees", value: summary.value.totalEmployees || 0, icon: peopleOutline, color: "primary" }, { label: "Present today", value: summary.value.presentToday || 0, icon: checkmarkCircleOutline, color: "success" },
  { label: "Late today", value: summary.value.lateToday || 0, icon: timeOutline, color: "warning" }, { label: "Absent today", value: summary.value.absentToday || 0, icon: alertCircleOutline, color: "danger" },
  { label: "Missing checkout", value: summary.value.missingCheckout || 0, icon: alertCircleOutline, color: "warning" }, { label: "Pending leave", value: summary.value.pendingLeave || 0, icon: calendarOutline, color: "tertiary" },
  { label: "Pending overtime", value: summary.value.pendingOT || 0, icon: timeOutline, color: "tertiary" }, { label: "Pending correction", value: summary.value.pendingCorrections || 0, icon: alertCircleOutline, color: "tertiary" },
]);
async function load() { loading.value = true; try { summary.value = await getTodayDashboardSummary(); } catch (e) { showError(e); } finally { loading.value = false; } } onMounted(load);
</script>
