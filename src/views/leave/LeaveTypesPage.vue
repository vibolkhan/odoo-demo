<template>
  <ion-page>
    <ion-content :fullscreen="true" class="leave-types-page">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <section class="catalog-shell">
        <div class="top-action-bar">
          <ion-button fill="clear" class="utility-button notification-button">
            <ion-icon :icon="notificationsOutline" size="large" />
          </ion-button>
        </div>

        <div class="page-header">
          <div>
            <p class="eyebrow">Leave Management</p>
            <h1>Leave Types</h1>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <span>Total</span>
            <strong>{{ leaveTypes.length }}</strong>
          </div>

          <div class="stat-card">
            <span>Core</span>
            <strong>{{ coreCount }}</strong>
          </div>

          <div class="stat-card">
            <span>Special</span>
            <strong>{{ specialCount }}</strong>
          </div>
        </div>

        <ion-searchbar
          v-model="searchQuery"
          class="catalog-search"
          placeholder="Search leave types..."
          show-clear-button="focus"
          :animated="true"
        />

        <div class="filter-tabs">
          <button
            :class="{ active: activeFilter === 'all' }"
            @click="activeFilter = 'all'"
          >
            All
          </button>

          <button
            :class="{ active: activeFilter === 'core' }"
            @click="activeFilter = 'core'"
          >
            Core
          </button>

          <button
            :class="{ active: activeFilter === 'special' }"
            @click="activeFilter = 'special'"
          >
            Special
          </button>
        </div>

        <p v-if="errorMessage" class="state-message error-message">
          {{ errorMessage }}
        </p>

        <p v-if="actionMessage" class="state-message success-message">
          {{ actionMessage }}
        </p>

        <div v-if="showSkeleton && !leaveTypes.length" class="type-list">
          <div v-for="i in 5" :key="i" class="type-card">
            <div class="type-card-shell">
              <div class="type-card-main">
                <AppSkeleton width="60px" height="22px" margin="0 0 8px" />
                <AppSkeleton width="180px" height="20px" />
                <AppSkeleton width="120px" height="14px" margin="6px 0 0" />
              </div>
            </div>
          </div>
        </div>

        <div
          v-else-if="!isLoading && !filteredLeaveTypes.length"
          class="empty-state"
        >
          <div class="empty-icon">🌿</div>
          <h3>No leave types found</h3>
          <p v-if="searchQuery">No result for "{{ searchQuery }}"</p>
          <p v-else>Create your first leave type to get started.</p>

          <ion-button class="empty-button" @click="openCreateModal">
            Add Leave Type
          </ion-button>
        </div>

        <ion-list v-else class="type-list">
          <ion-item-sliding
            v-for="leaveType in filteredLeaveTypes"
            :key="leaveType.id"
          >
            <ion-item lines="none" class="type-card">
              <div class="type-card-shell">
                <div class="type-card-main">
                  <div class="badge-row">
                    <span
                      class="type-badge"
                      :class="getLeaveTypeCategory(leaveType.name)"
                    >
                      {{ getLeaveTypeCategory(leaveType.name) }}
                    </span>
                  </div>

                  <h3>{{ getEnglishName(leaveType.name) }}</h3>

                  <p v-if="getKhmerName(leaveType.name)">
                    {{ getKhmerName(leaveType.name) }}
                  </p>
                </div>

                <div class="type-actions">
                  <ion-button
                    fill="clear"
                    size="small"
                    class="edit-button"
                    @click="openEditModal(leaveType)"
                  >
                    <ion-icon :icon="pencil" />
                  </ion-button>

                  <ion-button
                    fill="clear"
                    size="small"
                    class="delete-button"
                    @click="promptDelete(leaveType)"
                  >
                    <ion-icon :icon="trashOutline" />
                  </ion-button>
                </div>
              </div>
            </ion-item>

            <ion-item-options side="end">
              <ion-item-option
                color="primary"
                @click="openEditModal(leaveType)"
              >
                Edit
              </ion-item-option>

              <ion-item-option color="danger" @click="promptDelete(leaveType)">
                Delete
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        </ion-list>

        <ion-infinite-scroll
          :disabled="!hasMore || isLoading"
          @ionInfinite="loadMore"
        >
          <ion-infinite-scroll-content
            loading-spinner="bubbles"
            loading-text="Loading more leave types..."
          />
        </ion-infinite-scroll>
      </section>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button class="fab-create" @click="openCreateModal">
          <ion-icon :icon="addOutline" size="large" />
        </ion-fab-button>
      </ion-fab>

      <ion-modal
        :is-open="isFormOpen"
        :breakpoints="[0, 0.65, 0.92]"
        :initial-breakpoint="0.65"
        handle="true"
        @didDismiss="closeFormModal"
      >
        <ion-content class="leave-type-modal">
          <section class="modal-shell">
            <div class="modal-header">
              <div>
                <p class="modal-eyebrow">Leave Type</p>
                <h2>
                  {{
                    editingLeaveTypeId ? "Edit Leave Type" : "Create Leave Type"
                  }}
                </h2>
                <p class="modal-subtitle">
                  Add the English and Khmer display name for this leave type.
                </p>
              </div>

              <ion-button
                fill="clear"
                class="detail-close-button"
                aria-label="Close leave type form"
                @click="closeFormModal"
              >
                <ion-icon
                  :icon="close"
                  size="large"
                  aria-hidden="true"
                  class="close-icon"
                />
              </ion-button>
            </div>

            <p v-if="formErrorMessage" class="state-message error-message">
              {{ formErrorMessage }}
            </p>

            <div class="form-card">
              <div class="field-block">
                <label class="field-label" for="leave-type-name">
                  Display Name
                </label>

                <ion-item id="leave-type-name" lines="none" class="field">
                  <ion-input
                    v-model="formState.name"
                    placeholder="Annual Leave - សម្រាកប្រចាំឆ្នាំ"
                    clear-input
                  />
                </ion-item>

                <p class="field-hint">
                  Example: Annual Leave - សម្រាកប្រចាំឆ្នាំ
                </p>
              </div>
            </div>

            <ion-button
              expand="block"
              class="save-button"
              :disabled="isSaving || !formState.name.trim()"
              @click="handleSave"
            >
              {{
                isSaving
                  ? "Saving..."
                  : editingLeaveTypeId
                    ? "Save Changes"
                    : "Create Leave Type"
              }}
            </ion-button>
          </section>
        </ion-content>
      </ion-modal>

      <ion-alert
        :is-open="isDeleteAlertOpen"
        header="Delete leave type?"
        :message="
          pendingDeleteLeaveType
            ? `This will permanently remove ${pendingDeleteLeaveType.name}.`
            : ''
        "
        :buttons="deleteAlertButtons"
        @didDismiss="closeDeleteAlert"
      />
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonAlert,
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonList,
  IonModal,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  onIonViewWillEnter,
} from "@ionic/vue";
import AppSkeleton from "@/components/common/AppSkeleton.vue";

