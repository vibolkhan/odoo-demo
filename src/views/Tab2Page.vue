<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Data</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list inset>
        <ion-item>
          <ion-label>
            <h2>Database pages</h2>
            <p>Add DATABASE_SCHEMA.md so table-specific queries can be added safely.</p>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/vue";
</script>
