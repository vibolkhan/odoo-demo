<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="employee-home" href="/employee/tabs/home">
          <ion-icon aria-hidden="true" :icon="homeOutline" />
          <ion-label>Home</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="employee-scan" href="/employee/tabs/scan">
          <ion-icon aria-hidden="true" :icon="scanOutline" />
          <ion-label>Scan</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="employee-attendance" href="/employee/tabs/attendance">
          <ion-icon aria-hidden="true" :icon="calendarOutline" />
          <ion-label>Attendance</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="employee-requests" href="/employee/tabs/requests">
          <ion-icon aria-hidden="true" :icon="documentsOutline" />
          <ion-label>Requests</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="employee-profile" href="/employee/tabs/profile">
          <ion-icon aria-hidden="true" :icon="personOutline" />
          <ion-label>Profile</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup>
import {
  IonIcon,
  IonLabel,
  IonPage,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from "@ionic/vue";
import { calendarOutline, documentsOutline, homeOutline, personOutline, scanOutline } from "ionicons/icons";
</script>


<style scoped>
@media (max-width: 430px) {
  ion-tab-bar {
    justify-content: flex-start;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  ion-tab-button {
    flex: 0 0 75px;
    max-width: 75px;
    min-width: 75px;
  }

  ion-label {
    font-size: 11px;
    white-space: normal;
  }
}
</style>
