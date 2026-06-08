<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Account</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list inset>
        <ion-item>
          <ion-label>
            <h2>{{ auth.user?.email }}</h2>
            <p>User ID: {{ auth.user?.id }}</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <ion-button expand="block" color="medium" :disabled="auth.loading" @click="logout">
        Sign out
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();

async function logout() {
  await auth.signOut();
  router.replace("/auth");
}
</script>
