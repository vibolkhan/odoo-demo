<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button
          tab="leave-calendar"
          href="/tabs/leave-calendar"
          @click="triggerTabHaptic"
        >
          <ion-icon
            aria-hidden="true"
            :icon="tabIcon('/tabs/leave-calendar', calendar, calendarOutline)"
          />
          <ion-label>Calendar</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="my-attendance"
          href="/tabs/my-attendance"
          @click="triggerTabHaptic"
        >
          <ion-icon
            aria-hidden="true"
            :icon="tabIcon('/tabs/my-attendance', time, timeOutline)"
          />
          <ion-label>Attendance</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="requests"
          href="/tabs/requests"
          @click="triggerTabHaptic"
        >
          <ion-icon
            aria-hidden="true"
            :icon="tabIcon('/tabs/requests', receipt, receiptOutline)"
          />
          <ion-label>Requests</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="leave-balance"
          href="/tabs/leave-balance"
          @click="triggerTabHaptic"
        >
          <ion-icon
            aria-hidden="true"
            :icon="tabIcon('/tabs/leave-balance', wallet, walletOutline)"
          />
          <ion-label>Balance</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="profile"
          href="/tabs/profile"
          @click="triggerTabHaptic"
        >
          <ion-icon
            aria-hidden="true"
            :icon="tabIcon('/tabs/profile', person, personOutline)"
          />
          <ion-label>Me</ion-label>
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

import { Haptics, ImpactStyle } from "@capacitor/haptics";

const route = useRoute();

const tabIcon = (path, activeIcon, inactiveIcon) =>
  route.path === path || route.path.startsWith(`${path}/`)
    ? activeIcon
    : inactiveIcon;

const triggerTabHaptic = async () => {
  await Haptics.impact({ style: ImpactStyle.Light });
};
</script>

<style scoped>
ion-tab-bar {
  --background: var(--card-bg);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--border-color);
  height: calc(72px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -4px 12px rgba(15, 23, 42, 0.03);
}

ion-tab-button {
  --color: var(--text-secondary);
  --color-selected: var(--ion-color-primary);
  font-weight: 700;
  transition: all 0.2s ease;
}

ion-tab-button::part(native) {
  padding-top: 10px;
  padding-bottom: 8px;
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
  border-radius: 0 0 4px 4px;
}

ion-tab-button.tab-selected ion-icon {
  transform: scale(1.12);
}

ion-icon {
  transition: transform 0.2s ease;
}

ion-tab-button.tab-selected::before {
  content: "";
  position: absolute;
  inset: 6px;
  background: rgba(var(--ion-color-primary-rgb), 0.12);
  border-radius: 14px;
  z-index: -1;
}
</style>
