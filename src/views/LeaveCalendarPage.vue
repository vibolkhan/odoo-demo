<template>
  <ion-page>
    <ion-content :fullscreen="true" class="leave-calendar-page">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      <LeaveRequestDetailModal
        :is-open="isDetailModalOpen"
        :request="selectedRequest"
        :fallback-employee-name="currentEmployee?.name"
        @close="closeRequestDetail"
        @updated="fetchCalendarData"
      />
      <PublicHolidayDetailModal
        :is-open="isHolidayDetailModalOpen"
        :holiday="selectedHoliday"
        @close="closeHolidayDetail"
      />
      <section class="calendar-shell">
        <div class="page-header">
          <div>
            <p class="eyebrow">Attendance</p>
            <h1>Leave Calendar</h1>
          </div>
        </div>

        <div class="calendar-card">
          <div class="calendar-header">
            <button class="nav-btn" @click="prevMonth">
              <ion-icon :icon="chevronBack" />
            </button>
            <div class="current-month">
              <h2>{{ currentMonthYear }}</h2>
            </div>
            <button class="nav-btn" @click="nextMonth">
              <ion-icon :icon="chevronForward" />
            </button>
          </div>

          <div class="calendar-legend">
            <div class="legend-item">
              <span class="legend-dot leave"></span>
              <span>Leave</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot holiday"></span>
              <span>Public Holiday</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot mandatory"></span>
              <span>Mandatory Day</span>
            </div>
          </div>

          <div v-if="loading.calendar" class="loader-container">
            <ion-spinner name="crescent" />
          </div>
          <div v-else-if="errorMessage" class="error-container">
            <ion-icon :icon="alertCircleOutline" />
            <p>{{ errorMessage }}</p>
            <button class="retry-btn" @click="fetchCalendarData">Retry</button>
          </div>
          <div v-else class="calendar-grid">
            <div v-for="dayName in weekDays" :key="dayName" class="weekday">
              {{ dayName }}
            </div>
            <div
              v-for="(dateObj, index) in calendarDays"
              :key="index"
              class="day-cell"
              :class="{
                today: dateObj.isToday,
                'other-month': !dateObj.isCurrentMonth,
                'has-leave': getDayStatus(dateObj).hasLeave,
                unusual: getDayStatus(dateObj).isUnusual,
                mandatory: getDayStatus(dateObj).isMandatory,
                'public-holiday': getDayStatus(dateObj).isPublicHoliday,
              }"
              role="button"
              tabindex="0"
              @click="handleDayClick(dateObj)"
              @keydown.enter="handleDayClick(dateObj)"
              @keydown.space.prevent="handleDayClick(dateObj)"
            >
              <span>{{ dateObj.day }}</span>
              <div
                v-if="getDayStatus(dateObj).hasLeave"
                class="leave-dot"
                :class="
                  getDayStatus(dateObj).leaveState === 'validate'
                    ? 'approved'
                    : 'pending'
                "
              ></div>
              <div
                v-if="getDayStatus(dateObj).isMandatory"
                class="mandatory-dot"
              ></div>
            </div>
          </div>
        </div>

        <div v-if="monthlyPublicHolidays.length > 0" class="holiday-section">
          <div class="section-header">
            <h2>Public Holidays</h2>
          </div>
          <div class="holiday-list">
            <div
              v-for="holiday in monthlyPublicHolidays"
              :key="holiday.id"
              class="holiday-item"
              role="button"
              tabindex="0"
              @click="goToHolidayDetail(holiday)"
              @keydown.enter="goToHolidayDetail(holiday)"
              @keydown.space.prevent="goToHolidayDetail(holiday)"
            >
              <div class="date-badge holiday-badge">
                <span class="day" :class="{ 'long-text': holiday.date.split(' ')[0].length > 2 }">{{ holiday.date.split(" ")[0] }}</span>
                <span class="month">{{ holiday.date.split(" ")[1] }}</span>
              </div>
              <div class="leave-info">
                <h3 class="holiday-title-en">{{ getEnglishName(holiday.type) }}</h3>
                <h4 v-if="getKhmerName(holiday.type)" class="holiday-title-km">{{ getKhmerName(holiday.type) }}</h4>
                <p>{{ holiday.duration }}</p>
              </div>
              <ion-icon :icon="chevronForward" class="item-chevron" />
            </div>
          </div>
        </div>

        <div class="upcoming-section">
          <div class="section-header">
            <h2>Leave Overview</h2>
            <button class="view-all" @click="goToMyRequests">View All</button>
          </div>

          <div
            v-if="monthlyLeaves.length === 0 && !loading.calendar"
            class="empty-state"
          >
            <ion-icon :icon="calendarOutline" />
            <p>No leave records found</p>
          </div>
          <div v-else class="upcoming-list">
            <div
              v-for="leave in monthlyLeaves"
              :key="leave.id"
              class="upcoming-item"
              role="button"
              tabindex="0"
              @click="goToRequestDetail(leave)"
              @keydown.enter="goToRequestDetail(leave)"
              @keydown.space.prevent="goToRequestDetail(leave)"
            >
              <div
                class="date-badge"
                :style="{ backgroundColor: leave.color + '15' }"
              >
                <span class="day" :class="{ 'long-text': leave.date.split(' ')[0].length > 2 }">{{ leave.date.split(" ")[0] }}</span>
                <span class="month">{{ leave.date.split(" ")[1] }}</span>
              </div>
              <div class="leave-info">
                <h3>{{ leave.type }}</h3>
                <p>{{ leave.status }} - {{ leave.duration }}</p>
              </div>
              <div
                class="status-indicator"
                :style="{ backgroundColor: leave.color }"
              ></div>
            </div>
          </div>
        </div>
      </section>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonContent,
  IonPage,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  onIonViewWillEnter,
} from "@ionic/vue";
import {
  chevronBack,
  chevronForward,
  calendarOutline,
  alertCircleOutline,
} from "ionicons/icons";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import LeaveRequestDetailModal from "@/components/LeaveRequestDetailModal.vue";
import PublicHolidayDetailModal from "@/components/PublicHolidayDetailModal.vue";
import { useTimeoffStore } from "@/stores/timeoff.store";
import { useUserStore } from "@/stores/user.store";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const router = useRouter();
const timeoffStore = useTimeoffStore();
const userStore = useUserStore();
const { leaveRequests, calendarData, loading } = storeToRefs(timeoffStore);
const { currentEmployee } = storeToRefs(userStore);
const currentDate = ref(new Date());
const errorMessage = ref("");
const isDetailModalOpen = ref(false);
const isHolidayDetailModalOpen = ref(false);
const selectedRequest = ref(null);
const selectedHoliday = ref(null);

