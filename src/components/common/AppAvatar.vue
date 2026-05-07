<template>
  <div 
    class="avatar-container" 
    :style="containerStyle"
    :class="{ 'has-border': border }"
  >
    <div v-if="imageUrl" class="avatar-image-box">
      <img :src="imageUrl" :alt="name" @error="handleImageError" />
    </div>
    <div v-else class="avatar-initials" :style="initialsStyle">
      {{ initials }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  name: {
    type: String,
    default: 'User'
  },
  src: {
    type: String,
    default: ''
  },
  size: {
    type: [Number, String],
    default: 48
  },
  border: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: 'blue' // blue, emerald, amber, purple, rose, slate
  }
});

const imageError = ref(false);

const imageUrl = computed(() => {
  if (imageError.value || !props.src) return null;
  return props.src;
});

const initials = computed(() => {
  if (!props.name) return '?';
  const parts = props.name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
});

const containerStyle = computed(() => {
  const sizePx = typeof props.size === 'number' ? `${props.size}px` : props.size;
  return {
    width: sizePx,
    height: sizePx,
    fontSize: `calc(${sizePx} * 0.4)`
  };
});

const gradients = {
  blue: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
  emerald: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
  amber: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
  purple: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
  rose: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)',
  slate: 'linear-gradient(135deg, #94a3b8 0%, #475569 100%)',
};

const initialsStyle = computed(() => {
  return {
    background: gradients[props.variant] || gradients.blue,
  };
});

const handleImageError = () => {
  imageError.value = true;
};

const handleImageLoad = () => {
  imageError.value = false;
};
</script>

<style scoped>
.avatar-container {
  display: inline-flex;
  position: relative;
  border-radius: 35%; /* Squircle look */
  overflow: hidden;
  flex-shrink: 0;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.avatar-container.has-border {
  border: 3px solid var(--border-color);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

.avatar-image-box {
  width: 100%;
  height: 100%;
}

.avatar-image-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  letter-spacing: -0.02em;
}

/* Hover effect if wrapped in a button or clickable */
.avatar-container:active {
  transform: scale(0.92);
}
</style>
