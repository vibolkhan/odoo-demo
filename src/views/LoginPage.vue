<template>
  <ion-page>
    <ion-content class="login-content" :fullscreen="true">
      <div class="login-shell">
        <div class="background-orbs">
          <div class="orb orb-1"></div>
          <div class="orb orb-2"></div>
          <div class="orb orb-3"></div>
        </div>

        <section class="login-card">
          <div class="card-header">
            <p class="eyebrow">Odoo Demo</p>
            <h1>Welcome Back</h1>
            <p class="intro">
              Sign in to manage your leave requests and profile.
            </p>
          </div>

          <form class="login-form" @submit.prevent="handleLogin">
            <label class="field">
              <span class="field-label">Email Address</span>
              <div class="input-wrapper">
                <input
                  v-model="username"
                  class="text-input"
                  type="email"
                  autocomplete="username"
                  placeholder="vibol.khan@axivit.com"
                  required
                />
              </div>
            </label>

            <label class="field">
              <span class="field-label">Password</span>
              <div class="input-wrapper">
                <input
                  v-model="password"
                  class="text-input"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showPassword = !showPassword"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                >
                  <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline" />
                </button>
              </div>
            </label>

            <div v-if="errorMessage" class="error-container">
              <p class="error-message">{{ errorMessage }}</p>
            </div>

            <ion-button
              class="submit-button"
              expand="block"
              type="submit"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? "Authenticating..." : "Sign In" }}
            </ion-button>
          </form>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonButton, IonContent, IonPage, IonIcon } from "@ionic/vue";
import { eyeOutline, eyeOffOutline } from "ionicons/icons";
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth.store";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { loading: isSubmitting, isAuthenticated } = storeToRefs(authStore);

const username = ref("vibol.khan@axivit.com");
const password = ref("Admin@2026");
const showPassword = ref(false);
const errorMessage = ref("");

const redirectPath = computed(() => {
  const redirect = route.query.redirect;
  return typeof redirect === "string" && redirect.startsWith("/")
    ? redirect
    : "/tabs/leave-calendar";
});

onMounted(async () => {
  await authStore.hydrateSession();

  if (isAuthenticated.value) {
    await router.replace(redirectPath.value);
  }
});

const handleLogin = async () => {
  errorMessage.value = "";

  if (!username.value.trim() || !password.value.trim()) {
    errorMessage.value = "Please enter both email and password.";
    return;
  }

  try {
    await authStore.login(username.value.trim(), password.value);
    await router.replace(redirectPath.value);
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : "Unable to sign in right now. Please try again.";
  }
};
</script>

<style scoped>
.login-content {
  --background: var(--app-bg);
}

.login-shell {
  position: relative;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow: hidden;
}

/* Background animated orbs for depth */
.background-orbs {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.6;
  animation: float 20s infinite ease-in-out alternate;
}

.orb-1 {
  width: 300px;
  height: 300px;
  background: #3b82f6; /* Blue */
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: #8b5cf6; /* Purple */
  bottom: -150px;
  right: -100px;
  animation-delay: -5s;
}

.orb-3 {
  width: 250px;
  height: 250px;
  background: #0ea5e9; /* Sky Blue */
  top: 40%;
  left: 60%;
  animation-delay: -10s;
}

@keyframes float {
  0% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0, 0) scale(1);
  }
}

/* Glassmorphism Card */
.login-card {
  position: relative;
  z-index: 10;
  width: min(100%, 420px);
  padding: 40px 32px;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow:
    0 24px 48px -12px rgba(15, 23, 42, 0.15),
    0 4px 24px rgba(15, 23, 42, 0.05),
    inset 0 0 0 1px rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.card-header {
  text-align: center;
}

.eyebrow {
  margin: 0 0 12px;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ion-color-primary);
}

h1 {
  margin: 0;
  font-size: clamp(1.75rem, 5vw, 2rem);
  line-height: 1.15;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.intro {
  margin: 12px 0 0;
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.5;
}

.login-form {
  display: grid;
  gap: 20px;
}

.field {
  display: grid;
  gap: 8px;
}

.field-label {
  font-size: 0.9rem;
  font-weight: 650;
  color: var(--text-primary);
  margin-left: 4px;
}

.input-wrapper {
  position: relative;
}

.text-input {
  width: 100%;
  box-sizing: border-box;
  padding: 16px 20px;
  border: 2px solid var(--border-color);
  outline: none;
  border-radius: 16px;
  background: var(--card-bg);
  color: var(--text-primary);
  font-size: 1.05rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}

.text-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.text-input:focus {
  border-color: var(--ion-color-primary);
  background: var(--card-bg);
  box-shadow:
    0 0 0 4px rgba(59, 130, 246, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  padding: 8px;
  display: grid;
  place-items: center;
  color: var(--text-secondary);
  font-size: 1.2rem;
  cursor: pointer;
  transition: color 0.2s ease;
}

.password-toggle:focus-visible {
  outline: 2px solid var(--ion-color-primary);
  outline-offset: 2px;
  border-radius: 8px;
}

.password-toggle:active {
  color: var(--ion-color-primary);
}

.error-container {
  padding: 12px 16px;
  background: #fef2f2;
  border-radius: 12px;
  border-left: 4px solid #ef4444;
}

.error-message {
  margin: 0;
  color: #b91c1c;
  font-size: 0.9rem;
  font-weight: 500;
}

.submit-button {
  margin-top: 8px;
  height: 56px;
  --border-radius: 16px;
  --background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
  --background-hover: linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%);
  --color: white;
  --box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.4);
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.02em;
  transition: transform 0.2s ease;
}

.submit-button:active {
  transform: scale(0.98);
}

.card-footer {
  text-align: center;
  border-top: 1px solid var(--border-color);
  padding-top: 24px;
}

.hint {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.hint strong {
  color: var(--text-primary);
  font-weight: 650;
}

@media (max-height: 700px) {
  .login-card {
    padding: 32px 24px;
    gap: 24px;
  }

  h1 {
    font-size: 2rem;
  }
}

.ion-palette-dark .login-card {
  background: rgba(30, 41, 59, 0.7);
  box-shadow:
    0 24px 48px -12px rgba(0, 0, 0, 0.4),
    0 4px 24px rgba(0, 0, 0, 0.2),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}
</style>
