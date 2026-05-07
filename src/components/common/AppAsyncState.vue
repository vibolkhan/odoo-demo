<template>
  <div class="async-state-wrapper">
    <!-- Loading State -->
    <slot v-if="status === 'loading'" name="loading">
      <div class="default-loading">
        <ion-spinner name="crescent" />
      </div>
    </slot>

    <!-- Error State -->
    <slot v-else-if="status === 'error'" name="error" :error="error">
      <div class="default-error">
        <ion-icon :icon="alertCircleOutline" />
        <p>{{ error || 'An unexpected error occurred' }}</p>
        <ion-button v-if="retry" fill="clear" size="small" @click="$emit('retry')">
          Retry
        </ion-button>
      </div>
    </slot>

    <!-- Success State -->
    <slot v-else-if="status === 'success' || (status === 'idle' && !showIdleAsLoading)" name="default"></slot>

    <!-- Idle State (optional) -->
    <slot v-else-if="status === 'idle'" name="idle">
      <slot name="loading" v-if="showIdleAsLoading">
        <div class="default-loading">
          <ion-spinner name="crescent" />
        </div>
      </slot>
    </slot>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { IonSpinner, IonIcon, IonButton } from '@ionic/vue';
import { alertCircleOutline } from 'ionicons/icons';

const props = defineProps({
  state: {
    type: Object,
    required: true,
    // Expected shape: { status: 'idle' | 'loading' | 'success' | 'error', error: string | null }
  },
  retry: {
    type: Boolean,
    default: false
  },
  showIdleAsLoading: {
    type: Boolean,
    default: false
  }
});

defineEmits(['retry']);

const status = computed(() => props.state?.status || 'idle');
const error = computed(() => props.state?.error);
</script>

<style scoped>
.async-state-wrapper {
  width: 100%;
}

.default-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: var(--ion-color-primary);
}

.default-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 16px;
  text-align: center;
  color: var(--ion-color-danger);
  background: var(--ion-color-danger-tint, rgba(235, 68, 90, 0.1));
  border-radius: 16px;
  margin: 16px 0;
}

.default-error ion-icon {
  font-size: 32px;
}

.default-error p {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
}
</style>