const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
});

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);

  let startDay = firstDayOfMonth.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;

  const days = [];

  for (let i = startDay - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push({
      day: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      isCurrentMonth: false,
    });
  }

  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= lastDayOfMonth; i++) {
    const today = new Date();
    days.push({
      day: i,
      month,
      year,
      isCurrentMonth: true,
      isToday:
        i === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear(),
    });
  }

  const remainingSlots = 42 - days.length;
  for (let i = 1; i <= remainingSlots; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      day: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      isCurrentMonth: false,
    });
  }

  return days;
});

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateTime = (date, time) => {
  return `${formatDate(date)} ${time}`;
};

const asArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  return [];
};

const toIsoDate = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  const matchedDate = value.match(/\d{4}-\d{2}-\d{2}/);
  if (matchedDate) {
    return matchedDate[0];
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return formatDate(parsedDate);
};

const normalizeSpecialDayEntry = (
  entry,
  fallbackDate = "",
) => {
  if (!entry) {
    return [];
  }

  if (typeof entry === "boolean" || typeof entry === "number") {
    return fallbackDate ? [{ date: fallbackDate, name: "Public Holiday" }] : [];
  }

  if (typeof entry === "string") {
    const isoDate = toIsoDate(entry) || fallbackDate;
    if (isoDate && isoDate !== fallbackDate) {
      return [{ date: isoDate, name: "Public Holiday" }];
    }

    return fallbackDate
      ? [{ date: fallbackDate, name: entry.trim() || "Public Holiday" }]
      : [];
  }

  if (Array.isArray(entry)) {
    return entry.flatMap((item) =>
      normalizeSpecialDayEntry(item, fallbackDate),
    );
  }

  if (typeof entry !== "object") {
    return [];
  }

  const startDateStr =
    toIsoDate(entry.start) ||
    toIsoDate(entry.start_date) ||
    toIsoDate(entry.date) ||
    toIsoDate(entry.day) ||
    fallbackDate;

  const endDateStr =
    toIsoDate(entry.end) || toIsoDate(entry.end_date) || startDateStr;

  const nestedCollections = [
    entry.bankHolidays,
    entry.public_holidays,
    entry.special_days,
    entry.holidays,
    entry.days,
    entry.leaves,
    entry.result,
  ];

  const nestedMatches = nestedCollections.flatMap((collection) =>
    asArray(collection).flatMap((item) =>
      normalizeSpecialDayEntry(item, startDateStr),
    ),
  );

  if (nestedMatches.length > 0) {
    return nestedMatches;
  }

  if (!startDateStr) {
    return [];
  }

  const name =
    entry.title ||
    entry.name ||
    entry.display_name ||
    entry.description ||
    entry.label ||
    entry.reason ||
    "Public Holiday";

  if (startDateStr === endDateStr) {
    return [
      {
        date: startDateStr,
        name,
      },
    ];
  }

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const result = [];

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= 0 && diffDays < 32) {
    const current = new Date(start);
    while (current <= end) {
      result.push({
        date: formatDate(new Date(current)),
        name,
      });
      current.setDate(current.getDate() + 1);
    }
    return result;
  }

  return [
    {
      date: startDateStr,
      name,
    },
  ];
};

