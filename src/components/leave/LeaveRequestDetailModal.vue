<template>
  <ion-modal
    :is-open="isOpen"
    :breakpoints="[0, 1]"
    :initial-breakpoint="1"
    :backdrop-breakpoint="0"
    :expand-to-scroll="false"
    @didDismiss="$emit('close')"
  >
    <ion-content
      class="request-detail-modal"
      :scroll-y="true"
    >
      <section
        v-if="request && isEditing"
        class="request-detail-shell"
      >
        <div class="request-detail-header">
          <div>
            <p class="detail-eyebrow">Modify Request</p>
            <div class="detail-title-group">
              <h2>Edit Leave</h2>
            </div>
          </div>

          <ion-button
            fill="clear"
            class="detail-close-button app-modal-close-button"
            aria-label="Close request details"
            @click="$emit('close')"
          >
            <ion-icon
              :icon="close"
              aria-hidden="true"
            />
          </ion-button>
        </div>

        <RequestForm
          :initial-data="request"
          :navigate-after-submit="false"
          @submitted="handleEditSubmitted"
        />
      </section>

      <section
        v-else-if="
          request &&
          (request.state !== 'confirm' || request.needsAction || managerMode)
        "
        class="request-detail-shell"
      >
        <div class="request-detail-header">
          <div>
            <p class="detail-eyebrow">Leave Request</p>
            <div class="detail-title-group">
              <h2>{{ getLeaveTypeEnglishName(request.leaveType) }}</h2>
              <h3
                v-if="getLeaveTypeKhmerName(request.leaveType)"
                class="khmer-detail-title"
              >
                {{ getLeaveTypeKhmerName(request.leaveType) }}
              </h3>
            </div>
            <p class="detail-subtitle">
              {{ formatDateRange(request.dateFrom, request.dateTo) }}
            </p>
          </div>

          <ion-button
            fill="clear"
            class="detail-close-button app-modal-close-button"
            aria-label="Close request details"
            @click="$emit('close')"
          >
            <ion-icon
              :icon="close"
              aria-hidden="true"
              class="close-icon"
            />
          </ion-button>
        </div>

        <div class="detail-hero-card">
          <div class="detail-hero-main">
            <div
              class="type-tile detail-type-tile"
              :class="tileTone(request.leaveType)"
            >
              <ion-icon
                :icon="requestTypeIcon(request.leaveType)"
                aria-hidden="true"
              />
            </div>

            <div class="detail-hero-copy">
              <span
                class="status-pill"
                :class="badgeClass(request.state)"
              >
                {{ formatStateLabel(request.state) }}
              </span>

              <p class="detail-duration">
                {{ request.durationDisplay || 'Duration not provided' }}
              </p>
            </div>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-card">
            <span>Employee</span>
            <strong>{{
              request.employeeName || fallbackEmployeeName || '-'
            }}</strong>
          </div>

          <div class="detail-card">
            <span>Request ID</span>
            <strong>#{{ request.id }}</strong>
          </div>
        </div>

        <div class="detail-section-card">
          <span class="detail-section-label">Schedule</span>
          <h3>{{ formatDateRange(request.dateFrom, request.dateTo) }}</h3>
          <p>
            {{ request.durationDisplay || 'No duration summary available.' }}
          </p>
        </div>

        <div class="detail-section-card">
          <span class="detail-section-label">Reason</span>
          <h3>Notes</h3>
          <p>
            {{
              request.reason || 'No reason was provided for this leave request.'
            }}
          </p>
        </div>

        <!-- Manager mode: show Approve/Refuse for pending requests -->
        <div
          v-if="
            managerMode &&
            (request.state === 'confirm' || request.state === 'validate1')
          "
          class="detail-actions-tray"
        >
          <ion-button
            expand="block"
            fill="outline"
            color="danger"
            class="action-button reject-button"
            :disabled="isProcessing"
            @click="handleRefuse"
          >
            <ion-icon
              slot="start"
              :icon="closeCircleOutline"
            />
            {{ isRefusing ? 'Refusing...' : 'Refuse' }}
          </ion-button>

          <ion-button
            expand="block"
            fill="solid"
            color="primary"
            class="action-button approve-button"
            :disabled="isProcessing"
            @click="handleApprove"
          >
            <ion-icon
              slot="start"
              :icon="checkmarkCircleOutline"
            />
            {{ isApproving ? 'Approving...' : 'Approve' }}
          </ion-button>
        </div>

        <!-- Employee mode: own pending requests can be edited, not approved/refused. -->
        <div
          v-else-if="!managerMode && request.state === 'confirm'"
          class="detail-actions-tray"
        >
          <ion-button
            expand="block"
            fill="solid"
            color="primary"
            class="action-button edit-button"
            @click="isEditing = true"
          >
            <ion-icon
              slot="start"
              :icon="createOutline"
            />
            Edit Request
          </ion-button>
        </div>
      </section>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { IonButton, IonContent, IonIcon, IonModal } from '@ionic/vue'
import {
  checkmarkCircleOutline,
  close,
  closeCircleOutline,
  createOutline,
} from 'ionicons/icons'
import { ref, computed, watch } from 'vue'
import { toastController } from '@ionic/vue'
import RequestForm from '@/components/leave/RequestForm.vue'
import { useTimeoffStore } from '@/stores/timeoff.store'
import {
  formatLeaveStateLabel as formatStateLabel,
  getLeaveStatusClass as badgeClass,
  getLeaveTypeEnglishName,
  getLeaveTypeKhmerName,
  leaveTypeTone as tileTone,
  requestTypeIcon,
} from '@/utils/leave'

