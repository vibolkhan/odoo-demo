<template>
  <div 
    class="skeleton-item" 
    :class="{ 'shimmer': shimmer, 'circle': shape === 'circle', 'squircle': shape === 'squircle' }"
    :style="style"
  ></div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '20px'
  },
  shape: {
    type: String,
    default: 'rect' // rect, circle, squircle
  },
  shimmer: {
    type: Boolean,
    default: true
  },
  margin: {
    type: String,
    default: '0'
  }
});

const style = computed(() => ({
  width: props.width,
  height: props.height,
  margin: props.margin
}));
</script>

<style scoped>
.skeleton-item {
  background: var(--border-color);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  opacity: 0.6;
}

.skeleton-item.circle {
  border-radius: 50%;
}

.skeleton-item.squircle {
  border-radius: 35%;
}

.shimmer::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0,
    rgba(255, 255, 255, 0.1) 20%,
    rgba(255, 255, 255, 0.3) 60%,
    rgba(255, 255, 255, 0)
  );
  animation: shimmer 2s infinite;
}

.ion-palette-dark .shimmer::after {
  background-image: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0,
    rgba(255, 255, 255, 0.05) 20%,
    rgba(255, 255, 255, 0.1) 60%,
    rgba(255, 255, 255, 0)
  );
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