const normalizeSpecialDays = (payload) => {
  if (Array.isArray(payload)) {
    return payload.flatMap((entry) => normalizeSpecialDayEntry(entry));
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const objectPayload = payload;
  const keyedEntries = Object.entries(objectPayload).flatMap(([key, value]) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      if (typeof value === "string") {
        return [{ date: key, name: value.trim() || "Public Holiday" }];
      }

      if (typeof value === "boolean" || typeof value === "number") {
        return value ? [{ date: key, name: "Public Holiday" }] : [];
      }

      return normalizeSpecialDayEntry(value, key);
    }

    if (value && typeof value === "object") {
      return normalizeSpecialDays(value);
    }

    return [];
  });

  if (keyedEntries.length > 0) {
    return keyedEntries;
  }

  return normalizeSpecialDayEntry(objectPayload);
};

const publicHolidaysByDate = computed(() => {
  const holidays = normalizeSpecialDays(calendarData.value.specialDays);

  return holidays.reduce(
    (accumulator, holiday) => {
      if (!holiday.date || accumulator[holiday.date]) {
        return accumulator;
      }

      accumulator[holiday.date] = holiday;
      return accumulator;
    },
    {},
  );
});

const fetchCalendarData = async () => {
  errorMessage.value = "";

  try {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();

    const startDate = new Date(year, month - 1, 20);
    const endDate = new Date(year, month + 1, 10);

    const startStr = formatDateTime(startDate, "17:00:00");
    const endStr = formatDateTime(endDate, "16:59:59");
    const startStrShort = formatDate(startDate);
    const endStrShort = formatDate(endDate);

    await timeoffStore.fetchCalendarData({
      startStr,
      endStr,
      startStrShort,
      endStrShort,
    });
  } catch (error) {
    console.error("Critical failure in fetchCalendarData:", error);
    errorMessage.value = "Failed to sync with server.";
  }
};

const prevMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1,
  );
  fetchCalendarData();
};

const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1,
  );
  fetchCalendarData();
};

const getDayStatus = (dateObj) => {
  if (!dateObj) {
    return {
      hasLeave: false,
      leaveType: "",
      leaveState: "",
      isUnusual: false,
      isMandatory: false,
      specialDay: null,
      isPublicHoliday: false,
      publicHolidayName: "",
    };
  }

  const dateStr = `${dateObj.year}-${String(dateObj.month + 1).padStart(2, "0")}-${String(
    dateObj.day,
  ).padStart(2, "0")}`;

  const leave = calendarData.value.calendarLeaves.find((item) => {
    if (!item?.start_datetime || !item?.stop_datetime) return false;
    const start = item.start_datetime.split(" ")[0];
    const stop = item.stop_datetime.split(" ")[0];
    return dateStr >= start && dateStr <= stop;
  });

  const isUnusual =
    !!(calendarData.value.unusualDays && calendarData.value.unusualDays[dateStr]);
  const isMandatory =
    Array.isArray(calendarData.value.mandatoryDays) &&
    calendarData.value.mandatoryDays.includes(dateStr);
  const specialDay = publicHolidaysByDate.value[dateStr] || null;

  return {
    hasLeave: !!leave,
    leaveType: leave?.name || "",
    leaveState: leave?.state || "",
    isUnusual,
    isMandatory,
    specialDay,
    isPublicHoliday: !!specialDay,
    publicHolidayName: specialDay?.name || "",
  };
};

