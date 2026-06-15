<template>
  <ion-button
    color="danger"
    expand="block"
    fill="outline"
    :disabled="auth.loading"
    @click="confirmOpen = true"
  >
    <ion-spinner v-if="auth.loading" name="crescent" />
    <template v-else>
      <ion-icon slot="start" :icon="logOutOutline" />
      Logout
    </template>
  </ion-button>

  <ion-alert
    :is-open="confirmOpen"
    header="Logout"
    message="Are you sure you want to end this session?"
    :buttons="buttons"
    @did-dismiss="confirmOpen = false"
  />

  <ion-toast
    v-model:is-open="toastOpen"
    color="danger"
    :duration="3500"
    :message="toastMessage"
  />
</template>

<script setup lang="ts">
import {
  IonAlert,
  IonButton,
  IonIcon,
  IonSpinner,
  IonToast,
} from "@ionic/vue";
import { logOutOutline } from "ionicons/icons";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { getErrorMessage } from "@/composables/useSupabaseError";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();
const confirmOpen = ref(false);
const toastMessage = ref("");
const toastOpen = ref(false);

const buttons = [
  { text: "Cancel", role: "cancel" },
  {
    text: "Logout",
    role: "confirm",
    handler: () => {
      void signOut();
    },
  },
];

async function signOut() {
  try {
    await auth.logout();
    await router.replace("/login");
  } catch (error) {
    toastMessage.value = getErrorMessage(error, "Unable to logout.");
    toastOpen.value = true;
  }
}
</script>
