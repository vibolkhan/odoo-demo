<template>
  <ion-page>
    <ion-content
      :fullscreen="true"
      class="profile-page-content"
    >
      <ion-refresher
        slot="fixed"
        @ionRefresh="handleRefresh"
      >
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div
        class="profile-hero"
        v-if="!showSkeleton"
      >
        <div class="hero-bg"></div>
        <div class="hero-content">
          <AppAvatar
            :name="username"
            :size="100"
            :border="true"
            variant="blue"
          />
          <div class="user-info">
            <h1>{{ username }}</h1>
            <div class="badge-row">
              <span
                v-if="userId"
                class="user-id-tag"
                >ID: {{ userId }}</span
              >
              <span class="role-tag">{{
                isManager ? 'Manager' : 'Employee'
              }}</span>
            </div>
          </div>
        </div>
      </div>
      <div
        class="profile-hero skeleton"
        v-else
      >
        <div class="hero-bg"></div>
        <div class="hero-content">
          <AppSkeleton
            shape="circle"
            width="100px"
            height="100px"
          />
          <div class="user-info">
            <AppSkeleton
              width="200px"
              height="32px"
            />
            <div class="badge-row">
              <AppSkeleton
                width="60px"
                height="20px"
              />
              <AppSkeleton
                width="80px"
                height="20px"
              />
            </div>
          </div>
        </div>
      </div>

      <template v-if="!showSkeleton">
        <div
          class="attendance-section"
          v-if="employeeId"
        >
          <div
            class="attendance-card"
            :class="{ 'is-checked-in': isCheckedIn }"
          >
            <div
              class="attendance-accent"
              aria-hidden="true"
            ></div>
            <div class="attendance-info">
              <div
                class="attendance-status-chip"
                :class="{ active: isCheckedIn }"
              >
                <div
                  v-if="isCheckedIn"
                  class="pulse-dot"
                ></div>
                <ion-icon
                  v-else
                  :icon="timeOutline"
                />
                <span>{{
                  isCheckedIn ? 'Live Session' : 'Ready to Start'
                }}</span>
              </div>
              <div class="status-indicator-row">
                <div class="attendance-copy">
                  <h3>
                    {{ isCheckedIn ? 'Currently Working' : 'Not Checked In' }}
                  </h3>
                  <p v-if="isCheckedIn && checkInTime">
                    Since {{ formatDisplayTime(checkInTime) }}
                  </p>
                  <p v-else-if="!loading.currentEmployee">
                    Check in to start tracking your work time for today.
                  </p>
                </div>
                <div
                  v-if="isCheckedIn"
                  class="timer-pill"
                >
                  <span class="timer-label">Elapsed</span>
                  <strong>{{ workingDuration }}</strong>
                </div>
              </div>
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
              <ion-icon
                v-else
                :icon="logInOutline"
              />
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
              <ion-icon
                v-else
                :icon="logOutOutline"
              />
              Check Out
            </button>
          </div>
        </div>

        <div class="profile-actions">
          <section
            v-if="isManager"
            class="action-section"
          >
            <h3 class="section-title">Team Management</h3>
            <div class="action-grid">
              <button
                class="action-card"
                @click="router.push('/tabs/leave-approval')"
                aria-label="Manager Approvals: Review and process team requests"
              >
                <div class="icon-box blue">
                  <ion-icon :icon="checkmarkDoneOutline" />
                </div>
                <div class="card-copy">
                  <h4>Manager Approvals</h4>
                  <p>Review and process team requests</p>
                </div>
                <ion-icon
                  :icon="chevronForwardOutline"
                  class="chevron"
                />
              </button>

              <button
                class="action-card"
                @click="router.push('/tabs/admin-attendance')"
                aria-label="All Attendances: View all employee attendances"
              >
                <div class="icon-box emerald">
                  <ion-icon :icon="timeOutline" />
                </div>
                <div class="card-copy">
                  <h4>All Attendances</h4>
                  <p>View all employee attendances</p>
                </div>
                <ion-icon
                  :icon="chevronForwardOutline"
                  class="chevron"
                />
              </button>
            </div>
          </section>

          <!-- <section class="action-section">
            <h3 class="section-title">Self Service</h3>
            <div class="action-grid">
              <button 
                class="action-card" 
                @click="router.push('/tabs/requests')"
                aria-label="My Requests: View your leave history"
              >
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
                aria-label="My Attendances: Check your work history"
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
                aria-label="Leave Balance: Check remaining allocations"
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
                aria-label="Calendar: View working & leave dates"
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
          </section> -->

          <section class="action-section">
            <h3 class="section-title">Account</h3>
            <div class="action-grid">
              <button
                class="action-card"
                @click="themeStore.toggleTheme"
                :aria-label="`Switch to ${isDarkMode ? 'light' : 'dark'} mode`"
              >
                <div
                  class="icon-box"
                  :class="isDarkMode ? 'amber' : 'blue'"
                >
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

              <button
                class="action-card logout"
                @click="handleLogout"
                aria-label="Sign Out: End your current session"
              >
                <div class="icon-box red">
                  <ion-icon :icon="logOutOutline" />
                </div>
                <div class="card-copy">
                  <h4>Sign Out</h4>
                  <p>End your current session</p>
                </div>
                <ion-icon
                  :icon="chevronForwardOutline"
                  class="chevron"
                />
              </button>
            </div>
          </section>
        </div>
      </template>

      <div
        v-if="showSkeleton"
        class="profile-actions skeleton"
      >
        <section class="action-section">
          <AppSkeleton
            width="140px"
            height="24px"
            margin="0 0 16px"
          />
          <div class="action-grid">
            <div
              v-for="i in 6"
              :key="i"
              class="action-card skeleton-card"
            >
              <AppSkeleton
                shape="squircle"
                width="48px"
                height="48px"
              />
              <div class="card-copy">
                <AppSkeleton
                  width="120px"
                  height="18px"
                />
                <AppSkeleton
                  width="180px"
                  height="14px"
                  margin="6px 0 0"
                />
              </div>
            </div>
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
} from '@ionic/vue'
import { useNotification } from '@/composables/useNotification'
import { Geolocation } from '@capacitor/geolocation'
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
} from 'ionicons/icons'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'
import { useThemeStore } from '@/stores/theme.store'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import { useMinimumSkeleton } from '@/composables/useMinimumSkeleton'

