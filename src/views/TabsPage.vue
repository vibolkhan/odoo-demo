<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <!-- <ion-tab-button tab="tab1" href="/tabs/tab1">
          <ion-icon
            aria-hidden="true"
            :icon="tabIcon('/tabs/tab1', list, listOutline)"
          />
          <ion-label>Types</ion-label>
        </ion-tab-button> -->

        <ion-tab-button tab="leave-calendar" href="/tabs/leave-calendar">
          <ion-icon
            aria-hidden="true"
            :icon="tabIcon('/tabs/leave-calendar', calendar, calendarOutline)"
          />
          <ion-label>Calendar</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="my-attendance" href="/tabs/my-attendance">
          <ion-icon
            aria-hidden="true"
            :icon="tabIcon('/tabs/my-attendance', time, timeOutline)"
          />
          <ion-label>Attendance</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab4" href="/tabs/tab4">
          <ion-icon
            aria-hidden="true"
            :icon="tabIcon('/tabs/tab4', receipt, receiptOutline)"
          />
          <ion-label>My Request</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="leave-balance" href="/tabs/leave-balance">
          <ion-icon
            aria-hidden="true"
            :icon="tabIcon('/tabs/leave-balance', wallet, walletOutline)"
          />
          <ion-label>Balance</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab3" href="/tabs/tab3">
          <ion-icon
            aria-hidden="true"
            :icon="tabIcon('/tabs/tab3', person, personOutline)"
          />
          <ion-label>Profile</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup>
import {
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonLabel,
  IonIcon,
  IonPage,
  IonRouterOutlet,
} from "@ionic/vue";
import {
  receipt,
  receiptOutline,
  list,
  listOutline,
  person,
  personOutline,
  wallet,
  walletOutline,
  calendar,
  calendarOutline,
  time,
  timeOutline,
} from "ionicons/icons";
import { useRoute } from "vue-router";

const route = useRoute();

const tabIcon = (path, activeIcon, inactiveIcon) =>
  route.path === path || route.path.startsWith(`${path}/`)
    ? activeIcon
    : inactiveIcon;
</script>

<style scoped>
ion-tab-bar {
  --background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-top: 1px solid #f1f5f9;
  height: calc(64px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -4px 12px rgba(15, 23, 42, 0.03);
}

ion-tab-button {
  --color: #94a3b8;
  --color-selected: #2563eb;
  font-weight: 700;
  transition: all 0.2s ease;
}

ion-tab-button::part(native) {
  padding-top: 8px;
}

ion-icon {
  font-size: 1.5rem;
  margin-bottom: 4px;
}

ion-label {
  font-size: 0.7rem;
  letter-spacing: 0.02em;
  text-transform: none;
}

/* Custom indicator for active tab */
ion-tab-button.tab-selected::after {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background: #2563eb;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.4);
}
</style>
