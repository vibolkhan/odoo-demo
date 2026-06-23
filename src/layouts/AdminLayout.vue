<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="admin-dashboard" href="/admin/tabs/dashboard">
          <ion-icon aria-hidden="true" :icon="gridOutline" />
          <ion-label>Dashboard</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="admin-scan" href="/admin/tabs/scan">
          <ion-icon aria-hidden="true" :icon="scanOutline" />
          <ion-label>Scan</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="admin-employees" href="/admin/tabs/employees">
          <ion-icon aria-hidden="true" :icon="peopleOutline" />
          <ion-label>Employees</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="admin-attendance" href="/admin/tabs/attendance">
          <ion-icon aria-hidden="true" :icon="calendarOutline" />
          <ion-label>Attendance</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="admin-requests" href="/admin/tabs/requests">
          <ion-icon aria-hidden="true" :icon="documentsOutline" />
          <ion-label>Requests</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="admin-settings" href="/admin/tabs/settings">
          <ion-icon aria-hidden="true" :icon="settingsOutline" />
          <ion-label>Settings</ion-label>
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
import { calendarOutline, documentsOutline, gridOutline, peopleOutline, scanOutline, settingsOutline } from "ionicons/icons";
</script>

<style scoped>
@media (max-width: 430px) {
  ion-tab-bar {
    box-shadow: inset -18px 0 18px -18px rgba(34, 36, 40, 0.7);
    justify-content: flex-start;
    overflow-x: auto;
    padding-inline-end: 14px;
    scrollbar-width: thin;
  }

  ion-tab-button {
    flex: 0 0 78px;
    max-width: 78px;
    min-width: 78px;
  }

  ion-label {
    font-size: 11px;
    white-space: normal;
  }
}
</style>
