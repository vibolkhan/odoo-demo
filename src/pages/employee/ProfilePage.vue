<template>
  <ion-page><ion-header><ion-toolbar><ion-title>Profile</ion-title></ion-toolbar></ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ion-refresh="refresh"><ion-refresher-content pulling-text="Pull to refresh profile" refreshing-text="Refreshing profile..." /></ion-refresher>
      <profile-header :name="fullName" :subtitle="auth.user?.email || ''" :status="auth.employee?.status || 'unknown'" />
      <ion-list inset>
        <ion-item><ion-label>Employee code</ion-label><ion-note slot="end">{{ auth.employee?.employee_code || "-" }}</ion-note></ion-item>
        <ion-item><ion-label>Role</ion-label><ion-note slot="end">{{ auth.roleName || "-" }}</ion-note></ion-item>
        <ion-item><ion-label>Department</ion-label><ion-note slot="end">{{ auth.employee?.departments?.name || "-" }}</ion-note></ion-item>
        <ion-item><ion-label>Position</ion-label><ion-note slot="end">{{ auth.employee?.positions?.title || "-" }}</ion-note></ion-item>
        <ion-item><ion-label>Phone</ion-label><ion-note slot="end">{{ auth.employee?.phone || "-" }}</ion-note></ion-item>
        <ion-item><ion-label>Hire date</ion-label><ion-note slot="end">{{ formatDisplayDate(auth.employee?.hire_date) }}</ion-note></ion-item>
      </ion-list>
      <div class="ion-padding"><app-logout-button /></div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import {
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
  onIonViewWillEnter,
} from "@ionic/vue";
import { computed } from "vue"; import AppLogoutButton from "@/components/AppLogoutButton.vue"; import ProfileHeader from "@/components/ProfileHeader.vue"; import { useAuthStore } from "@/stores/auth"; import { formatDisplayDate } from "@/utils/format";
const auth = useAuthStore();
async function load() { await auth.loadProfile(); }
async function refresh(event: CustomEvent) { try { await load(); } finally { (event.target as HTMLIonRefresherElement).complete(); } }
onIonViewWillEnter(load); const fullName = computed(() => auth.employee ? `${auth.employee.first_name} ${auth.employee.last_name}` : auth.user?.email || "User");
</script>
