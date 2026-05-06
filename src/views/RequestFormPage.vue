<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Create My Leave Request</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="request-page">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Create My Leave Request</ion-title>
        </ion-toolbar>
      </ion-header>

      <RequestForm />
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/vue";
import RequestForm from "@/components/RequestForm.vue";
</script>

<style scoped>
.request-page {
  --background: var(--app-bg);
  --padding-top: calc(env(safe-area-inset-top) + 24px);
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-bottom: calc(env(safe-area-inset-bottom) + 104px);
}

.request-page::part(scroll) {
  padding-top: calc(env(safe-area-inset-top) + 24px);
  padding-bottom: calc(env(safe-area-inset-bottom) + 104px);
  box-sizing: border-box;
}

@media (max-width: 640px) {
  .request-page {
    --padding-top: calc(env(safe-area-inset-top) + 28px);
    --padding-start: 14px;
    --padding-end: 14px;
    --padding-bottom: calc(env(safe-area-inset-bottom) + 120px);
  }

  .request-page::part(scroll) {
    padding-top: calc(env(safe-area-inset-top) + 28px);
    padding-bottom: calc(env(safe-area-inset-bottom) + 120px);
  }
}
</style>
