<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{
          isRegistering ? 'Create account' : 'Sign in'
        }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form
        class="auth-form"
        @submit.prevent="submit"
      >
        <ion-list inset>
          <ion-item>
            <ion-input
              v-model="email"
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
              minlength="3"
              required
              type="password"
            />
          </ion-item>
        </ion-list>

        <ion-text
          v-if="message"
          :color="messageColor"
        >
          <p>{{ message }}</p>
        </ion-text>

        <ion-button
          expand="block"
          type="submit"
          :disabled="auth.loading"
        >
          {{ isRegistering ? 'Register' : 'Login' }}
        </ion-button>

        <ion-button
          fill="clear"
          expand="block"
          type="button"
          @click="toggleMode"
        >
          {{
            isRegistering ? 'Use an existing account' : 'Create a new account'
          }}
        </ion-button>
      </form>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const isRegistering = ref(false)
const message = ref('')
const messageColor = ref('danger')

function toggleMode() {
  isRegistering.value = !isRegistering.value
  message.value = ''
}

async function submit() {
  message.value = ''

  try {
    const result = isRegistering.value
      ? await auth.signUp(email.value, password.value)
      : await auth.signIn(email.value, password.value)

    if (result.session) {
      router.replace('/tabs/tab1')
      return
    }

    messageColor.value = 'success'
    message.value = 'Check your email to confirm your account.'
  } catch (error) {
    messageColor.value = 'danger'
    message.value = error.message
  }
}
</script>

<style scoped>
.auth-form {
  margin: 40px auto 0;
  max-width: 420px;
}
</style>
