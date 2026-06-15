<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Employees</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-button :disabled="loading" expand="block" @click="loadEmployees">
        {{ loading ? "Loading employees..." : "Refresh employees" }}
      </ion-button>

      <ion-text v-if="errorMessage" color="danger">
        <p>{{ errorMessage }}</p>
      </ion-text>

      <ion-text v-else-if="!loading && employees.length === 0" color="medium">
        <p>No employees are visible to the signed-in user.</p>
      </ion-text>

      <ion-list v-else inset>
        <ion-item v-for="employee in employees" :key="employee.id">
          <ion-label>
            <h2>{{ employee.first_name }} {{ employee.last_name }}</h2>
            <p>{{ employee.employee_code }} - {{ employee.status }}</p>
            <p v-if="employee.email">{{ employee.email }}</p>
            <p v-if="employee.phone">{{ employee.phone }}</p>
            <p>Hired: {{ employee.hire_date }}</p>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
} from "@ionic/vue";
import { ref } from "vue";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

type Employee = Database["public"]["Tables"]["employees"]["Row"];

const employees = ref<Employee[]>([]);
const loading = ref(false);
const errorMessage = ref("");

async function loadEmployees() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("employee_code");

    if (error) {
      throw error;
    }

    employees.value = data ?? [];
  } catch (error) {
    employees.value = [];
    errorMessage.value =
      error instanceof Error ? error.message : "Unable to load employees.";
  } finally {
    loading.value = false;
  }
}

onIonViewWillEnter(loadEmployees);
</script>