import {
  addOutline,
  close,
  notificationsOutline,
  pencil,
  trashOutline,
} from "ionicons/icons";

import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useTimeoffStore } from "@/stores/timeoff.store";
import { useMinimumSkeleton } from "@/composables/useMinimumSkeleton";

const pageSize = 20;
const timeoffStore = useTimeoffStore();

const leaveTypes = ref([]);
const searchQuery = ref("");
const activeQuery = ref("");
const activeFilter = ref("all");

const isLoading = ref(false);
const hasMore = ref(true);
const { showSkeleton } = useMinimumSkeleton(isLoading, 1000);

const errorMessage = ref("");
const actionMessage = ref("");
const formErrorMessage = ref("");

const isFormOpen = ref(false);
const isSaving = ref(false);
const editingLeaveTypeId = ref(null);

const isDeleteAlertOpen = ref(false);
const isDeleting = ref(false);
const pendingDeleteLeaveType = ref(null);

const formState = ref({
  name: "",
});

let searchTimer = null;

const getEnglishName = (name) => {
  return name.split("-")[0];
};

const getKhmerName = (name) => {
  return name.includes(" - ") ? name.split(" - ").slice(1).join(" - ") : "";
};

const getLeaveTypeCategory = (name) => {
  const n = name.toLowerCase();

  if (n.includes("annual") || n.includes("sick") || n.includes("unpaid")) {
    return "core";
  }

  return "special";
};

const coreCount = computed(() => {
  return leaveTypes.value.filter(
    (item) => getLeaveTypeCategory(item.name) === "core",
  ).length;
});

const specialCount = computed(() => {
  return leaveTypes.value.filter(
    (item) => getLeaveTypeCategory(item.name) === "special",
  ).length;
});

