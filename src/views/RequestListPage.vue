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
        <div class="top-action-bar">
          <ion-button fill="clear" class="utility-button">
            <ion-icon :icon="notificationsOutline" size="large" />
          </ion-button>
        </div>

        <div class="page-header">
          <div>
            <p class="eyebrow">Leave Management</p>
            <h1>Request History</h1>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <span>Total</span>
            <strong>{{ summary.total }}</strong>
          </div>

          <div class="stat-card">
            <span>Pending</span>
            <strong>{{ summary.pending }}</strong>
          </div>

          <div class="stat-card">
            <span>Review</span>
            <strong>{{ summary.review }}</strong>
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

<script setup lang="ts">
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

type RequestListInstance = InstanceType<typeof RequestLst>;

const route = useRoute();
const router = useRouter();
const requestListRef = ref<RequestListInstance | null>(null);
const isCreateModalOpen = ref(false);
const actionMessage = ref("");
const summary = ref({
  total: 0,
  pending: 0,
  review: 0,
});

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

const handleSummaryChange = (nextSummary: typeof summary.value) => {
  summary.value = nextSummary;
};

const handleRefresh = async (event: CustomEvent) => {
  try {
    await requestListRef.value?.loadLeaveRequests();
  } finally {
    (event.target as HTMLIonRefresherElement | null)?.complete();
  }
};

const openRequestedDetailFromQuery = async () => {
  const requestIdParam = route.query.requestId;
  const requestIdValue = Array.isArray(requestIdParam) ? requestIdParam[0] : requestIdParam;
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
  --background:
    radial-gradient(
      circle at top left,
      rgba(46, 102, 219, 0.16),
      transparent 34%
    ),
    linear-gradient(180deg, #f8fbff 0%, #eef4fb 55%, #e8f0f8 100%);
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
  --background: rgba(255, 255, 255, 0.9);
  --border-radius: 20px;
  --color: #16243a;
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
  color: #5b6b82;
  letter-spacing: 0.04em;
}

h1 {
  margin: 0;
  font-size: 2.15rem;
  line-height: 1.1;
  font-weight: 850;
  color: #0f172a;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stat-card {
  padding: 14px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 8px 22px rgba(55, 75, 105, 0.08);
}

.stat-card span {
  display: block;
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 650;
}

.stat-card strong {
  display: block;
  margin-top: 4px;
  font-size: 1.35rem;
  color: #0f172a;
}

.fab-create {
  --background: #2e66db;
  --box-shadow: 0 16px 30px rgba(46, 102, 219, 0.36);
}

.state-message {
  padding: 22px 16px;
  border-radius: 24px;
  text-align: center;
  background: rgba(255, 255, 255, 0.86);
}

.success-message {
  color: #067647;
}

.leave-type-modal {
  --background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
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
  color: #64748b;
}

.modal-header h2 {
  margin: 8px 0 0;
  font-size: 1.75rem;
  line-height: 1.15;
  font-weight: 850;
  color: #0f172a;
}

.modal-subtitle {
  margin: 8px 0 0;
  font-size: 0.92rem;
  line-height: 1.45;
  color: #64748b;
}

.detail-close-button {
  width: 48px;
  height: 48px;
  margin: 0;
  --color: #1d4ed8;
  --border-radius: 16px;
  --background: rgba(255, 255, 255, 0.95);
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
