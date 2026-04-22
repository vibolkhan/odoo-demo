<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Leave Management</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="request-page">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Leave Management</ion-title>
        </ion-toolbar>
      </ion-header>

      <RequestForm />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent } from "@ionic/vue";
import RequestForm from "@/components/RequestForm.vue";
</script>

<style scoped>
.request-page {
  --background: linear-gradient(180deg, #f5f8fc 0%, #edf3fa 100%);
  --padding-top: 34px;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-bottom: 36px;
}

@media (max-width: 640px) {
  .request-page {
    --padding-top: 44px;
    --padding-bottom: 32px;
  }
}
</style>
