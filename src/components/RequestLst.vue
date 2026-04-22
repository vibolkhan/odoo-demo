<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button
            default-href="#"
            color="primary"
          ></ion-back-button>
        </ion-buttons>
        <ion-title class="ion-text-center">Leave Management</ion-title>
        <ion-buttons slot="end">
          <ion-button
            color="primary"
            class="header-submit"
            >Submit</ion-button
          >
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding custom-bg">
      <div class="hero-card">
        <p class="hero-label">ACTIVE REQUESTS</p>
        <div class="hero-content">
          <span class="hero-count">03</span>
          <span class="hero-subtext">Pending Review</span>
        </div>
      </div>

      <ion-row class="ion-margin-top">
        <ion-col
          size="6"
          class="ion-no-padding-start"
        >
          <div class="balance-card">
            <p class="balance-label">Annual Balance</p>
            <p class="balance-value blue-text">18d</p>
          </div>
        </ion-col>
        <ion-col
          size="6"
          class="ion-no-padding-end"
        >
          <div class="balance-card">
            <p class="balance-label">Sick Leave</p>
            <p class="balance-value purple-text">05d</p>
          </div>
        </ion-col>
      </ion-row>

      <div class="section-header ion-margin-top">
        <h2>Recent Requests</h2>
        <ion-button
          fill="clear"
          size="small"
          class="filter-btn"
          >Filter</ion-button
        >
      </div>

      <div class="request-list">
        <div class="request-card">
          <div class="card-top">
            <div>
              <p class="leave-type-label">ANNUAL LEAVE</p>
              <h3 class="date-range">
                Oct 24
                <ion-icon
                  :icon="arrowForward"
                  class="arrow"
                ></ion-icon>
                Oct 28
              </h3>
            </div>
            <ion-badge class="badge-pending">PENDING</ion-badge>
          </div>
          <div class="action-buttons">
            <ion-button
              expand="block"
              class="btn-modify"
              >Modify</ion-button
            >
            <ion-button
              expand="block"
              class="btn-cancel"
              >Cancel</ion-button
            >
          </div>
        </div>

        <div class="request-card">
          <div class="card-top">
            <div>
              <p class="leave-type-label">SICK LEAVE</p>
              <h3 class="date-range">
                Sep 12
                <ion-icon
                  :icon="arrowForward"
                  class="arrow"
                ></ion-icon>
                Sep 13
              </h3>
            </div>
            <ion-badge class="badge-approved">APPROVED</ion-badge>
          </div>
          <div class="info-note">
            <ion-icon
              :icon="informationCircle"
              class="info-icon"
            ></ion-icon>
            <span>Approved by Sarah Connor on Sep 10</span>
          </div>
        </div>

        <div class="request-card">
          <div class="card-top">
            <div>
              <p class="leave-type-label">PERSONAL LEAVE</p>
              <h3 class="date-range">
                Aug 05
                <ion-icon
                  :icon="arrowForward"
                  class="arrow"
                ></ion-icon>
                Aug 06
              </h3>
            </div>
            <ion-badge class="badge-rejected">REJECTED</ion-badge>
          </div>
          <div class="rejection-box">
            "Insufficient balance for personal leave at this time. Please use
            annual leave instead."
          </div>
        </div>

        <div class="request-card">
          <div class="card-top">
            <div>
              <p class="leave-type-label">MARRIAGE LEAVE</p>
              <h3 class="date-range">
                Dec 15
                <ion-icon
                  :icon="arrowForward"
                  class="arrow"
                ></ion-icon>
                Dec 22
              </h3>
            </div>
            <ion-badge class="badge-pending">PENDING</ion-badge>
          </div>
          <div class="action-buttons">
            <ion-button
              expand="block"
              class="btn-modify"
              >Modify</ion-button
            >
            <ion-button
              expand="block"
              class="btn-cancel"
              >Cancel</ion-button
            >
          </div>
        </div>
      </div>
    </ion-content>

    <ion-footer>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="dashboard">
          <ion-icon :icon="grid" />
          <ion-label>Dashboard</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="request">
          <ion-icon :icon="addCircle" />
          <ion-label>Request</ion-label>
        </ion-tab-button>
        <ion-tab-button
          tab="history"
          class="active-tab"
        >
          <ion-icon :icon="time" />
          <ion-label>History</ion-label>
          <div class="dot"></div>
        </ion-tab-button>
        <ion-tab-button tab="profile">
          <ion-icon :icon="person" />
          <ion-label>Profile</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-footer>
  </ion-page>
