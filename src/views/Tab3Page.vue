<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Profile</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Profile</ion-title>
        </ion-toolbar>
      </ion-header>

      <section class="profile-content">
        <h2>{{ greeting }}</h2>
        <p>You are logged in and can now access all protected pages.</p>
        <ion-button expand="block" color="danger" @click="handleLogout">
          Logout
        </ion-button>
      </section>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { getStoredUsername, logout } from '@/utils/auth'

const router = useRouter()

const greeting = computed(() => {
  const username = getStoredUsername()
  return username ? `Hello, ${username}` : 'Hello'
})

const handleLogout = async () => {
  logout()
  await router.replace('/login')
}
</script>

<style scoped>
.profile-content {
  padding: 24px 20px;
}

.profile-content h2 {
  margin: 0 0 8px;
}

.profile-content p {
  margin: 0 0 20px;
  color: var(--ion-color-medium);
}
</style>