const filteredLeaveTypes = computed(() => {
  if (activeFilter.value === "all") {
    return leaveTypes.value;
  }

  return leaveTypes.value.filter((leaveType) => {
    return getLeaveTypeCategory(leaveType.name) === activeFilter.value;
  });
});

const loadLeaveTypes = async (reset = false) => {
  if (isLoading.value) return;

  isLoading.value = true;

  if (reset) {
    errorMessage.value = "";
    actionMessage.value = "";
    hasMore.value = true;
  }

  try {
    const result = await timeoffStore.fetchLeaveTypeCatalog(
      {
        query: activeQuery.value,
        limit: pageSize,
        offset: reset ? 0 : leaveTypes.value.length,
      },
      reset,
    );

    leaveTypes.value = reset ? result : [...leaveTypes.value, ...result];
    hasMore.value = result.length === pageSize;
  } catch (error) {
    if (reset) leaveTypes.value = [];

    hasMore.value = false;
    errorMessage.value =
      error instanceof Error ? error.message : "Unable to load leave types.";
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  formState.value = {
    name: "",
  };

  editingLeaveTypeId.value = null;
  formErrorMessage.value = "";
};

const openCreateModal = () => {
  resetForm();
  isFormOpen.value = true;
};

const openEditModal = (leaveType) => {
  formState.value = {
    name: leaveType.name,
  };

  editingLeaveTypeId.value = leaveType.id;
  formErrorMessage.value = "";
  isFormOpen.value = true;
};

const closeFormModal = () => {
  isFormOpen.value = false;
  resetForm();
};

const handleSave = async () => {
  formErrorMessage.value = "";
  actionMessage.value = "";

  if (!formState.value.name.trim()) {
    formErrorMessage.value = "Please enter a display name.";
    return;
  }

  isSaving.value = true;

  try {
    if (editingLeaveTypeId.value) {
      await timeoffStore.updateLeaveType(editingLeaveTypeId.value, formState.value);
      actionMessage.value = "Leave type updated successfully.";
    } else {
      await timeoffStore.createLeaveType(formState.value);
      actionMessage.value = "Leave type created successfully.";
    }

    closeFormModal();
    await loadLeaveTypes(true);
  } catch (error) {
    formErrorMessage.value =
      error instanceof Error ? error.message : "Unable to save leave type.";
  } finally {
    isSaving.value = false;
  }
};

const promptDelete = (leaveType) => {
  pendingDeleteLeaveType.value = leaveType;
  isDeleteAlertOpen.value = true;
};

const closeDeleteAlert = () => {
  isDeleteAlertOpen.value = false;
  pendingDeleteLeaveType.value = null;
};

const confirmDelete = async () => {
  if (!pendingDeleteLeaveType.value || isDeleting.value) return;

  isDeleting.value = true;
  errorMessage.value = "";
  actionMessage.value = "";

  try {
    await timeoffStore.deleteLeaveType(pendingDeleteLeaveType.value.id);
    actionMessage.value = "Leave type deleted successfully.";
    closeDeleteAlert();
    await loadLeaveTypes(true);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Unable to delete leave type.";
    closeDeleteAlert();
  } finally {
    isDeleting.value = false;
  }
};

const deleteAlertButtons = [
  {
    text: "Cancel",
    role: "cancel",
  },
  {
    text: "Delete",
    role: "destructive",
    handler: () => {
      void confirmDelete();
      return false;
    },
  },
];

const loadMore = async (event) => {
  const infiniteScroll = event.target;

  await loadLeaveTypes(false);
  await infiniteScroll?.complete();

  if (infiniteScroll) {
    infiniteScroll.disabled = !hasMore.value;
  }
};

const handleRefresh = async (event) => {
  try {
    await loadLeaveTypes(true);
  } finally {
    event.target?.complete();
  }
};

onIonViewWillEnter(() => {
  if (!leaveTypes.value.length) {
    void loadLeaveTypes(true);
  }
});

watch(searchQuery, (value) => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }

  searchTimer = setTimeout(() => {
    activeQuery.value = value.trim();
    void loadLeaveTypes(true);
  }, 300);
});

onBeforeUnmount(() => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
});
</script>