const monthlyLeaves = computed(() => {
  const currentMonth = currentDate.value.getMonth();
  const currentYear = currentDate.value.getFullYear();

  return leaveRequests.value
    .filter((leave) => {
      if (!leave.dateFrom || !leave.dateTo) return false;
      const startDate = new Date(leave.dateFrom);
      const stopDate = new Date(leave.dateTo);

      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

      return startDate <= endOfMonth && stopDate >= startOfMonth;
    })
    .sort(
      (left, right) =>
        new Date(left.dateFrom).getTime() -
        new Date(right.dateFrom).getTime(),
    )
    .map((leave) => {
      const startDate = new Date(leave.dateFrom);

      return {
        id: `leave-${leave.id}`,
        request: leave,
        type: leave.leaveType,
        date: startDate.toLocaleDateString("default", {
          day: "numeric",
          month: "short",
        }),
        duration: leave.durationDisplay || "N/A",
        status: leave.state === "validate" ? "Approved" : "Pending",
        color: leave.state === "validate" ? "#2e66db" : "#f59e0b",
        timestamp: startDate.getTime(),
      };
    });
});

const monthlyPublicHolidays = computed(() => {
  const currentMonth = currentDate.value.getMonth();
  const currentYear = currentDate.value.getFullYear();

  const sortedHolidays = Object.values(publicHolidaysByDate.value)
    .filter((holiday) => {
      const holidayDate = new Date(holiday.date);
      return (
        !Number.isNaN(holidayDate.getTime()) &&
        holidayDate.getMonth() === currentMonth &&
        holidayDate.getFullYear() === currentYear
      );
    })
    .sort((left, right) => left.date.localeCompare(right.date));

  const groups = [];
  let currentGroup = null;

  for (const holiday of sortedHolidays) {
    if (currentGroup && currentGroup.name === holiday.name) {
      currentGroup.dates.push(holiday.date);
    } else {
      currentGroup = { name: holiday.name, dates: [holiday.date] };
      groups.push({
        name: holiday.name,
        dates: currentGroup.dates,
      });
    }
  }

  return groups.map((group) => {
    const startDateStr = group.dates[0];
    const endDateStr = group.dates[group.dates.length - 1];
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    let dateDisplay = startDate.toLocaleDateString("default", {
      day: "numeric",
      month: "short",
    });

    let fullDateDisplay = startDate.toLocaleDateString("default", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let durationDisplay = "All day";

    if (startDateStr !== endDateStr) {
      dateDisplay = `${startDate.getDate()}-${endDate.getDate()} ${startDate.toLocaleDateString("default", { month: "short" })}`;
      fullDateDisplay = `${startDate.toLocaleDateString("default", { day: "numeric", month: "long" })} - ${endDate.toLocaleDateString("default", { day: "numeric", month: "long", year: "numeric" })}`;
      durationDisplay = `${group.dates.length} days`;
    }

    return {
      id: `holiday-${startDateStr}`,
      type: group.name,
      date: dateDisplay,
      fullDate: fullDateDisplay,
      duration: durationDisplay,
      status: "Public Holiday",
      color: "#dc2626",
    };
  });
});

const getEnglishName = (name) => {
  return name.split("(")[0].trim();
};

const getKhmerName = (name) => {
  const match = name.match(/\(([^)]+)\)/);
  return match ? match[1] : "";
};

const handleRefresh = async (event) => {
  await fetchCalendarData();
  event.target.complete();
};

