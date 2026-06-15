<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>HR Attendance Login</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form class="auth-form" @submit.prevent="submit">
        <ion-list inset>
          <ion-item>
            <ion-input
              v-model.trim="email"
              autocomplete="email"
              label="Email"
              label-placement="stacked"
              required
              type="email"
            />
          </ion-item>
          <ion-item>
            <ion-input
              v-model="password"
              autocomplete="current-password"
              label="Password"
              label-placement="stacked"
              :minlength="6"
              required
              type="password"
            />
          </ion-item>
        </ion-list>

        <ion-text v-if="message" color="danger">
          <p>{{ message }}</p>
        </ion-text>

        <ion-button expand="block" type="submit" :disabled="auth.loading">
          <ion-spinner v-if="auth.loading" name="crescent" />
          <span v-else>Login</span>
        </ion-button>
      </form>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/vue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();
const email = ref("");
const password = ref("");
const message = ref("");

async function submit() {
  message.value = "";

  try {
    await auth.loginAction(email.value, password.value);
    router.replace(auth.isAdminOrHR ? "/admin/tabs/dashboard" : "/employee/tabs/home");
  } catch (error) {
    message.value = error instanceof Error ? error.message : "Unable to login.";
  }
}
</script>

<style scoped>
.auth-form {
  margin: 40px auto 0;
  max-width: 420px;
}

ion-spinner {
  height: 20px;
  width: 20px;
}
</style>
