<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="admin-dashboard" href="/admin/tabs/dashboard">
          <ion-icon aria-hidden="true" :icon="grid" />
          <ion-label>Dashboard</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="admin-scan" href="/admin/tabs/scan">
          <ion-icon aria-hidden="true" :icon="scan" />
          <ion-label>Scan</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="admin-employees" href="/admin/tabs/employees">
          <ion-icon aria-hidden="true" :icon="people" />
          <ion-label>Employees</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="admin-attendance" href="/admin/tabs/attendance">
          <ion-icon aria-hidden="true" :icon="calendar" />
          <ion-label>Attendance</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="admin-requests" href="/admin/tabs/requests">
          <ion-icon aria-hidden="true" :icon="documents" />
          <ion-label>Requests</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="admin-settings" href="/admin/tabs/settings">
          <ion-icon aria-hidden="true" :icon="settings" />
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
import { calendar, documents, grid, people, scan, settings } from "ionicons/icons";
</script>
