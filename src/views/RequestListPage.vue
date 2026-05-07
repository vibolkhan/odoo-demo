<template>
  <ion-page>
    <ion-content
      :fullscreen="true"
      class="request-list-page"
      :scroll-y="!isCreateModalOpen"
    >
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <section class="catalog-shell">
        <!-- <div class="top-action-bar">
          <ion-button fill="clear" class="utility-button">
            <ion-icon :icon="notificationsOutline" size="large" />
          </ion-button>
        </div> -->

        <div class="page-header">
          <div>
            <p class="eyebrow">Leave Management</p>
            <h1>Request History</h1>
          </div>
        </div>

        <div v-if="showSummarySkeleton" class="stats-summary stats-summary-skeleton">
          <div v-for="i in 3" :key="`request-stat-skeleton-${i}`" class="stat-item">
            <AppSkeleton width="42px" height="24px" />
            <AppSkeleton width="56px" height="12px" margin="8px 0 0" />
          </div>
        </div>

        <div v-else class="stats-summary">
          <div class="stat-item">
            <span class="stat-value">{{ summary.total }}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ summary.pending }}</span>
            <span class="stat-label">Pending</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ summary.review }}</span>
            <span class="stat-label">Review</span>
          </div>
        </div>

        <p v-if="actionMessage" class="state-message success-message">
          {{ actionMessage }}
        </p>

        <RequestLst
          ref="requestListRef"
          @summary-change="handleSummaryChange"
        />
      </section>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button class="fab-create" @click="openCreateModal">
          <ion-icon :icon="addOutline" size="large" />
        </ion-fab-button>
      </ion-fab>

      <ion-modal
        :is-open="isCreateModalOpen"
        :breakpoints="[0, 0.65, 0.92, 1]"
        :initial-breakpoint="1"
        :backdrop-breakpoint="0"
        handle="true"
        @didDismiss="closeCreateModal"
      >
        <ion-content class="leave-type-modal">
          <section class="modal-shell">
            <div class="modal-header">
              <div>
                <p class="modal-eyebrow">Leave Request</p>
                <h2>Create Request</h2>
              </div>

              <ion-button
                fill="clear"
                class="detail-close-button"
                aria-label="Close create request form"
                @click="closeCreateModal"
              >
                <ion-icon
                  :icon="close"
                  size="large"
                  aria-hidden="true"
                  class="close-icon"
                />
              </ion-button>
            </div>

            <RequestForm
              :navigate-after-submit="false"
              @submitted="handleRequestSubmitted"
            />
          </section>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonModal,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  onIonViewWillEnter,
} from "@ionic/vue";
import { addOutline, close, notificationsOutline } from "ionicons/icons";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import RequestForm from "@/components/RequestForm.vue";
import RequestLst from "@/components/RequestLst.vue";
import AppSkeleton from "@/components/AppSkeleton.vue";
import { useTimeoffStore } from "@/stores/timeoff.store";
import { useMinimumSkeleton } from "@/composables/useMinimumSkeleton";

const route = useRoute();
const router = useRouter();
const timeoffStore = useTimeoffStore();
const requestListRef = ref(null);
const isCreateModalOpen = ref(false);
const actionMessage = ref("");
const summary = ref({
  total: 0,
  pending: 0,
  review: 0,
});
const { showSkeleton: showSummarySkeleton } = useMinimumSkeleton(
  () => timeoffStore.loading.leaveRequests,
  1000,
);

const openCreateModal = () => {
  actionMessage.value = "";
  isCreateModalOpen.value = true;
};

const closeCreateModal = () => {
  isCreateModalOpen.value = false;
};

const handleRequestSubmitted = async () => {
  actionMessage.value = "Leave request submitted successfully.";
  closeCreateModal();
  await requestListRef.value?.loadLeaveRequests();
};

const handleSummaryChange = (nextSummary) => {
  summary.value = nextSummary;
};

const handleRefresh = async (event) => {
  try {
    await requestListRef.value?.loadLeaveRequests();
  } finally {
    event.target?.complete();
  }
};

const openRequestedDetailFromQuery = async () => {
  const requestIdParam = route.query.requestId;
  const requestIdValue = Array.isArray(requestIdParam)
    ? requestIdParam[0]
    : requestIdParam;
  const requestId = Number(requestIdValue);

  if (!requestId) {
    return;
  }

  const opened = requestListRef.value?.openRequestDetailById?.(requestId);

  if (!opened) {
    return;
  }

  const nextQuery = { ...route.query };
  delete nextQuery.requestId;

  await router.replace({
    path: route.path,
    query: nextQuery,
  });
};

onIonViewWillEnter(() => {
  void (async () => {
    await requestListRef.value?.loadLeaveRequests();
    await openRequestedDetailFromQuery();
  })();
});
</script>

<style scoped>
.request-list-page {
  --background: var(--app-bg);
  background-image: radial-gradient(
    circle at top left,
    rgba(46, 102, 219, 0.16),
    transparent 34%
  );
  --padding-top: calc(env(safe-area-inset-top) + 18px);
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-bottom: calc(env(safe-area-inset-bottom) + 110px);
}

.catalog-shell {
  display: grid;
  gap: 16px;
}

.top-action-bar {
  display: flex;
  justify-content: flex-end;
}

.utility-button {
  width: 52px;
  height: 52px;
  margin: 0;
  --background: var(--card-bg);
  --border-radius: 20px;
  --color: var(--text-primary);
  --box-shadow: 0 10px 24px rgba(45, 67, 100, 0.08);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.eyebrow {
  margin: 0 0 4px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
  letter-spacing: 0.04em;
}

h1 {
  margin: 0;
  font-size: clamp(1.65rem, 5vw, 1.9rem);
  line-height: 1.12;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.stats-summary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 24px;
  padding: 24px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  color: white;
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.25);
}

.stats-summary-skeleton {
  min-height: 108px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 900;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 700;
  opacity: 0.9;
  text-transform: uppercase;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: rgba(255, 255, 255, 0.2);
}

.fab-create {
  --background: #2e66db;
  --box-shadow: 0 16px 30px rgba(46, 102, 219, 0.36);
}

.state-message {
  padding: 22px 16px;
  border-radius: 24px;
  text-align: center;
  background: var(--card-bg);
}

.success-message {
  color: #067647;
}

.leave-type-modal {
  --background: var(--app-bg);
  --padding-top: 22px;
  --padding-start: 18px;
  --padding-end: 18px;
  --padding-bottom: calc(env(safe-area-inset-bottom) + 24px);
}

.modal-shell {
  display: grid;
  gap: 18px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.modal-eyebrow {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.modal-header h2 {
  margin: 8px 0 0;
  font-size: 1.75rem;
  line-height: 1.15;
  font-weight: 850;
  color: var(--text-primary);
}

.modal-subtitle {
  margin: 8px 0 0;
  font-size: 0.92rem;
  line-height: 1.45;
  color: var(--text-secondary);
}

.detail-close-button {
  width: 48px;
  height: 48px;
  margin: 0;
  --color: #1d4ed8;
  --border-radius: 16px;
  --background: var(--card-bg);
  --box-shadow: 0 10px 25px rgba(55, 75, 105, 0.12);
}

.detail-close-button ion-icon {
  font-size: 1.6rem;
}

.close-icon {
  font-size: 1.6rem;
}

@media (max-width: 640px) {
  .request-list-page {
    --padding-top: calc(env(safe-area-inset-top) + 18px);
  }

  .modal-header h2 {
    font-size: 1.55rem;
  }

  .modal-subtitle {
    font-size: 0.86rem;
  }
}
</style>