const props = defineProps({
  isOpen: Boolean,
  request: Object,
  fallbackEmployeeName: String,
  managerMode: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'updated'])
const timeoffStore = useTimeoffStore()

const isApproving = ref(false)
const isRefusing = ref(false)
const isEditing = ref(false)
const isProcessing = computed(() => isApproving.value || isRefusing.value)

watch(
  () => props.isOpen,
  (val) => {
    if (!val) {
      isEditing.value = false
    } else if (
      !props.managerMode &&
      props.request?.state === 'confirm' &&
      !props.request?.needsAction
    ) {
      // Only auto-open edit form in employee mode for their own pending requests
      isEditing.value = true
    }
  },
)

const showToast = async (message, color) => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    color,
    position: 'top',
    buttons: [{ text: 'OK', role: 'cancel' }],
  })
  await toast.present()
}

const handleEditSubmitted = () => {
  isEditing.value = false
  emit('updated')
  emit('close')
}

const handleApprove = async () => {
  if (!props.request || isProcessing.value) return

  isApproving.value = true
  try {
    await timeoffStore.approveLeaveRequest(props.request.id)
    await showToast('Leave request approved successfully.', 'success')
    emit('updated')
    emit('close')
  } catch (error) {
    await showToast(
      error instanceof Error ? error.message : 'Failed to approve request.',
      'danger',
    )
  } finally {
    isApproving.value = false
  }
}

const handleRefuse = async () => {
  if (!props.request || isProcessing.value) return

  isRefusing.value = true
  try {
    await timeoffStore.refuseLeaveRequest(props.request.id)
    await showToast('Leave request refused.', 'success')
    emit('updated')
    emit('close')
  } catch (error) {
    await showToast(
      error instanceof Error ? error.message : 'Failed to refuse request.',
      'danger',
    )
  } finally {
    isRefusing.value = false
  }
}

const parseRequestDate = (value) => {
  if (!value) return null
  const normalizedValue = value.includes(' ') ? value.replace(' ', 'T') : value
  const date = new Date(normalizedValue)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDate = (value) => {
  const date = parseRequestDate(value)
  if (!date) return value || '-'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const formatDateRange = (start, end) => {
  const startLabel = formatDate(start)
  const endLabel = formatDate(end)
  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`
}
</script>

<style scoped>
.request-detail-modal {
  --background: var(--app-bg);
  --padding-top: 22px;
  --padding-start: 18px;
  --padding-end: 18px;
  --padding-bottom: calc(env(safe-area-inset-bottom) + 28px);
}

.request-detail-shell {
  display: grid;
  gap: 18px;
}

.request-detail-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.detail-eyebrow {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.detail-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.request-detail-header h2 {
  margin: 8px 0 0;
  font-size: 1.75rem;
  line-height: 1.15;
  font-weight: 850;
  color: var(--text-primary);
}

.khmer-detail-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.detail-subtitle {
  margin: 8px 0 0;
  font-size: 0.92rem;
  line-height: 1.45;
  color: var(--text-secondary);
}

.detail-hero-card,
.detail-section-card {
  padding: 18px;
  border-radius: 24px;
  background: var(--card-bg);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.04);
}

.detail-hero-main {
  display: flex;
  gap: 14px;
  align-items: center;
}

.type-tile {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 18px;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.detail-type-tile {
  width: 64px;
  height: 64px;
  border-radius: 20px;
}

.tone-blue {
  background: rgba(59, 130, 246, 0.18);
  color: #2563eb;
}
.tone-coral {
  background: rgba(251, 113, 133, 0.18);
  color: #e11d48;
}
.tone-lilac {
  background: rgba(129, 140, 248, 0.18);
  color: #4f46e5;
}
.tone-sand {
  background: rgba(245, 158, 11, 0.18);
  color: #b45309;
}

.detail-duration {
  margin: 8px 0 0;
  font-size: 0.92rem;
  color: var(--text-secondary);
}

.detail-attention {
  margin: 10px 0 0;
  color: #c2410c;
  font-weight: 700;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-card {
  padding: 16px;
  border-radius: 20px;
  background: var(--card-bg);
}

.detail-card span,
.detail-section-label {
  display: block;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.detail-card strong {
  display: block;
  margin-top: 8px;
  font-size: 1rem;
  line-height: 1.4;
  color: var(--text-primary);
}

.detail-section-card h3 {
  margin: 12px 0 6px;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
}

.detail-section-card p {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.status-pending {
  background: rgba(245, 158, 11, 0.16);
  color: #b45309;
}
.status-review {
  background: rgba(59, 130, 246, 0.16);
  color: #2563eb;
}
.status-approved {
  background: rgba(16, 185, 129, 0.16);
  color: #047857;
}
.status-refused {
  background: rgba(239, 68, 68, 0.16);
  color: #b91c1c;
}

@media (max-width: 640px) {
  .request-detail-header h2 {
    font-size: 1.55rem;
  }
  .detail-subtitle {
    font-size: 0.86rem;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

.detail-actions-tray {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 10px;
  padding: 16px;
  background: var(--card-bg);
  border-radius: 24px;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.03);
}

.action-button {
  margin: 0;
  --border-radius: 14px;
  font-weight: 700;
  height: 48px;
}

.approve-button {
  --background: #2e66db;
}
.reject-button {
  --color: #dc2626;
  --border-color: #dc2626;
}
</style>
