<template>
  <header class="app-page-header">
    <button
      v-if="backHref"
      type="button"
      class="back-button"
      :aria-label="backLabel"
      @click="goBack"
    >
      <ion-icon :icon="arrowBackOutline" />
    </button>

    <div class="header-copy">
      <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
    </div>

    <div v-if="$slots.actions" class="header-actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
import { IonIcon } from "@ionic/vue";
import { arrowBackOutline } from "ionicons/icons";
import { useRouter } from "vue-router";

const props = defineProps({
  eyebrow: {
    type: String,
    default: "",
  },
  title: {
    type: String,
    required: true,
  },
  backHref: {
    type: String,
    default: "",
  },
  backLabel: {
    type: String,
    default: "Go back",
  },
});

const router = useRouter();

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
    return;
  }

  router.push(props.backHref);
};
</script>

<style scoped>
.app-page-header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: end;
  gap: 12px;
}

.header-copy {
  min-width: 0;
}

.eyebrow {
  margin: 0 0 4px;
  font-size: 0.78rem;
  font-weight: 750;
  color: var(--text-secondary);
  letter-spacing: 0.04em;
}

h1 {
  margin: 0;
  font-size: clamp(1.6rem, 5vw, 1.9rem);
  line-height: 1.12;
  font-weight: 850;
  color: var(--text-primary);
}

.back-button,
:deep(.app-page-header-action) {
  width: 42px;
  height: 42px;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: var(--card-bg);
  color: var(--text-primary);
  display: grid;
  place-items: center;
  font-size: 1.15rem;
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition:
    transform 0.16s ease,
    background-color 0.16s ease,
    border-color 0.16s ease,
    color 0.16s ease;
}

.back-button:active,
:deep(.app-page-header-action:active) {
  transform: scale(0.94);
  box-shadow: var(--shadow-card-pressed);
}

:deep(.app-page-header-action.active) {
  color: #2563eb;
  border-color: rgba(37, 99, 235, 0.3);
  background: rgba(37, 99, 235, 0.08);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