const handleDayClick = (dateObj) => {
  const status = getDayStatus(dateObj);
  
  if (status.isPublicHoliday && status.specialDay) {
    const holidayDate = new Date(status.specialDay.date);
    const holiday = {
      id: `holiday-${status.specialDay.date}`,
      type: status.specialDay.name,
      date: holidayDate.toLocaleDateString("default", {
        day: "numeric",
        month: "short",
      }),
      fullDate: holidayDate.toLocaleDateString("default", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      duration: "All day",
      status: "Public Holiday",
      color: "#dc2626",
    };
    goToHolidayDetail(holiday);
    return;
  }

  if (status.hasLeave) {
    const dateStr = `${dateObj.year}-${String(dateObj.month + 1).padStart(2, "0")}-${String(
      dateObj.day,
    ).padStart(2, "0")}`;
    
    const leave = leaveRequests.value.find((l) => {
      if (!l.dateFrom || !l.dateTo) return false;
      const start = l.dateFrom.split(" ")[0];
      const stop = l.dateTo.split(" ")[0];
      return dateStr >= start && dateStr <= stop;
    });

    if (leave) {
      selectedRequest.value = leave;
      isDetailModalOpen.value = true;
    }
  }
};

const goToMyRequests = () => {
  void router.push("/tabs/tab4");
};

const goToRequestDetail = (leave) => {
  if (!leave.request) {
    return;
  }

  selectedRequest.value = leave.request;
  isDetailModalOpen.value = true;
};

const goToHolidayDetail = (holiday) => {
  selectedHoliday.value = holiday;
  isHolidayDetailModalOpen.value = true;
};

const closeHolidayDetail = () => {
  isHolidayDetailModalOpen.value = false;
  selectedHoliday.value = null;
};

const closeRequestDetail = () => {
  isDetailModalOpen.value = false;
  selectedRequest.value = null;
};

onIonViewWillEnter(async () => {
  fetchCalendarData();
  await userStore.fetchCurrentEmployee({ force: true });
});
</script>

<style scoped>
.leave-calendar-page {
  --background:
    radial-gradient(
      circle at top right,
      rgba(46, 102, 219, 0.12),
      transparent 40%
    ),
    linear-gradient(180deg, #f8fbff 0%, #f0f5fa 100%);
  --padding-top: calc(env(safe-area-inset-top) + 20px);
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-bottom: calc(env(safe-area-inset-bottom) + 100px);
}

.calendar-shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 12px;
}

.eyebrow {
  margin: 0 0 4px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

h1 {
  margin: 0;
  font-size: 2.25rem;
  font-weight: 850;
  color: #0f172a;
}

.calendar-card {
  background: white;
  border-radius: 30px;
  padding: 20px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.06);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.nav-btn {
  background: #f1f5f9;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0f172a;
  font-size: 1.2rem;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 14px;
  background: #0f172a;
  color: white;
  padding: 10px 14px;
  font-size: 0.85rem;
  font-weight: 700;
}

.refresh-btn:disabled {
  opacity: 0.7;
}

.current-month h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}

.calendar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.legend-dot.leave {
  background: #2e66db;
}

.legend-dot.holiday {
  background: #dc2626;
}

.legend-dot.mandatory {
  background: #64748b;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.weekday {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  padding-bottom: 8px;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
}

.day-cell:active {
  transform: scale(0.95);
  background: rgba(0, 0, 0, 0.05);
}

.day-cell.weekend {
  color: #94a3b8;
}

.day-cell.today {
  background: #2e66db;
  color: white;
  box-shadow: 0 8px 16px rgba(46, 102, 219, 0.3);
}

.day-cell.other-month {
  opacity: 0.3;
}

.day-cell.unusual {
  background: rgba(225, 29, 72, 0.03);
}

.day-cell.mandatory {
  background: rgba(46, 102, 219, 0.03);
}

.day-cell.public-holiday {
  background: rgba(220, 38, 38, 0.1);
  color: #991b1b;
}

.leave-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  position: absolute;
  bottom: 6px;
}

.leave-dot.approved {
  background: #2e66db;
}

.leave-dot.pending {
  background: #f59e0b;
}

.mandatory-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #64748b;
  position: absolute;
  top: 6px;
  right: 6px;
}

.loader-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  color: #94a3b8;
  gap: 12px;
}

.empty-state ion-icon {
  font-size: 3rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-weight: 600;
  font-size: 0.9rem;
}

.day-cell.has-leave {
  background: rgba(46, 102, 219, 0.08);
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  gap: 12px;
  color: #e11d48;
}

.error-container ion-icon {
  font-size: 2.5rem;
}

.error-container p {
  margin: 0;
  font-weight: 600;
  font-size: 0.9rem;
  text-align: center;
}

.retry-btn {
  background: #f1f5f9;
  border: none;
  padding: 8px 20px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.85rem;
  color: #0f172a;
}

.holiday-section,
.upcoming-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 750;
  color: #1e293b;
}

.view-all {
  background: transparent;
  border: none;
  color: #2e66db;
  font-weight: 700;
  font-size: 0.9rem;
}

.upcoming-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upcoming-item {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid white;
  border-radius: 20px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.upcoming-item:active {
  transform: scale(0.99);
}

.holiday-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.holiday-item {
  background: white;
  border-radius: 24px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
}

.holiday-item:active {
  transform: scale(0.97);
  background: #f8fafc;
}

.holiday-title-en {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.3;
}

.holiday-title-km {
  margin: 4px 0 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  line-height: 1.4;
}

.item-chevron {
  color: #cbd5e1;
  font-size: 1.2rem;
}

.date-badge {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.holiday-badge {
  background: rgba(220, 38, 38, 0.12);
}

.date-badge .day {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}

.date-badge .day.long-text {
  font-size: 0.75rem;
}

.date-badge .month {
  font-size: 0.65rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
}

.leave-info {
  flex: 1;
}

.leave-info h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.leave-info p {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.holiday-indicator {
  background: #dc2626;
}
</style>
