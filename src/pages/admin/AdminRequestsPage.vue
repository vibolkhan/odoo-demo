<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Requests</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ion-refresh="refresh">
        <ion-refresher-content pulling-text="Pull to refresh requests" refreshing-text="Refreshing requests..." />
      </ion-refresher>

      <div class="app-page app-stack">
        <ion-segment v-model="segment" scrollable>
          <ion-segment-button value="leave">
            <ion-label>Leave</ion-label>
          </ion-segment-button>
          <ion-segment-button value="overtime">
            <ion-label>Overtime</ion-label>
          </ion-segment-button>
          <ion-segment-button value="correction">
            <ion-label>Correction</ion-label>
          </ion-segment-button>
        </ion-segment>

        <ion-searchbar
          v-model="search"
          :debounce="200"
          placeholder="Search employee, type, status, or date"
        />
        <ion-note color="medium" class="result-count">
          {{ current.length }} request{{ current.length === 1 ? "" : "s" }} shown
        </ion-note>

        <app-loading-card v-if="loading" />
        <ion-list v-else-if="current.length" class="request-list">
          <ion-item v-for="item in current" :key="item.id">
            <ion-label>
              <h2>{{ title(item) }}</h2>
              <p>{{ employeeName(item) }} - {{ item.reason || "No reason supplied" }}</p>
              <p>{{ requestTypeLabel }} - {{ item.status }}</p>
            </ion-label>
            <status-badge :status="item.status" />
            <div v-if="item.status === 'pending'" slot="end" class="request-actions">
              <ion-button color="success" fill="clear" @click="decide(item.id, 'approved')">Approve</ion-button>
              <ion-button color="danger" fill="clear" @click="openReject(item.id)">Reject</ion-button>
            </div>
          </ion-item>
        </ion-list>
        <app-empty-state v-else title="No requests" :message="emptyMessage" />
      </div>

      <ion-alert
        :is-open="rejectOpen"
        header="Reject request"
        :inputs="[{ name: 'reason', type: 'textarea', placeholder: 'Rejection reason' }]"
        :buttons="[
          { text: 'Cancel', role: 'cancel' },
          { text: 'Reject', role: 'confirm', handler: (data) => decide(rejectId, 'rejected', data.reason) },
        ]"
        @did-dismiss="rejectOpen = false"
      />
      <ion-toast v-model:is-open="toastOpen" :message="toastMessage" :color="toastColor" :duration="3500" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonAlert,
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToast,
  IonToolbar,
} from "@ionic/vue";
import { computed, onMounted, reactive, ref } from "vue";
import AppEmptyState from "@/components/AppEmptyState.vue";
import AppLoadingCard from "@/components/AppLoadingCard.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import {
  getCorrectionRequests,
  getLeaveRequests,
  getOvertimeRequests,
  setCorrectionRequestStatus,
  setLeaveRequestStatus,
  setOvertimeRequestStatus,
} from "@/services/requestService";
import { useToast } from "@/composables/useToast";

type Segment = "leave" | "overtime" | "correction";

const segment = ref<Segment>("leave");
const search = ref("");
const lists = reactive<Record<Segment, any[]>>({ leave: [], overtime: [], correction: [] });
const loading = ref(false);
const rejectOpen = ref(false);
const rejectId = ref(0);
const { showError, showToast, toastColor, toastMessage, toastOpen } = useToast();

const requestTypeLabel = computed(() => {
  if (segment.value === "leave") return "Leave";
  if (segment.value === "overtime") return "Overtime";
  return "Correction";
});

const current = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return lists[segment.value];

  return lists[segment.value].filter((item) => searchableText(item).includes(query));
});

const emptyMessage = computed(() =>
  search.value.trim()
    ? `No ${segment.value} requests match the current search.`
    : `No ${segment.value} requests found.`,
);

function title(item: any) {
  if (item.start_date) return `${item.start_date} to ${item.end_date}`;
  if (item.overtime_date) return item.overtime_date;
  if (item.requested_check_in) return item.requested_check_in.slice(0, 10);
  return `Correction #${item.id}`;
}

function employeeName(item: any) {
  const employee = item.employees;
  const name = [employee?.first_name, employee?.last_name].filter(Boolean).join(" ").trim();
  return name || employee?.employee_code || `Employee #${item.employee_id}`;
}

function searchableText(item: any) {
  return [
    requestTypeLabel.value,
    employeeName(item),
    item.status,
    item.reason,
    item.start_date,
    item.end_date,
    item.overtime_date,
    item.requested_check_in,
    item.requested_check_out,
    item.created_at,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

async function load() {
  loading.value = true;
  try {
    [lists.leave, lists.overtime, lists.correction] = await Promise.all([
      getLeaveRequests(),
      getOvertimeRequests(),
      getCorrectionRequests(),
    ]);
  } catch (error) {
    showError(error);
  } finally {
    loading.value = false;
  }
}

async function refresh(event: CustomEvent) {
  try {
    await load();
  } finally {
    (event.target as HTMLIonRefresherElement).complete();
  }
}

function openReject(id: number) {
  rejectId.value = id;
  rejectOpen.value = true;
}

async function decide(id: number, status: string, reason?: string) {
  try {
    if (segment.value === "leave") await setLeaveRequestStatus(id, status, reason);
    else if (segment.value === "overtime") await setOvertimeRequestStatus(id, status, reason);
    else await setCorrectionRequestStatus(id, status, reason);
    showToast(`Request ${status}.`);
    await load();
  } catch (error) {
    showError(error);
  }
}

onMounted(load);
</script>

<style scoped>
.request-list {
  background: transparent;
}

.result-count {
  margin-top: -8px;
}

.request-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-end;
}

@media (max-width: 480px) {
  .request-actions {
    align-items: flex-end;
    flex-direction: column;
  }
}
</style>
