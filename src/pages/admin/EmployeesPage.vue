<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Employees</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="openCreate">Add</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ion-refresh="refresh">
        <ion-refresher-content pulling-text="Pull to refresh employees" refreshing-text="Refreshing employees..." />
      </ion-refresher>

      <div class="app-filter-shell">
        <ion-searchbar v-model="search" placeholder="Search name, code, department, or position" />
        <ion-select v-model="status" label="Status" interface="popover" fill="outline">
          <ion-select-option value="">All</ion-select-option>
          <ion-select-option value="active">Active</ion-select-option>
          <ion-select-option value="inactive">Inactive</ion-select-option>
        </ion-select>
      </div>

      <app-loading-card v-if="loading" />
      <ion-list v-else-if="filtered.length" class="app-list">
        <ion-item v-for="employee in filtered" :key="employee.id">
          <ion-label>
            <h2>{{ employee.first_name }} {{ employee.last_name }}</h2>
            <p>{{ employee.employee_code }} - {{ employee.departments?.name || "No department" }}</p>
            <p v-if="employee.positions?.title">{{ employee.positions.title }}</p>
          </ion-label>
          <status-badge :status="employee.status" />
          <ion-button slot="end" fill="clear" @click="toggle(employee)">
            {{ employee.status === "active" ? "Deactivate" : "Activate" }}
          </ion-button>
        </ion-item>
      </ion-list>
      <app-empty-state v-else title="No employees" message="No employees match the current filters." />

      <ion-modal :is-open="modalOpen" @did-dismiss="closeCreate">
        <ion-header>
          <ion-toolbar>
            <ion-title>New employee</ion-title>
            <ion-buttons slot="end">
              <ion-button fill="clear" @click="closeCreate">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div class="app-form-shell">
            <ion-text color="medium">
              <p class="form-help">Fields marked with * are required.</p>
            </ion-text>
            <ion-list>
              <ion-item>
                <ion-input v-model.trim="form.employee_code" label="Employee code *" label-placement="stacked" required />
              </ion-item>
              <ion-note v-if="errors.employee_code" color="danger" class="field-error">{{ errors.employee_code }}</ion-note>

              <ion-item>
                <ion-input v-model.trim="form.first_name" label="First name *" label-placement="stacked" required />
              </ion-item>
              <ion-note v-if="errors.first_name" color="danger" class="field-error">{{ errors.first_name }}</ion-note>

              <ion-item>
                <ion-input v-model.trim="form.last_name" label="Last name *" label-placement="stacked" required />
              </ion-item>
              <ion-note v-if="errors.last_name" color="danger" class="field-error">{{ errors.last_name }}</ion-note>

              <ion-item>
                <ion-input v-model.trim="form.email" type="email" label="Email" label-placement="stacked" />
              </ion-item>
              <ion-note v-if="errors.email" color="danger" class="field-error">{{ errors.email }}</ion-note>

              <ion-item>
                <ion-input v-model.trim="form.phone" type="tel" label="Phone" label-placement="stacked" />
              </ion-item>

              <ion-item>
                <ion-select v-model="form.department_id" label="Department *" label-placement="stacked" interface="popover" required>
                  <ion-select-option v-for="department in departments" :key="department.id" :value="department.id">
                    {{ department.name }}
                  </ion-select-option>
                </ion-select>
              </ion-item>
              <ion-note v-if="errors.department_id" color="danger" class="field-error">{{ errors.department_id }}</ion-note>

              <ion-item>
                <ion-select v-model="form.position_id" label="Position *" label-placement="stacked" interface="popover" required>
                  <ion-select-option v-for="position in positions" :key="position.id" :value="position.id">
                    {{ position.title }}
                  </ion-select-option>
                </ion-select>
              </ion-item>
              <ion-note v-if="errors.position_id" color="danger" class="field-error">{{ errors.position_id }}</ion-note>

              <ion-item>
                <ion-select v-model="form.role_id" label="Role" label-placement="stacked" interface="popover">
                  <ion-select-option :value="null">No app account yet</ion-select-option>
                  <ion-select-option v-for="role in roles" :key="role.id" :value="role.id">
                    {{ role.name }}
                  </ion-select-option>
                </ion-select>
              </ion-item>
              <ion-note color="medium" class="field-hint">
                Role is used when an app user is created or linked for this employee.
              </ion-note>

              <ion-item>
                <ion-input v-model="form.hire_date" type="date" label="Hire date *" label-placement="stacked" required />
              </ion-item>
              <ion-note v-if="errors.hire_date" color="danger" class="field-error">{{ errors.hire_date }}</ion-note>
            </ion-list>

            <ion-button expand="block" :disabled="saving" @click="save">
              {{ saving ? "Creating..." : "Create employee" }}
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>

      <ion-toast v-model:is-open="toastOpen" :message="toastMessage" :color="toastColor" :duration="3500" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
  onIonViewWillEnter,
} from "@ionic/vue";
import { computed, reactive, ref } from "vue";
import AppEmptyState from "@/components/AppEmptyState.vue";
import AppLoadingCard from "@/components/AppLoadingCard.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { createEmployee, getEmployees, updateEmployee } from "@/services/employeeService";
import { getEmployeeFormOptions } from "@/services/settingsService";
import { useToast } from "@/composables/useToast";

