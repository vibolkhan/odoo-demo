<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>HR Attendance Login</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="auth-content">
      <ion-refresher slot="fixed" @ion-refresh="refresh">
        <ion-refresher-content pulling-text="Pull to refresh login" refreshing-text="Refreshing login..." />
      </ion-refresher>

      <form class="auth-form" novalidate @submit.prevent="submit">
        <ion-text v-if="registrationNotice" color="medium">
          <p class="auth-note">Self-registration is not available. Ask Admin or HR to create your account.</p>
        </ion-text>

        <ion-list inset>
          <ion-item>
            <ion-input
              v-model.trim="email"
              autocomplete="email"
              label="Email *"
              label-placement="stacked"
              required
              type="email"
            />
          </ion-item>
          <ion-note v-if="errors.email" color="danger" class="field-error">
            {{ errors.email }}
          </ion-note>

          <ion-item>
            <ion-input
              v-model="password"
              autocomplete="current-password"
              label="Password *"
              label-placement="stacked"
              :minlength="6"
              required
              type="password"
            />
          </ion-item>
          <ion-note v-if="errors.password" color="danger" class="field-error">
            {{ errors.password }}
          </ion-note>
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
  IonNote,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
} from "@ionic/vue";
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const email = ref("");
const password = ref("");
const message = ref("");
const errors = reactive<{ email?: string; password?: string }>({});
const registrationNotice = computed(() => route.query.notice === "registration");

async function refresh(event: CustomEvent) {
  try {
    message.value = "";
    clearErrors();
    await auth.loadSession();
    if (auth.isAuthenticated) router.replace(auth.isAdminOrHR ? "/admin/tabs/dashboard" : "/employee/tabs/home");
  } finally {
    (event.target as HTMLIonRefresherElement).complete();
  }
}

function clearErrors() {
  delete errors.email;
  delete errors.password;
}

function validateForm() {
  clearErrors();
  if (!email.value) errors.email = "Email is required.";
  else if (!/^\S+@\S+\.\S+$/.test(email.value)) errors.email = "Enter a valid email address.";
  if (!password.value) errors.password = "Password is required.";
  else if (password.value.length < 6) errors.password = "Password must be at least 6 characters.";
  return !errors.email && !errors.password;
}

async function submit() {
  message.value = "";
  if (!validateForm()) return;

  try {
    await auth.loginAction(email.value, password.value);
    router.replace(auth.isAdminOrHR ? "/admin/tabs/dashboard" : "/employee/tabs/home");
  } catch (error) {
    message.value = error instanceof Error ? error.message : "Unable to login.";
  }
}
</script>

<style scoped>
.auth-content::part(scroll) {
  align-items: center;
  display: flex;
  min-height: 100%;
}

.auth-form {
  margin: 0 auto;
  max-width: 420px;
  padding: 24px 16px;
  width: 100%;
}

.auth-note {
  margin: 0 0 12px;
}

.field-error {
  display: block;
  margin: 4px 16px 10px;
}

ion-spinner {
  height: 20px;
  width: 20px;
}
</style>
