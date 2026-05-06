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
            <button class="action-card" @click="themeStore.toggleTheme">
              <div class="icon-box" :class="isDarkMode ? 'amber' : 'blue'">
                <ion-icon :icon="isDarkMode ? sunnyOutline : moonOutline" />
              </div>
              <div class="card-copy">
                <h4>{{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}</h4>
                <p>Switch between light and dark themes</p>
              </div>
              <div class="theme-toggle-status">
                {{ isDarkMode ? 'ON' : 'OFF' }}
              </div>
            </button>

            <button class="action-card logout" @click="handleLogout">
              <div class="icon-box red">
                <ion-icon :icon="logOutOutline" />
              </div>
              <div class="card-copy">
                <h4>Sign Out</h4>
                <p>End your current session</p>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="chevron" />
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
  moonOutline,
  sunnyOutline,
} from "ionicons/icons";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth.store";
import { useUserStore } from "@/stores/user.store";
import { useThemeStore } from "@/stores/theme.store";

const router = useRouter();
const authStore = useAuthStore();
const userStore = useUserStore();
const themeStore = useThemeStore();
const { isDarkMode } = storeToRefs(themeStore);
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
    const now = new Date();
    const diff = now.getTime() - checkInTime.value.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    workingDuration.value = `${String(hours).padStart(2, "0")}:${String(
      minutes,
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
};

onMounted(async () => {
  await userStore.fetchCurrentEmployee();
  if (isCheckedIn.value) {
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
  }
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

watch(isCheckedIn, (newVal) => {
  if (newVal) {
    updateTimer();
    if (!timerInterval) timerInterval = setInterval(updateTimer, 1000);
  } else {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    workingDuration.value = "00:00:00";
  }
});

const handleRefresh = async (event) => {
  try {
    await userStore.fetchCurrentEmployee({ force: true });
  } finally {
    event.target.complete();
  }
};

const getCurrentPosition = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn("Geolocation error:", error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      },
    );
  });
};

const toggleAttendance = async () => {
  if (isToggling.value) return;
  isToggling.value = true;
  try {
    const location = await getCurrentPosition();
    await userStore.toggleAttendance(
      location?.latitude ?? 11.549689964595043,
      location?.longitude ?? 104.94361458805437,
    );
  } catch (error) {
    console.error("Attendance toggle failed:", error);
  } finally {
    isToggling.value = false;
  }
};

const handleLogout = async () => {
  try {
    await authStore.logout();
    await router.replace("/login");
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

const formatDisplayTime = (date) => {
  if (!date) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
</script>

<style scoped>
.profile-page-content {
  --background: var(--app-bg);
}

.profile-hero {
  position: relative;
  padding: 60px 20px 40px;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 240px;
  background: var(--card-bg);
  z-index: 0;
  border-bottom: 1px solid var(--border-color);
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.avatar-circle {
  width: 100px;
  height: 100px;
  background: var(--app-bg);
  border-radius: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--ion-color-primary);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  border: 4px solid var(--border-color);
}

.user-info h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 850;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.badge-row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: center;
}

.user-id-tag,
.role-tag {
  padding: 4px 12px;
  background: var(--app-bg);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.attendance-section {
  padding: 0 20px;
  margin-top: -20px;
  margin-bottom: 32px;
  position: relative;
  z-index: 2;
}

.attendance-card {
  background: var(--card-bg);
  border-radius: 28px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
}

.attendance-info h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
}

.attendance-info p {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.live-timer {
  color: #2563eb;
  font-weight: 700;
  margin-left: 4px;
}

.attendance-btn {
  padding: 12px 20px;
  border-radius: 18px;
  border: none;
  font-weight: 800;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.attendance-btn ion-icon {
  font-size: 1.2rem;
}

.check-in {
  background: #eff6ff;
  color: #2563eb;
}

.check-out {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.attendance-btn:active {
  transform: scale(0.95);
}

.attendance-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-spinner {
  width: 16px;
  height: 16px;
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
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  text-align: left;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.action-card:active {
  transform: scale(0.98);
  background: var(--app-bg);
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
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
}
.icon-box.purple {
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
}
.icon-box.emerald {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}
.icon-box.amber {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}
.icon-box.red {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.card-copy {
  flex: 1;
}

.card-copy h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
}

.card-copy p {
  margin: 2px 0 0;
  font-size: 0.82rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.chevron {
  font-size: 1.1rem;
  color: #cbd5e1;
}

/* Logout card now uses standard action-card style */

.theme-toggle-status {
  font-size: 0.7rem;
  font-weight: 800;
  color: #94a3b8;
  padding: 4px 8px;
  background: var(--border-color);
  border-radius: 8px;
}
</style>