type Employee = Awaited<ReturnType<typeof getEmployees>>[number];
type FormOptions = Awaited<ReturnType<typeof getEmployeeFormOptions>>;
type EmployeeForm = {
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department_id: number | null;
  position_id: number | null;
  role_id: number | null;
  hire_date: string;
};

type EmployeeFormErrors = Partial<Record<keyof EmployeeForm, string>>;

const employees = ref<Employee[]>([]);
const departments = ref<FormOptions["departments"]>([]);
const positions = ref<FormOptions["positions"]>([]);
const roles = ref<FormOptions["roles"]>([]);
const search = ref("");
const status = ref("");
const loading = ref(false);
const saving = ref(false);
const modalOpen = ref(false);
const form = reactive<EmployeeForm>(createEmptyForm());
const errors = reactive<EmployeeFormErrors>({});
const { showError, showToast, toastColor, toastMessage, toastOpen } = useToast();

const validEmployees = computed(() =>
  employees.value.filter((employee) => {
    const hasIdentity = Boolean(employee.id && (employee.employee_code || employee.first_name || employee.last_name));
    const hasName = Boolean(employee.first_name?.trim() || employee.last_name?.trim());
    return hasIdentity && hasName;
  }),
);

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase();

  return validEmployees.value.filter((employee) => {
    const text = [
      employee.first_name,
      employee.last_name,
      employee.employee_code,
      employee.departments?.name,
      employee.positions?.title,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (!status.value || employee.status === status.value) && (!query || text.includes(query));
  });
});

function createEmptyForm(): EmployeeForm {
  return {
    employee_code: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department_id: null,
    position_id: null,
    role_id: null,
    hire_date: new Date().toISOString().slice(0, 10),
  };
}

function resetForm() {
  Object.assign(form, createEmptyForm());
  clearErrors();
}

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key as keyof EmployeeForm]);
}

function validateForm() {
  clearErrors();

  if (!form.employee_code) errors.employee_code = "Employee code is required.";
  if (!form.first_name) errors.first_name = "First name is required.";
  if (!form.last_name) errors.last_name = "Last name is required.";
  if (!form.department_id) errors.department_id = "Select a department.";
  if (!form.position_id) errors.position_id = "Select a position.";
  if (!form.hire_date) errors.hire_date = "Hire date is required.";
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = "Enter a valid email address.";

  return !Object.keys(errors).length;
}

async function load() {
  loading.value = true;
  try {
    const [employeeRows, options] = await Promise.all([getEmployees(), getEmployeeFormOptions()]);
    employees.value = employeeRows;
    departments.value = options.departments;
    positions.value = options.positions;
    roles.value = options.roles;
  } catch (error) {
    showError(error);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  resetForm();
  modalOpen.value = true;
}

function closeCreate() {
  modalOpen.value = false;
  resetForm();
}

async function save() {
  if (!validateForm()) return;

  saving.value = true;
  try {
    await createEmployee({
      employee_code: form.employee_code,
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email || null,
      phone: form.phone || null,
      department_id: form.department_id,
      position_id: form.position_id,
      hire_date: form.hire_date,
    });
    modalOpen.value = false;
    resetForm();
    showToast("Employee created.");
    await load();
  } catch (error) {
    showError(error, "Unable to create employee.");
  } finally {
    saving.value = false;
  }
}

async function refresh(event: CustomEvent) {
  try {
    await load();
  } finally {
    (event.target as HTMLIonRefresherElement).complete();
  }
}

async function toggle(employee: Employee) {
  try {
    await updateEmployee(employee.id, { status: employee.status === "active" ? "inactive" : "active" });
    await load();
  } catch (error) {
    showError(error);
  }
}

onIonViewWillEnter(load);
</script>

<style scoped>
.form-help {
  margin: 0 0 12px;
}

.field-error,
.field-hint {
  display: block;
  margin: 4px 16px 10px;
}
</style>

