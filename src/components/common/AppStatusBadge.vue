<template>
  <span class="status-badge" :class="toneClass">
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  tone: {
    type: String,
    default: "neutral",
  },
});

const toneClass = computed(() => `status-${props.tone}`);
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 24px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 850;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.status-neutral {
  background: var(--border-color);
  color: var(--text-secondary);
}

.status-working,
.status-review {
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

.status-pending {
  background: rgba(245, 158, 11, 0.12);
  color: #b45309;
}

.status-approved,
.status-completed {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.status-rejected,
.status-refused,
.status-error {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}
</style>