import { useAttendanceTimer } from '@/composables/useAttendanceTimer'
import { useAttendanceActions } from '@/composables/useAttendanceActions'
import { useDateTimeFormatter } from '@/composables/useDateTimeFormatter'

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const themeStore = useThemeStore()
const { isDarkMode } = storeToRefs(themeStore)
const { displayName: username, userId } = storeToRefs(authStore)
const { currentEmployee, isManager, loading } = storeToRefs(userStore)
const { showSkeleton } = useMinimumSkeleton(
  () => loading.value.currentEmployee,
  1000,
)

const { formatTime: formatDisplayTime } = useDateTimeFormatter()
const { isToggling, toggleAttendance } = useAttendanceActions()
const { showToast } = useNotification()

const userInitials = computed(() => {
  const name = username.value
  if (!name || name === 'Guest User') return 'U'
  return name.charAt(0).toUpperCase()
})

const employeeId = computed(() => currentEmployee.value?.id ?? null)
const isCheckedIn = computed(
  () => currentEmployee.value?.attendanceState === 'checked_in',
)
const checkInTime = computed(() => {
  if (!isCheckedIn.value || !currentEmployee.value?.lastCheckIn) {
    return null
  }

  return new Date(`${currentEmployee.value.lastCheckIn}Z`)
})

const { workingDuration } = useAttendanceTimer(isCheckedIn, checkInTime)

onMounted(async () => {
  await userStore.fetchCurrentEmployee()
})

const handleRefresh = async (event) => {
  try {
    await userStore.fetchCurrentEmployee({ force: true })
  } finally {
    event.target.complete()
  }
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    await router.replace('/login')
  } catch (error) {
    console.error('Logout failed:', error)
    await showToast('Failed to sign out. Please try again.', 'danger')
  }
}
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
  font-size: clamp(1.45rem, 4.5vw, 1.7rem);
  line-height: 1.15;
  font-weight: 800;
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
  margin-top: -10px;
  margin-bottom: 32px;
  position: relative;
  z-index: 2;
}

.attendance-card {
  position: relative;
  overflow: hidden;
  background: var(--card-bg);
  border-radius: 28px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
  gap: 18px;
}

.attendance-accent {
  position: absolute;
  inset: 0 auto 0 0;
  width: 6px;
  background: linear-gradient(180deg, #94a3b8 0%, #cbd5e1 100%);
}

.attendance-card.is-checked-in .attendance-accent {
  background: var(--ion-color-primary);
}

.attendance-card.is-checked-in {
  background: var(--card-bg);
}

.attendance-info h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
}

.attendance-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
}

.attendance-status-chip ion-icon {
  font-size: 0.9rem;
}

.attendance-status-chip.active {
  background: rgba(37, 99, 235, 0.12);
  color: var(--ion-color-primary);
}

.status-indicator-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.attendance-copy {
  min-width: 0;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: var(--ion-color-primary);
  border-radius: 50%;
  position: relative;
}

.pulse-dot::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--ion-color-primary);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(3);
    opacity: 0;
  }
}

.attendance-info p {
  margin: 6px 0 0;
  font-size: 0.88rem;
  color: var(--text-secondary);
  font-weight: 500;
  line-height: 1.45;
}

.live-timer {
  color: #2563eb;
  font-weight: 700;
  margin-left: 4px;
}

.timer-pill {
  flex-shrink: 0;
  min-width: 96px;
  padding: 10px 12px;
  border-radius: 18px;
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.12);
  text-align: right;
}

.timer-label {
  display: block;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.timer-pill strong {
  display: block;
  margin-top: 4px;
  font-size: 1rem;
  font-weight: 900;
  color: #1d4ed8;
  letter-spacing: 0.02em;
}

.attendance-btn {
  padding: 12px 20px;
  border-radius: 18px;
  border: none;
  font-weight: 800;
  font-size: 0.9rem;
  min-height: 48px;
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
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1d4ed8;
}

.check-out {
  background: linear-gradient(
    135deg,
    rgba(254, 226, 226, 0.95),
    rgba(254, 202, 202, 0.9)
  );
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

@media (max-width: 640px) {
  .attendance-card {
    align-items: stretch;
    flex-direction: column;
  }

  .status-indicator-row {
    flex-direction: column;
  }

  .timer-pill {
    width: 100%;
    text-align: left;
  }

  .attendance-btn {
    width: 100%;
    justify-content: center;
  }
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
