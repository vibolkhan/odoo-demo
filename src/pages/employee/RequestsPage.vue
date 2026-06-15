<template>
  <ion-page><ion-header><ion-toolbar><ion-title>My Requests</ion-title></ion-toolbar></ion-header>
    <ion-content>
      <ion-segment v-model="segment"><ion-segment-button value="leave"><ion-label>Leave</ion-label></ion-segment-button><ion-segment-button value="overtime"><ion-label>Overtime</ion-label></ion-segment-button><ion-segment-button value="correction"><ion-label>Correction</ion-label></ion-segment-button></ion-segment>
      <div class="ion-padding"><ion-button expand="block" @click="modalOpen = true">Create {{ segment }} request</ion-button></div>
      <app-loading-card v-if="loading" />
      <ion-list v-else-if="current.length"><request-card v-for="item in current" :key="item.id" :status="item.status" :title="requestTitle(item)" :subtitle="item.reason || `Created ${item.created_at.slice(0, 10)}`" /></ion-list>
      <app-empty-state v-else title="No requests" :message="`You have no ${segment} requests yet.`" />
      <ion-modal :is-open="modalOpen" @did-dismiss="modalOpen = false"><ion-header><ion-toolbar><ion-title>New {{ segment }} request</ion-title><ion-button slot="end" fill="clear" @click="modalOpen = false">Close</ion-button></ion-toolbar></ion-header><ion-content class="ion-padding">
        <ion-list>
          <ion-item v-if="segment === 'leave'"><ion-input v-model="form.leaveTypeId" type="number" label="Leave type ID" label-placement="stacked" /></ion-item>
          <ion-item><ion-input v-model="form.start" :type="segment === 'correction' ? 'datetime-local' : 'date'" label="Start / requested check-in" label-placement="stacked" /></ion-item>
          <ion-item><ion-input v-model="form.end" :type="segment === 'correction' ? 'datetime-local' : segment === 'overtime' ? 'time' : 'date'" label="End / requested check-out" label-placement="stacked" /></ion-item>
          <ion-item><ion-textarea v-model="form.reason" label="Reason" label-placement="stacked" /></ion-item>
        </ion-list><ion-button expand="block" :disabled="saving" @click="create">Submit request</ion-button>
      </ion-content></ion-modal>
      <ion-toast v-model:is-open="toastOpen" :message="toastMessage" :color="toastColor" :duration="3500" />
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonModal, IonPage, IonSegment, IonSegmentButton, IonTextarea, IonTitle, IonToast, IonToolbar } from "@ionic/vue";
import { computed, onMounted, reactive, ref, watch } from "vue";
import AppEmptyState from "@/components/AppEmptyState.vue"; import AppLoadingCard from "@/components/AppLoadingCard.vue"; import RequestCard from "@/components/RequestCard.vue";
import { createCorrectionRequest, createLeaveRequest, createOvertimeRequest, getCorrectionRequests, getLeaveRequests, getOvertimeRequests } from "@/services/requestService";
import { useAuthStore } from "@/stores/auth"; import { useToast } from "@/composables/useToast";
const auth = useAuthStore(); const segment = ref("leave"); const loading = ref(false); const saving = ref(false); const modalOpen = ref(false);
const lists = reactive<Record<string, any[]>>({ leave: [], overtime: [], correction: [] }); const form = reactive({ leaveTypeId: 1, start: "", end: "", reason: "" });
const current = computed(() => lists[segment.value]); const { showError, showToast, toastColor, toastMessage, toastOpen } = useToast();
function requestTitle(item: any) { return item.start_date ? `${item.start_date} to ${item.end_date}` : item.overtime_date || `Correction #${item.id}`; }
async function load() { if (!auth.employee?.id) return; loading.value = true; try { lists.leave = await getLeaveRequests(auth.employee.id); lists.overtime = await getOvertimeRequests(auth.employee.id); lists.correction = await getCorrectionRequests(auth.employee.id); } catch (e) { showError(e); } finally { loading.value = false; } }
async function create() { if (!auth.employee?.id || !form.start || !form.reason) return showToast("Complete the required fields.", "warning"); saving.value = true; try {
  if (segment.value === "leave") await createLeaveRequest({ employee_id: auth.employee.id, leave_type_id: Number(form.leaveTypeId), start_date: form.start, end_date: form.end || form.start, total_days: 1, reason: form.reason });
  else if (segment.value === "overtime") await createOvertimeRequest({ employee_id: auth.employee.id, overtime_date: form.start, start_time: "17:00", end_time: form.end || "18:00", total_hours: 1, reason: form.reason });
  else await createCorrectionRequest({ employee_id: auth.employee.id, requested_check_in: form.start || null, requested_check_out: form.end || null, reason: form.reason });
  modalOpen.value = false; showToast("Request submitted."); await load();
} catch (e) { showError(e); } finally { saving.value = false; } }
watch(segment, () => { form.start = ""; form.end = ""; form.reason = ""; }); onMounted(load);
</script>
