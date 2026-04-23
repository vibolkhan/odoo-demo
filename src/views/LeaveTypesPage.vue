<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>All Leave Types</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="leave-types-page">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">All Leave Types</ion-title>
        </ion-toolbar>
      </ion-header>

      <section class="catalog-shell">
        <div class="catalog-toolbar">
          <ion-searchbar
            v-model="searchQuery"
            class="catalog-search"
            placeholder="Search leave types"
          />

          <ion-button class="create-button" @click="openCreateModal">
            Create
          </ion-button>
        </div>

        <p v-if="errorMessage" class="state-message error-message">
          {{ errorMessage }}
        </p>

        <p v-if="actionMessage" class="state-message success-message">
          {{ actionMessage }}
        </p>

        <div v-else-if="!isLoading && !leaveTypes.length" class="empty-state">
          No leave types found.
        </div>

        <ion-list v-else class="type-list">
          <ion-item
            v-for="leaveType in leaveTypes"
            :key="leaveType.id"
            lines="none"
            class="type-card"
          >
            <ion-label>
              <div class="type-card-header">
                <h3>{{ leaveType.name }}</h3>
                <div class="type-actions">
                  <ion-button
                    fill="clear"
                    size="small"
                    class="icon-action-button"
                    @click="openEditModal(leaveType)"
                  >
                    <ion-icon :icon="createOutline" aria-hidden="true" />
                  </ion-button>
                  <ion-button
                    fill="clear"
                    color="danger"
                    size="small"
                    class="icon-action-button"
                    @click="promptDelete(leaveType)"
                  >
                    <ion-icon :icon="trashOutline" aria-hidden="true" />
                  </ion-button>
                </div>
              </div>
            </ion-label>
          </ion-item>
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

      <ion-modal :is-open="isFormOpen" @didDismiss="closeFormModal">
        <ion-content class="leave-type-modal">
          <section class="modal-shell">
            <div class="modal-header">
              <div>
                <p class="modal-eyebrow">Leave Type</p>
                <h2>{{ editingLeaveTypeId ? "Edit Leave Type" : "Create Leave Type" }}</h2>
              </div>

              <ion-button fill="clear" @click="closeFormModal">Close</ion-button>
            </div>

            <p v-if="formErrorMessage" class="state-message error-message">
              {{ formErrorMessage }}
            </p>

            <div class="form-grid">
              <div class="field-block field-block-full">
                <label class="field-label" for="leave-type-name">Display name</label>
                <ion-item id="leave-type-name" lines="none" class="field">
                  <ion-input
                    v-model="formState.name"
                    placeholder="Annual Leave"
                  />
                </ion-item>
              </div>
            </div>

            <ion-button
              expand="block"
              class="save-button"
              :disabled="isSaving"
              @click="handleSave"
            >
              {{ isSaving ? "Saving..." : editingLeaveTypeId ? "Save Changes" : "Create Leave Type" }}
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

<script setup lang="ts">
import {
  IonAlert,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
} from "@ionic/vue";
import { createOutline, trashOutline } from "ionicons/icons";
import { onBeforeUnmount, ref, watch } from "vue";
import {
  createLeaveType,
  deleteLeaveType,
  fetchLeaveTypeCatalog,
  type LeaveTypeCatalogItem,
  updateLeaveType,
} from "@/utils/leaveTypes";

