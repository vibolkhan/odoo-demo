<template>
  <ion-page><ion-header><ion-toolbar><ion-title>Profile</ion-title></ion-toolbar></ion-header>
    <ion-content>
      <profile-header :name="fullName" :subtitle="auth.user?.email || ''" :status="auth.employee?.status || 'unknown'" />
      <ion-list inset>
        <ion-item><ion-label>Employee code</ion-label><ion-note slot="end">{{ auth.employee?.employee_code || "-" }}</ion-note></ion-item>
        <ion-item><ion-label>Role</ion-label><ion-note slot="end">{{ auth.roleName || "-" }}</ion-note></ion-item>
        <ion-item><ion-label>Department</ion-label><ion-note slot="end">{{ auth.employee?.departments?.name || "-" }}</ion-note></ion-item>
        <ion-item><ion-label>Position</ion-label><ion-note slot="end">{{ auth.employee?.positions?.title || "-" }}</ion-note></ion-item>
        <ion-item><ion-label>Phone</ion-label><ion-note slot="end">{{ auth.employee?.phone || "-" }}</ion-note></ion-item>
        <ion-item><ion-label>Hire date</ion-label><ion-note slot="end">{{ auth.employee?.hire_date || "-" }}</ion-note></ion-item>
      </ion-list>
      <div class="ion-padding"><app-logout-button /></div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { IonContent, IonHeader, IonItem, IonLabel, IonList, IonNote, IonPage, IonTitle, IonToolbar } from "@ionic/vue";
import { computed } from "vue"; import AppLogoutButton from "@/components/AppLogoutButton.vue"; import ProfileHeader from "@/components/ProfileHeader.vue"; import { useAuthStore } from "@/stores/auth";
const auth = useAuthStore(); const fullName = computed(() => auth.employee ? `${auth.employee.first_name} ${auth.employee.last_name}` : auth.user?.email || "User");
</script>
