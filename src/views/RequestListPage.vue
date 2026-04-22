<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Leave Management</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="request-list-page">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Leave Management</ion-title>
        </ion-toolbar>
      </ion-header>

      <RequestLst ref="requestListRef" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
} from "@ionic/vue";
import { ref } from "vue";
import RequestLst from "@/components/RequestLst.vue";

type RequestListInstance = InstanceType<typeof RequestLst>;

const requestListRef = ref<RequestListInstance | null>(null);

const handleRefresh = async (event: CustomEvent) => {
  try {
    await requestListRef.value?.loadLeaveRequests();
  } finally {
    (event.target as HTMLIonRefresherElement | null)?.complete();
  }
};
</script>

<style scoped>
.request-list-page {
  --background: #f4f7fb;
  --padding-top: 26px;
  --padding-start: 18px;
  --padding-end: 18px;
  --padding-bottom: 28px;
}

@media (max-width: 640px) {
  .request-list-page {
    --padding-top: 42px;
  }
}
</style>
