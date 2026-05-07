<template>
  <div class="empty-state">
    <div class="illustration-container">
      <div class="icon-orb" :class="variant">
        <ion-icon :icon="icon" />
      </div>
      <div class="shadow"></div>
    </div>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <slot name="action"></slot>
  </div>
</template>

<script setup>
import { IonIcon } from '@ionic/vue';
import { documentTextOutline } from 'ionicons/icons';

defineProps({
  icon: {
    type: String,
    default: documentTextOutline
  },
  title: {
    type: String,
    default: 'No Records Found'
  },
  description: {
    type: String,
    default: 'Try adjusting your filters or checking back later.'
  },
  variant: {
    type: String,
    default: 'blue' // blue, emerald, amber, purple
  }
});
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
  background: var(--card-bg);
  border-radius: 32px;
  border: 1px dashed var(--border-color);
  margin: 16px 0;
}

.illustration-container {
  position: relative;
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-orb {
  width: 90px;
  height: 90px;
  border-radius: 32px;
  display: grid;
  place-items: center;
  font-size: 2.5rem;
  color: white;
  position: relative;
  z-index: 2;
  animation: float 4s infinite ease-in-out;
}

.icon-orb.blue { background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%); box-shadow: 0 15px 30px rgba(37, 99, 235, 0.2); }
.icon-orb.emerald { background: linear-gradient(135deg, #34d399 0%, #059669 100%); box-shadow: 0 15px 30px rgba(16, 185, 129, 0.2); }
.icon-orb.amber { background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); box-shadow: 0 15px 30px rgba(217, 119, 6, 0.2); }
.icon-orb.purple { background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%); box-shadow: 0 15px 30px rgba(124, 58, 237, 0.2); }

.shadow {
  width: 50px;
  height: 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  position: absolute;
  bottom: -15px;
  filter: blur(4px);
  animation: shadow-scale 4s infinite ease-in-out;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

@keyframes shadow-scale {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(0.7); opacity: 0.2; }
}

h3 {
  margin: 0 0 10px;
  font-size: 1.5rem;
  font-weight: 850;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

p {
  margin: 0;
  font-size: 1rem;
  color: var(--text-secondary);
  max-width: 260px;
  line-height: 1.5;
  font-weight: 500;
}
</style>