const pageSize = 20;
const leaveTypes = ref<LeaveTypeCatalogItem[]>([]);
const searchQuery = ref("");
const activeQuery = ref("");
const isLoading = ref(false);
const hasMore = ref(true);
const errorMessage = ref("");
const actionMessage = ref("");
const formErrorMessage = ref("");
const isFormOpen = ref(false);
const isSaving = ref(false);
const editingLeaveTypeId = ref<number | null>(null);
const isDeleteAlertOpen = ref(false);
const isDeleting = ref(false);
const pendingDeleteLeaveType = ref<LeaveTypeCatalogItem | null>(null);
const formState = ref({
  name: "",
});
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const loadLeaveTypes = async (reset = false) => {
  if (isLoading.value) {
    return;
  }

  isLoading.value = true;

  if (reset) {
    errorMessage.value = "";
    actionMessage.value = "";
    hasMore.value = true;
  }

  try {
    const result = await fetchLeaveTypeCatalog({
      query: activeQuery.value,
      limit: pageSize,
      offset: reset ? 0 : leaveTypes.value.length,
    });

    leaveTypes.value = reset ? result : [...leaveTypes.value, ...result];
    hasMore.value = result.length === pageSize;
  } catch (error) {
    if (reset) {
      leaveTypes.value = [];
    }

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

const openEditModal = (leaveType: LeaveTypeCatalogItem) => {
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
      await updateLeaveType(editingLeaveTypeId.value, formState.value);
      actionMessage.value = "Leave type updated successfully.";
    } else {
      await createLeaveType(formState.value);
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

const promptDelete = (leaveType: LeaveTypeCatalogItem) => {
  pendingDeleteLeaveType.value = leaveType;
  isDeleteAlertOpen.value = true;
};

const closeDeleteAlert = () => {
  isDeleteAlertOpen.value = false;
  pendingDeleteLeaveType.value = null;
};

const confirmDelete = async () => {
  if (!pendingDeleteLeaveType.value || isDeleting.value) {
    return;
  }

  isDeleting.value = true;
  errorMessage.value = "";
  actionMessage.value = "";

  try {
    await deleteLeaveType(pendingDeleteLeaveType.value.id);
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

const loadMore = async (event: CustomEvent) => {
  const infiniteScroll = event.target as HTMLIonInfiniteScrollElement | null;

  await loadLeaveTypes(false);
  await infiniteScroll?.complete();

  if (infiniteScroll) {
    infiniteScroll.disabled = !hasMore.value;
  }
};

const handleRefresh = async (event: CustomEvent) => {
  try {
    await loadLeaveTypes(true);
  } finally {
    (event.target as HTMLIonRefresherElement | null)?.complete();
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
  }, 250);
});

onBeforeUnmount(() => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
});
</script>

<style scoped>
.leave-types-page {
  --background: linear-gradient(180deg, #f5f8fc 0%, #eef4fb 100%);
  --padding-top: 24px;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-bottom: calc(env(safe-area-inset-bottom) + 96px);
}

.catalog-shell {
  display: grid;
  gap: 16px;
}

.catalog-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.catalog-search {
  padding: 0;
}

.create-button {
  margin: 0;
  --border-radius: 16px;
  min-height: 48px;
  font-weight: 700;
}

.type-list {
  background: transparent;
}

.type-card {
  --background: rgba(255, 255, 255, 0.96);
  --border-radius: 22px;
  --padding-start: 16px;
  --inner-padding-end: 16px;
  --inner-padding-top: 16px;
  --inner-padding-bottom: 16px;
  margin-bottom: 12px;
}

.type-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.type-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-action-button {
  --padding-start: 8px;
  --padding-end: 8px;
}

.icon-action-button ion-icon {
  font-size: 1.05rem;
}

.type-card h3 {
  margin: 0;
  font-size: 1.05rem;
  color: #152437;
}

.state-message,
.empty-state {
  padding: 24px 12px;
  text-align: center;
}

.error-message {
  color: #b64646;
}

.success-message {
  color: #18794e;
}

.empty-state {
  color: #6c7b8d;
}

.leave-type-modal {
  --padding-top: 20px;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-bottom: calc(env(safe-area-inset-bottom) + 24px);
}

.modal-shell {
  display: grid;
  gap: 18px;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.modal-eyebrow {
  margin: 0;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #7b8898;
}

.modal-header h2 {
  margin: 8px 0 0;
  font-size: 1.4rem;
  color: #152437;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field-block {
  display: grid;
  gap: 8px;
}

.field-block-full {
  grid-column: 1 / -1;
}

.field-label {
  font-size: 0.86rem;
  font-weight: 700;
  color: #44556c;
}

.field {
  --background: #f7f9fc;
  --border-radius: 18px;
  --padding-start: 14px;
  --inner-padding-end: 14px;
  --min-height: 56px;
}

.save-button {
  margin: 0;
  --border-radius: 18px;
  min-height: 52px;
  font-weight: 700;
}

@media (max-width: 640px) {
  .leave-types-page {
    --padding-top: 28px;
    --padding-end: 14px;
    --padding-start: 14px;
    --padding-bottom: calc(env(safe-area-inset-bottom) + 112px);
  }

  .catalog-toolbar,
  .form-grid,
  .type-card-header,
  .modal-header {
    grid-template-columns: 1fr;
    display: grid;
  }

  .type-actions {
    justify-content: flex-start;
  }
}
</style>
