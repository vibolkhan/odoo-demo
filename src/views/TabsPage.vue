<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <!-- <ion-tab-button tab="tab1" href="/tabs/tab1">
          <ion-icon
            aria-hidden="true"
            :icon="tabIcon('/tabs/tab1', grid, gridOutline)"
          />
          <ion-label>Home</ion-label>
        </ion-tab-button> -->

        <ion-tab-button
          tab="tab1"
          href="/tabs/tab1"
        >
          <ion-icon
            aria-hidden="true"
            :icon="tabIcon('/tabs/tab1', list, listOutline)"
          />
          <ion-label>Types</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="tab2"
          href="/tabs/tab2"
        >
          <ion-icon
            aria-hidden="true"
            :icon="tabIcon('/tabs/tab2', addCircle, addCircleOutline)"
          />
          <ion-label>Requests</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="tab4"
          href="/tabs/tab4"
        >
          <ion-icon
            aria-hidden="true"
            :icon="tabIcon('/tabs/tab4', receipt, receiptOutline)"
          />
          <ion-label>History</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="tab3"
          href="/tabs/tab3"
        >
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

<script setup lang="ts">
import {
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonLabel,
  IonIcon,
  IonPage,
  IonRouterOutlet,
} from '@ionic/vue'
import {
  receipt,
  receiptOutline,
  list,
  listOutline,
  addCircle,
  addCircleOutline,
  person,
  personOutline,
} from 'ionicons/icons'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabIcon = (path: string, activeIcon: string, inactiveIcon: string) =>
  route.path === path || route.path.startsWith(`${path}/`)
    ? activeIcon
    : inactiveIcon
</script>
