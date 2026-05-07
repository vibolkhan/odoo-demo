<template>
  <ion-app>
    <Transition name="fade">
      <div v-if="!sessionReady" class="splash-screen">
        <div class="splash-content">
          <img :src="splashImage" alt="App splash" class="splash-image" />
          <h1>TimeNest</h1>
          <div class="splash-loader">
            <div class="loader-bar"></div>
          </div>
        </div>
      </div>
    </Transition>
    <ion-router-outlet v-if="sessionReady" />
  </ion-app>
</template>

<script setup>
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { useThemeStore } from '@/stores/theme.store';
import { useAuthStore } from '@/stores/auth.store';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import splashImage from '../resources/splash-screen.png';

const themeStore = useThemeStore();
const authStore = useAuthStore();
const { sessionReady } = storeToRefs(authStore);

onMounted(async () => {
  themeStore.applyTheme();
  // Ensure session is hydrated before showing the app
  await authStore.hydrateSession();
});

</script>

<style>
.splash-screen {
  position: fixed;
  inset: 0;
  background: var(--app-bg);
  z-index: 9999;
  display: grid;
  place-items: center;
  text-align: center;
}

.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.splash-image {
  width: min(220px, 60vw);
  max-height: 220px;
  object-fit: contain;
  filter: drop-shadow(0 20px 40px rgba(37, 99, 235, 0.22));
  animation: float 3s infinite ease-in-out;
}

.splash-content h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.splash-loader {
  width: 140px;
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
  overflow: hidden;
}

.loader-bar {
  height: 100%;
  background: var(--ion-color-primary);
  width: 40%;
  border-radius: 2px;
  animation: loading 1.5s infinite ease-in-out;
}

@keyframes loading {
  0% { transform: translateX(-100%); width: 20%; }
  50% { width: 60%; }
  100% { transform: translateX(250%); width: 20%; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-leave-to {
  opacity: 0;
  transform: scale(1.1);
}
</style>
