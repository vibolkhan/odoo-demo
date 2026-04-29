<template>
  <ion-page>
    <ion-content
      :fullscreen="true"
      class="request-list-page"
    >
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <section class="catalog-shell">
        <div class="top-action-bar">
          <ion-button fill="clear" class="utility-button" @click="router.back()">
            <ion-icon :icon="chevronBack" size="large" />
          </ion-button>
          <ion-button fill="clear" class="utility-button">
            <ion-icon :icon="notificationsOutline" size="large" />
          </ion-button>
        </div>

        <div class="page-header">
          <div>
            <p class="eyebrow">Manager Actions</p>
            <h1>Approvals</h1>
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

        <RequestLst
          ref="requestListRef"
          :is-manager-mode="true"
          @summary-change="handleSummaryChange"
        />
      </section>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  onIonViewWillEnter,
} from "@ionic/vue";
import { chevronBack, notificationsOutline } from "ionicons/icons";
import { ref } from "vue";
import { useRouter } from "vue-router";
import RequestLst from "@/components/RequestLst.vue";

type RequestListInstance = InstanceType<typeof RequestLst>;

const router = useRouter();
const requestListRef = ref<RequestListInstance | null>(null);

const summary = ref({
  total: 0,
  pending: 0,
  review: 0,
});

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

onIonViewWillEnter(() => {
  void (async () => {
    await requestListRef.value?.loadLeaveRequests();
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
  justify-content: space-between;
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

@media (max-width: 640px) {
  .request-list-page {
    --padding-top: calc(env(safe-area-inset-top) + 18px);
  }
}
</style>
