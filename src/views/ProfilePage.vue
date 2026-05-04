<template>
  <ion-page>
    <ion-content :fullscreen="true" class="profile-page-content">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="profile-hero">
        <div class="hero-bg"></div>
        <div class="hero-content">
          <div class="avatar-circle">
            {{ userInitials }}
          </div>
          <div class="user-info">
            <h1>{{ username }}</h1>
            <div class="badge-row">
              <span v-if="userId" class="user-id-tag">ID: {{ userId }}</span>
              <span class="role-tag">{{
                isManager ? "Manager" : "Employee"
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="attendance-section" v-if="employeeId">
        <div class="attendance-card" :class="{ 'is-checked-in': isCheckedIn }">
          <div class="attendance-info">
            <h3>{{ isCheckedIn ? "Currently Working" : "Not Checked In" }}</h3>
            <p v-if="isCheckedIn && checkInTime">
              Since: {{ formatDisplayTime(checkInTime) }}
              <span class="live-timer">({{ workingDuration }})</span>
            </p>
            <p v-else>Ready to start your day?</p>
          </div>
          <button
            v-if="!isCheckedIn"
            class="attendance-btn check-in"
            @click="toggleAttendance"
            :disabled="isToggling"
          >
            <ion-spinner
              v-if="isToggling"
              name="crescent"
              class="btn-spinner"
            ></ion-spinner>
            <ion-icon v-else :icon="logInOutline" />
            Check In
          </button>
          <button
            v-else
            class="attendance-btn check-out"
            @click="toggleAttendance"
            :disabled="isToggling"
          >
            <ion-spinner
              v-if="isToggling"
              name="crescent"
              class="btn-spinner"
            ></ion-spinner>
            <ion-icon v-else :icon="logOutOutline" />
            Check Out
          </button>
        </div>
      </div>

      <div class="profile-actions">
        <section v-if="isManager" class="action-section">
          <h3 class="section-title">Team Management</h3>
          <div class="action-grid">
            <button
              class="action-card"
              @click="router.push('/tabs/leave-approval')"
            >
              <div class="icon-box blue">
                <ion-icon :icon="checkmarkDoneOutline" />
              </div>
              <div class="card-copy">
                <h4>Manager Approvals</h4>
                <p>Review and process team requests</p>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="chevron" />
            </button>

            <button
              class="action-card"
              @click="router.push('/tabs/admin-attendance')"
            >
              <div class="icon-box emerald">
                <ion-icon :icon="timeOutline" />
              </div>
              <div class="card-copy">
                <h4>All Attendances</h4>
                <p>View all employee attendances</p>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="chevron" />
            </button>
          </div>
        </section>

        <section class="action-section">
          <h3 class="section-title">Self Service</h3>
          <div class="action-grid">
            <button class="action-card" @click="router.push('/tabs/tab4')">
              <div class="icon-box purple">
                <ion-icon :icon="documentTextOutline" />
              </div>
              <div class="card-copy">
                <h4>My Requests</h4>
                <p>View your leave history</p>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="chevron" />
            </button>

            <button
              class="action-card"
              @click="router.push('/tabs/my-attendance')"
            >
              <div class="icon-box blue">
                <ion-icon :icon="timeOutline" />
              </div>
              <div class="card-copy">
                <h4>My Attendances</h4>
                <p>Check your work history</p>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="chevron" />
            </button>

            <button
              class="action-card"
              @click="router.push('/tabs/leave-balance')"
            >
              <div class="icon-box emerald">
                <ion-icon :icon="walletOutline" />
              </div>
              <div class="card-copy">
                <h4>Leave Balance</h4>
                <p>Check remaining allocations</p>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="chevron" />
            </button>

            <button
              class="action-card"
              @click="router.push('/tabs/leave-calendar')"
            >
              <div class="icon-box amber">
                <ion-icon :icon="calendarOutline" />
              </div>
              <div class="card-copy">
                <h4>Calendar</h4>
                <p>View working & leave dates</p>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="chevron" />
            </button>
          </div>
        </section>

        <section class="action-section">
          <h3 class="section-title">Account</h3>
          <div class="action-grid">
            <button class="action-card logout" @click="handleLogout">
              <div class="icon-box red">
                <ion-icon :icon="logOutOutline" />
              </div>
              <div class="card-copy">
                <h4>Sign Out</h4>
                <p>End your current session</p>
              </div>
            </button>
          </div>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonContent,
  IonPage,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
} from "@ionic/vue";
import {
  checkmarkDoneOutline,
  chevronForwardOutline,
  logOutOutline,
  logInOutline,
  documentTextOutline,
  walletOutline,
  calendarOutline,
  timeOutline,
} from "ionicons/icons";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth.store";
import { useUserStore } from "@/stores/user.store";

const router = useRouter();
const authStore = useAuthStore();
const userStore = useUserStore();
const { displayName: username, userId } = storeToRefs(authStore);
const { currentEmployee, isManager } = storeToRefs(userStore);

const userInitials = computed(() => {
  const name = username.value;
  if (!name || name === "Guest User") return "U";
  return name.charAt(0).toUpperCase();
});

const employeeId = computed(() => currentEmployee.value?.id ?? null);
const isCheckedIn = computed(
  () => currentEmployee.value?.attendanceState === "checked_in",
);
const checkInTime = computed(() => {
  if (!isCheckedIn.value || !currentEmployee.value?.lastCheckIn) {
    return null;
  }

  return new Date(`${currentEmployee.value.lastCheckIn}Z`);
});

const isToggling = ref(false);
const workingDuration = ref("00:00:00");
let timerInterval = null;

const updateTimer = () => {
  if (isCheckedIn.value && checkInTime.value) {
    const diff = Math.floor(
      (new Date().getTime() - checkInTime.value.getTime()) / 1000,
    );
    const h = Math.floor(diff / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((diff % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(diff % 60)
      .toString()
      .padStart(2, "0");
    workingDuration.value = `${h}:${m}:${s}`;
  } else {
    workingDuration.value = "00:00:00";
  }
};

watch(
  isCheckedIn,
  (newVal) => {
    if (newVal) {
      updateTimer();
      timerInterval = setInterval(updateTimer, 1000);
    } else {
      if (timerInterval) clearInterval(timerInterval);
      workingDuration.value = "00:00:00";
    }
  },
  { immediate: true },
);

onMounted(async () => {
  await Promise.all([
    authStore.hydrateSession(),
    userStore.fetchManagerAccess(),
    userStore.fetchCurrentEmployee({ force: true }),
  ]);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

function formatDisplayTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function toggleAttendance() {
  if (isToggling.value) return;
  isToggling.value = true;

  let latitude = 11.549701051642238;
  let longitude = 104.94357686377263;

  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 5000,
      });
    });
    latitude = pos.coords.latitude;
    longitude = pos.coords.longitude;
  } catch (error) {
    console.warn("Could not get exact location, using default", error);
  }

  try {
    await userStore.toggleAttendance(latitude, longitude);
  } catch (error) {
    console.error("Error during attendance toggle:", error);
    alert(error.message || "An error occurred. Please try again.");
  } finally {
    isToggling.value = false;
  }
}

const handleRefresh = async (event) => {
  await Promise.all([
    userStore.fetchManagerAccess(),
    userStore.fetchCurrentEmployee({ force: true }),
  ]);
  event.target.complete();
};

const handleLogout = async () => {
  await authStore.logout();
  await router.replace("/login");
};
</script>

<style scoped>
.profile-page-content {
  --background: #f8fafc;
}

.profile-hero {
  position: relative;
  padding: calc(env(safe-area-inset-top) + 40px) 24px 60px;
  background: #ffffff;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  top: -100px;
  right: -50px;
  width: 250px;
  height: 250px;
  background: radial-gradient(
    circle,
    rgba(37, 99, 235, 0.08) 0%,
    transparent 70%
  );
  border-radius: 50%;
}

.hero-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 20px;
}

