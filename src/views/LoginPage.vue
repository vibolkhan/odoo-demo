<template>
  <ion-page>
    <ion-content class="login-content" :fullscreen="true">
      <div class="login-shell">
        <section class="login-card">
          <p class="eyebrow">Odoo Demo</p>
          <h1>Sign in to continue</h1>
          <p class="intro">
            Please log in before accessing requests, history, or profile pages.
          </p>

          <form class="login-form" @submit.prevent="handleLogin">
            <label class="field">
              <span class="field-label">Username</span>
              <input
                v-model="username"
                class="text-input"
                type="text"
                autocomplete="username"
                placeholder="Enter your username"
                required
              />
            </label>

            <label class="field">
              <span class="field-label">Password</span>
              <input
                v-model="password"
                class="text-input"
                type="password"
                autocomplete="current-password"
                placeholder="Enter your password"
                required
              />
            </label>

            <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

            <ion-button expand="block" type="submit" :disabled="isSubmitting">
              {{ isSubmitting ? 'Signing in...' : 'Login' }}
            </ion-button>
          </form>

          <p class="hint">
            Sign in with your Odoo account for
            <strong>memot_rubber_plantation_staging</strong>.
          </p>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonContent,
  IonPage,
} from '@ionic/vue'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login, isAuthenticated } from '@/utils/auth'

const router = useRouter()
const route = useRoute()

const username = ref('vibol.khan@axivit.com')
const password = ref('Admin@2026')
const errorMessage = ref('')
const isSubmitting = ref(false)

const redirectPath = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/')
    ? redirect
    : '/tabs/tab2'
})

if (isAuthenticated()) {
  router.replace(redirectPath.value)
}

const handleLogin = async () => {
  errorMessage.value = ''

  if (!username.value.trim() || !password.value.trim()) {
    errorMessage.value = 'Please enter both username and password.'
    return
  }

  isSubmitting.value = true

  try {
    await login(username.value.trim(), password.value)
    await router.replace(redirectPath.value)
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Unable to sign in right now. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.login-content {
  --background: linear-gradient(180deg, #f4efe7 0%, #ffffff 55%, #eef4ff 100%);
}

.login-shell {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-card {
  width: min(100%, 420px);
  padding: 28px 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 50px rgba(21, 35, 56, 0.12);
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #7b5b2e;
}

h1 {
  margin: 0;
  font-size: 2rem;
  line-height: 1.1;
  color: #142033;
}

.intro {
  margin: 12px 0 24px;
  color: #4c5b70;
}

.login-form {
  display: grid;
  gap: 14px;
}

.field {
  display: grid;
  gap: 8px;
}

.field-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #344054;
}

.text-input {
  width: 100%;
  box-sizing: border-box;
  padding: 16px 18px;
  border: 0;
  outline: none;
  border-radius: 16px;
  background: #f6f8fc;
  color: #142033;
  font: inherit;
  appearance: none;
  -webkit-appearance: none;
}

.text-input::placeholder {
  color: #98a2b3;
}

.text-input:focus {
  box-shadow: 0 0 0 2px rgba(46, 102, 219, 0.2);
}

.error-message {
  margin: 0;
  color: #b42318;
  font-size: 0.95rem;
}

.hint {
  margin: 18px 0 0;
  color: #667085;
  font-size: 0.9rem;
}
</style>
