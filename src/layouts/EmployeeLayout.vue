<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="employee-home" href="/employee/tabs/home">
          <ion-icon aria-hidden="true" :icon="home" />
          <ion-label>Home</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="employee-scan" href="/employee/tabs/scan">
          <ion-icon aria-hidden="true" :icon="scan" />
          <ion-label>Scan</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="employee-attendance" href="/employee/tabs/attendance">
          <ion-icon aria-hidden="true" :icon="calendar" />
          <ion-label>Attendance</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="employee-requests" href="/employee/tabs/requests">
          <ion-icon aria-hidden="true" :icon="documents" />
          <ion-label>Requests</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="employee-profile" href="/employee/tabs/profile">
          <ion-icon aria-hidden="true" :icon="person" />
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
import { calendar, documents, home, person, scan } from "ionicons/icons";
</script>
