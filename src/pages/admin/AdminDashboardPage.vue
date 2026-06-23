<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>HR Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ion-refresh="refresh">
        <ion-refresher-content pulling-text="Pull to refresh dashboard" refreshing-text="Refreshing dashboard..." />
      </ion-refresher>

      <div class="app-page app-stack">
        <app-loading-card v-if="loading" />
        <ion-grid v-else>
          <ion-row>
            <ion-col v-for="metric in metrics" :key="metric.label" size="6" size-md="4">
              <metric-card v-bind="metric" />
            </ion-col>
          </ion-row>
        </ion-grid>
      </div>

      <ion-toast v-model:is-open="toastOpen" :message="toastMessage" :color="toastColor" :duration="3500" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonTitle,
  IonToast,
  IonToolbar,
} from "@ionic/vue";
import { alertCircleOutline, calendarOutline, checkmarkCircleOutline, peopleOutline, timeOutline } from "ionicons/icons";
import { computed, onMounted, ref } from "vue";
import AppLoadingCard from "@/components/AppLoadingCard.vue";
import MetricCard from "@/components/MetricCard.vue";
import { getTodayDashboardSummary } from "@/services/adminService";
import { useToast } from "@/composables/useToast";

const loading = ref(false);
const summary = ref<Record<string, number>>({});
const { showError, toastColor, toastMessage, toastOpen } = useToast();

const metrics = computed(() => [
  { label: "Total employees", value: summary.value.totalEmployees || 0, icon: peopleOutline, color: "primary" },
  { label: "Present today", value: summary.value.presentToday || 0, icon: checkmarkCircleOutline, color: "success" },
  { label: "Late today", value: summary.value.lateToday || 0, icon: timeOutline, color: "warning" },
  { label: "Absent today", value: summary.value.absentToday || 0, icon: alertCircleOutline, color: "danger" },
  { label: "Missing checkout", value: summary.value.missingCheckout || 0, icon: alertCircleOutline, color: "warning" },
  { label: "Pending leave", value: summary.value.pendingLeave || 0, icon: calendarOutline, color: "tertiary" },
  { label: "Pending overtime", value: summary.value.pendingOT || 0, icon: timeOutline, color: "tertiary" },
  { label: "Pending correction", value: summary.value.pendingCorrections || 0, icon: alertCircleOutline, color: "tertiary" },
]);

async function load() {
  loading.value = true;
  try {
    summary.value = await getTodayDashboardSummary();
  } catch (error) {
    showError(error);
  } finally {
    loading.value = false;
  }
}

async function refresh(event: CustomEvent) {
  try {
    await load();
  } finally {
    (event.target as HTMLIonRefresherElement).complete();
  }
}

onMounted(load);
</script>
