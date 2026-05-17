<template>
  <ion-modal
    :is-open="isOpen"
    :breakpoints="[0, 1]"
    :initial-breakpoint="1"
    :backdrop-breakpoint="0"
    :expand-to-scroll="false"
    @didDismiss="$emit('close')"
  >
    <ion-content class="holiday-detail-modal" :scroll-y="true">
      <section v-if="holiday" class="holiday-detail-shell">
        <div class="holiday-detail-header">
          <div class="header-content">
            <div class="header-meta-row">
              <span class="category-tag">Public Holiday</span>
              <div class="date-tag">
                <ion-icon :icon="calendarClearOutline" />
                <span>{{ holiday.fullDate }}</span>
              </div>
            </div>
            <h2 class="english-title" :class="{ 'long-title': holiday.type.length > 40 }">
              {{ getEnglishName(holiday.type) }}
            </h2>
            <h3 v-if="getKhmerName(holiday.type)" class="khmer-title" :class="{ 'long-title': holiday.type.length > 40 }">
              {{ getKhmerName(holiday.type) }}
            </h3>
          </div>

          <button
            class="close-fab app-modal-close-button"
            aria-label="Close holiday details"
            @click="$emit('close')"
          >
            <ion-icon :icon="close" />
          </button>
        </div>

        <div class="detail-cards-grid">
          <div class="info-card">
            <div class="card-icon-box holiday-theme">
              <ion-icon :icon="calendarOutline" />
            </div>
            <div class="card-text">
              <span class="card-label">Duration</span>
              <span class="card-value">{{ holiday.duration }}</span>
            </div>
          </div>

          <div class="info-card">
            <div class="card-icon-box status-theme">
              <ion-icon :icon="checkmarkCircleOutline" />
            </div>
            <div class="card-text">
              <span class="card-label">Status</span>
              <span class="card-value">Observing</span>
            </div>
          </div>
        </div>

        <div class="description-section">
          <div class="section-header">
            <ion-icon :icon="informationCircleOutline" />
            <h3>About this Holiday</h3>
          </div>
          <div class="description-content">
            <p>
              This is an officially recognized public holiday. Most government offices and businesses are closed to observe this special occasion.
            </p>
            <div class="benefit-box">
              <ion-icon :icon="sparklesOutline" />
              <span>Full pay entitlement for all active employees.</span>
            </div>
          </div>
        </div>
      </section>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { IonContent, IonIcon, IonModal } from "@ionic/vue";
import {
  calendarClearOutline,
  calendarOutline,
  checkmarkCircleOutline,
  close,
  informationCircleOutline,
  sparklesOutline,
} from "ionicons/icons";

defineProps({
  isOpen: Boolean,
  holiday: Object,
});

defineEmits(['close']);

const getEnglishName = (name) => {
  return name.split("(")[0].trim();
};

const getKhmerName = (name) => {
  const match = name.match(/\(([^)]+)\)/);
  return match ? match[1] : "";
};
</script>

<style scoped>
.holiday-detail-modal {
  --background: var(--card-bg);
  --padding-top: 0;
  --padding-start: 24px;
  --padding-end: 24px;
  --padding-bottom: calc(env(safe-area-inset-bottom) + 32px);
}

.holiday-detail-shell {
  padding-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.holiday-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
}

.header-content {
  flex: 1;
}

.header-meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.category-tag {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #dc2626;
  background: rgba(220, 38, 38, 0.08);
  padding: 4px 10px;
  border-radius: 6px;
}

.date-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 700;
}

.date-tag ion-icon {
  font-size: 1.1rem;
  color: var(--text-secondary);
  opacity: 0.6;
}

.english-title {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 850;
  color: var(--text-primary);
  line-height: 1.25;
}

.english-title.long-title {
  font-size: 1.25rem;
}

.khmer-title {
  margin: 8px 0 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-secondary);
  line-height: 1.5;
}

.khmer-title.long-title {
  font-size: 0.95rem;
}

.close-fab {
  margin-left: 16px;
}

.detail-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-card {
  background: var(--app-bg);
  border-radius: 20px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid var(--border-color);
}

.card-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.holiday-theme {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

.status-theme {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.card-text {
  display: flex;
  flex-direction: column;
}

.card-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.description-section {
  background: var(--card-bg);
  border-radius: 24px;
  padding: 24px;
  border: 1px solid var(--border-color);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.section-header ion-icon {
  font-size: 1.3rem;
  color: var(--ion-color-primary);
}

.section-header h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
}

.description-content p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.benefit-box {
  margin-top: 20px;
  padding: 14px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--ion-color-primary);
  font-weight: 600;
  font-size: 0.85rem;
}

.benefit-box ion-icon {
  font-size: 1.2rem;
}

@media (max-width: 480px) {
  .english-title {
    font-size: 1.5rem;
  }
}
</style>