</template>

<script setup>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonRow,
  IonCol,
  IonBadge,
  IonIcon,
  IonFooter,
  IonTabBar,
  IonTabButton,
  IonLabel,
} from '@ionic/vue'
import {
  arrowForward,
  informationCircle,
  grid,
  addCircle,
  time,
  person,
} from 'ionicons/icons'
</script>

<style scoped>
.custom-bg {
  --background: #f8fbff;
}

/* Hero Card */
.hero-card {
  background: #e1e9f1;
  border-radius: 16px;
  padding: 24px;
  border-left: 5px solid #2e71d6;
}
.hero-label {
  font-size: 11px;
  font-weight: 700;
  color: #7d8ea3;
  letter-spacing: 1px;
  margin: 0;
}
.hero-content {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-top: 8px;
}
.hero-count {
  font-size: 48px;
  font-weight: 800;
  color: #2c3e50;
}
.hero-subtext {
  font-size: 16px;
  color: #5c6c7d;
}

/* Balance Cards */
.balance-card {
  background: #eef4f9;
  border-radius: 12px;
  padding: 16px;
  height: 80px;
}
.balance-label {
  font-size: 12px;
  color: #6a7d8f;
  margin: 0;
}
.balance-value {
  font-size: 22px;
  font-weight: 700;
  margin: 4px 0 0 0;
}
.blue-text {
  color: #0052cc;
}
.purple-text {
  color: #5c6c7d;
}

/* Section Header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.section-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1a202c;
}
.filter-btn {
  --padding-end: 0;
  font-weight: 600;
  text-transform: none;
}

/* Request Cards */
.request-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.leave-type-label {
  font-size: 11px;
  font-weight: 700;
  color: #718096;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.date-range {
  font-size: 18px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.arrow {
  font-size: 16px;
  color: #a0aec0;
}

/* Badges */
ion-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 800;
}
.badge-pending {
  --background: #dce0f9;
  color: #5a67d8;
}
.badge-approved {
  --background: #d6e4f0;
  color: #4a5568;
}
.badge-rejected {
  --background: #feb2b2;
  color: #c53030;
}

/* Actions */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}
.btn-modify {
  --background: #edf2f7;
  --color: #2b6cb0;
  --box-shadow: none;
  --border-radius: 8px;
  flex: 1;
  font-weight: 700;
  text-transform: none;
}
.btn-cancel {
  --background: #fff5f5;
  --color: #c53030;
  --box-shadow: none;
  --border-radius: 8px;
  flex: 1;
  font-weight: 700;
  text-transform: none;
}

/* Notes */
.info-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  color: #718096;
  font-size: 13px;
}
.info-icon {
  font-size: 18px;
}
.rejection-box {
  background: #edf2f7;
  border-radius: 8px;
  padding: 12px;
  margin-top: 16px;
  color: #4a5568;
  font-size: 13px;
  font-style: italic;
  line-height: 1.4;
}

/* Footer Tabs */
.active-tab {
  color: #3182ce;
  position: relative;
}
.dot {
  width: 4px;
  height: 4px;
  background: #3182ce;
  border-radius: 50%;
  position: absolute;
  bottom: 8px;
}
.header-submit {
  font-weight: 700;
  text-transform: none;
  font-size: 18px;
}
</style>