<style scoped>
.leave-types-page {
  --background: var(--app-bg);
  background-image: radial-gradient(circle at top left, rgba(46, 102, 219, 0.16), transparent 34%);
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stat-card {
  padding: 14px 12px;
  border-radius: 20px;
  background: var(--card-bg);
  box-shadow: 0 8px 22px rgba(55, 75, 105, 0.08);
}

.stat-card span {
  display: block;
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-weight: 650;
}

.stat-card strong {
  display: block;
  margin-top: 4px;
  font-size: 1.35rem;
  color: var(--text-primary);
}

.catalog-search {
  padding: 0;
}

.catalog-search::part(container) {
  min-height: 54px;
  border-radius: 20px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  box-shadow: 0 8px 20px rgba(56, 76, 106, 0.08);
}

.catalog-search:focus-within::part(container) {
  border-color: #2e66db;
  box-shadow: 0 0 0 3px rgba(46, 102, 219, 0.14);
}

.filter-tabs {
  display: flex;
  gap: 8px;
  padding: 4px;
  border-radius: 18px;
  background: var(--border-color);
}

.filter-tabs button {
  flex: 1;
  height: 40px;
  border: 0;
  border-radius: 14px;
  background: transparent;
  color: var(--text-secondary);
  font-weight: 700;
}

.filter-tabs button.active {
  background: #2e66db;
  color: white;
  box-shadow: 0 10px 18px rgba(46, 102, 219, 0.24);
}

.type-list {
  display: grid;
  gap: 14px;
  background: transparent;
  padding: 0;
}

.type-card {
  --background: var(--card-bg);
  --border-radius: 26px;
  --padding-start: 0;
  --inner-padding-end: 0;
  --inner-padding-top: 0;
  --inner-padding-bottom: 0;
  box-shadow: 0 10px 26px rgba(55, 75, 105, 0.08);
  overflow: hidden;
}

.type-card:active {
  transform: scale(0.985);
}

.type-card-shell {
  display: flex;
  width: 100%;
  padding: 18px 14px 18px 20px;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.type-card-main {
  min-width: 0;
  flex: 1;
}

.badge-row {
  margin-bottom: 8px;
}

.type-badge {
  display: inline-flex;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: capitalize;
}

.type-badge.core {
  background: rgba(46, 102, 219, 0.1);
  color: #1d4ed8;
}

.type-badge.special {
  background: rgba(245, 158, 11, 0.1);
  color: #b45309;
}

.type-card h3 {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 800;
  color: var(--text-primary);
}

.type-card p {
  margin: 6px 0 0;
  font-size: 1rem;
  line-height: 1.45;
  color: var(--text-secondary);
}

.type-actions {
  display: flex;
  flex-shrink: 0;
}

.type-actions ion-button {
  width: 40px;
  height: 40px;
  margin: 0;
  --padding-start: 0;
  --padding-end: 0;
}

.edit-button {
  --color: #0969da;
}

.delete-button {
  --color: #c81e3a;
}

.fab-create {
  --background: #2e66db;
  --box-shadow: 0 16px 30px rgba(46, 102, 219, 0.36);
}

.state-message,
.empty-state {
  padding: 22px 16px;
  border-radius: 24px;
  text-align: center;
  background: var(--card-bg);
}

.error-message {
  color: #b42318;
}

.success-message {
  color: #067647;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.empty-state h3 {
  margin: 0;
  font-size: 1.05rem;
  color: var(--text-primary);
}

.empty-state p {
  margin: 8px 0 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.empty-button {
  margin-top: 16px;
  --border-radius: 14px;
  font-weight: 700;
}

/* Modal Styles */
.modal-shell {
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: var(--app-bg);
  min-height: 100%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.modal-eyebrow {
  margin: 0 0 6px;
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--ion-color-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 850;
  color: var(--text-primary);
}

.modal-subtitle {
  margin: 8px 0 0;
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.detail-close-button {
  margin: -10px -10px 0 0;
  --color: var(--text-secondary);
}

.form-card {
  background: var(--card-bg);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 0.9rem;
  font-weight: 750;
  color: var(--text-primary);
  margin-left: 4px;
}

.field {
  --background: var(--app-bg);
  --border-radius: 14px;
  --padding-start: 16px;
  --padding-end: 16px;
  margin: 4px 0;
}

.field-hint {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 4px 0 0 4px;
  font-weight: 500;
}

.save-button {
  margin-top: auto;
  height: 56px;
  --border-radius: 16px;
  --background: #2e66db;
  font-weight: 800;
  font-size: 1.1rem;
  box-shadow: 0 12px 24px rgba(46, 102, 219, 0.2);
}
</style>