.avatar-circle {
  width: 96px;
  height: 96px;
  border-radius: 36px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  display: grid;
  place-items: center;
  font-size: 2.5rem;
  font-weight: 800;
  box-shadow: 0 20px 40px rgba(37, 99, 235, 0.25);
}

.user-info h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.02em;
  word-break: break-all;
}

.badge-row {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}

.user-id-tag,
.role-tag {
  padding: 4px 12px;
  background: #f1f5f9;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.role-tag {
  background: #eff6ff;
  color: #2563eb;
}

.attendance-section {
  padding: 0 20px 20px;
  margin-top: -20px;
  position: relative;
  z-index: 10;
}

.attendance-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #ffffff;
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
  border: 1px solid #f1f5f9;
  transition: all 0.3s ease;
}

.attendance-card.is-checked-in {
  background: linear-gradient(to right, #ffffff, #f0fdf4);
  border-color: #bbf7d0;
}

.attendance-info {
  flex: 1;
}

.attendance-info h3 {
  margin: 0 0 4px;
  font-size: 1.1rem;
  font-weight: 800;
  color: #1e293b;
}

.attendance-info p {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
}

.live-timer {
  color: #2563eb;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  margin-left: 2px;
}

.attendance-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 0.9rem;
  white-space: nowrap;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.attendance-btn.check-in {
  background: #2563eb;
  color: white;
}

.attendance-btn.check-in:active {
  background: #1d4ed8;
  transform: scale(0.95);
}

.attendance-btn.check-out {
  background: #ef4444;
  color: white;
}

.attendance-btn.check-out:active {
  background: #dc2626;
  transform: scale(0.95);
}

.attendance-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  color: white;
}

.profile-actions {
  padding: 0 20px 40px;
  display: grid;
  gap: 32px;
}

.action-section {
  display: grid;
  gap: 12px;
}

.section-title {
  margin: 0 0 4px 4px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #94a3b8;
}

.action-grid {
  display: grid;
  gap: 12px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 24px;
  text-align: left;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
}

.action-card:active {
  transform: scale(0.98);
  background: #f8fafc;
}

.icon-box {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 1.4rem;
}

.icon-box.blue {
  background: #eff6ff;
  color: #2563eb;
}
.icon-box.purple {
  background: #f5f3ff;
  color: #7c3aed;
}
.icon-box.emerald {
  background: #ecfdf5;
  color: #059669;
}
.icon-box.amber {
  background: #fffbeb;
  color: #d97706;
}
.icon-box.red {
  background: #fef2f2;
  color: #dc2626;
}

.card-copy {
  flex: 1;
}

.card-copy h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: #1e293b;
}

.card-copy p {
  margin: 2px 0 0;
  font-size: 0.82rem;
  color: #64748b;
  font-weight: 500;
}

.chevron {
  font-size: 1.1rem;
  color: #cbd5e1;
}

.action-card.logout {
  border-color: #fee2e2;
  background: #fffcfc;
}
</style>
