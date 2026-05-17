import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { onIonViewWillEnter } from "@ionic/vue";
import { useRouter } from "vue-router";
import { useNotification } from "@/composables/useNotification";
import { useMinimumSkeleton } from "@/composables/useMinimumSkeleton";
import { useTimeoffStore } from "@/stores/timeoff.store";
import { useUserStore } from "@/stores/user.store";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateTime = (date, time) => `${formatDate(date)} ${time}`;

const asArray = (value) => (Array.isArray(value) ? value : []);

const toIsoDate = (value) => {
  if (typeof value !== "string" || !value.trim()) return "";

  const matchedDate = value.match(/\d{4}-\d{2}-\d{2}/);
  if (matchedDate) return matchedDate[0];

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? "" : formatDate(parsedDate);
};

const normalizeSpecialDayEntry = (entry, fallbackDate = "") => {
  if (!entry) return [];

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
    return entry.flatMap((item) => normalizeSpecialDayEntry(item, fallbackDate));
  }

  if (typeof entry !== "object") return [];

  const startDateStr =
    toIsoDate(entry.start) ||
    toIsoDate(entry.start_date) ||
    toIsoDate(entry.date) ||
    toIsoDate(entry.day) ||
    fallbackDate;

  const endDateStr =
    toIsoDate(entry.end) || toIsoDate(entry.end_date) || startDateStr;

  const nestedMatches = [
    entry.bankHolidays,
    entry.public_holidays,
    entry.special_days,
    entry.holidays,
    entry.days,
    entry.leaves,
    entry.result,
  ].flatMap((collection) =>
    asArray(collection).flatMap((item) =>
      normalizeSpecialDayEntry(item, startDateStr),
    ),
  );

  if (nestedMatches.length > 0) return nestedMatches;
  if (!startDateStr) return [];

  const name =
    entry.title ||
    entry.name ||
    entry.display_name ||
    entry.description ||
    entry.label ||
    entry.reason ||
    "Public Holiday";

  if (startDateStr === endDateStr) {
    return [{ date: startDateStr, name }];
  }

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const result = [];
  const diffDays = Math.ceil(
    Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays >= 0 && diffDays < 32) {
    const current = new Date(start);
    while (current <= end) {
      result.push({ date: formatDate(new Date(current)), name });
      current.setDate(current.getDate() + 1);
    }
    return result;
  }

  return [{ date: startDateStr, name }];
};

const normalizeSpecialDays = (payload) => {
  if (Array.isArray(payload)) {
    return payload.flatMap((entry) => normalizeSpecialDayEntry(entry));
  }

  if (!payload || typeof payload !== "object") return [];

  const keyedEntries = Object.entries(payload).flatMap(([key, value]) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      if (typeof value === "string") {
        return [{ date: key, name: value.trim() || "Public Holiday" }];
      }
      if (typeof value === "boolean" || typeof value === "number") {
        return value ? [{ date: key, name: "Public Holiday" }] : [];
      }
      return normalizeSpecialDayEntry(value, key);
    }

    return value && typeof value === "object" ? normalizeSpecialDays(value) : [];
  });

  return keyedEntries.length > 0 ? keyedEntries : normalizeSpecialDayEntry(payload);
};

const buildCalendarDays = (currentDate) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  let startDay = firstDayOfMonth.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;

  const days = [];

  for (let index = startDay - 1; index >= 0; index -= 1) {
    const date = new Date(year, month, -index);
    days.push({
      day: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      isCurrentMonth: false,
    });
  }

  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= lastDayOfMonth; day += 1) {
    const today = new Date();
    days.push({
      day,
      month,
      year,
      isCurrentMonth: true,
      isToday:
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear(),
    });
  }

  const remainingSlots = 42 - days.length;
  for (let day = 1; day <= remainingSlots; day += 1) {
    const date = new Date(year, month + 1, day);
    days.push({
      day: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      isCurrentMonth: false,
    });
  }

  return days;
};

export function useLeaveCalendarPage() {
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const userStore = useUserStore();
  const timeoffStore = useTimeoffStore();
  const router = useRouter();
  const { showToast } = useNotification();
  const { leaveRequests, calendarData, loading } = storeToRefs(timeoffStore);
  const { currentEmployee } = storeToRefs(userStore);

  const currentDate = ref(new Date());
  const errorMessage = ref("");
  const isDetailModalOpen = ref(false);
  const isHolidayDetailModalOpen = ref(false);
  const selectedRequest = ref(null);
  const selectedHoliday = ref(null);

  const { showSkeleton } = useMinimumSkeleton(
    () => timeoffStore.loading.calendar,
    1000,
  );

  const currentMonthYear = computed(() =>
    currentDate.value.toLocaleString("default", {
      month: "long",
      year: "numeric",
    }),
  );

  const calendarDays = computed(() => buildCalendarDays(currentDate.value));

  const publicHolidaysByDate = computed(() => {
    const holidays = normalizeSpecialDays(calendarData.value.specialDays);

    return holidays.reduce((accumulator, holiday) => {
      if (!holiday.date || accumulator[holiday.date]) return accumulator;
      accumulator[holiday.date] = holiday;
      return accumulator;
    }, {});
  });

  const fetchCalendarData = async () => {
    errorMessage.value = "";

    try {
      const year = currentDate.value.getFullYear();
      const month = currentDate.value.getMonth();
      const startDate = new Date(year, month - 1, 20);
      const endDate = new Date(year, month + 1, 10);

      await timeoffStore.fetchCalendarData({
        startStr: formatDateTime(startDate, "17:00:00"),
        endStr: formatDateTime(endDate, "16:59:59"),
        startStrShort: formatDate(startDate),
        endStrShort: formatDate(endDate),
      });
    } catch (error) {
      console.error("Critical failure in fetchCalendarData:", error);
      errorMessage.value = "Failed to sync with server.";
      await showToast("Failed to load calendar data.", "danger");
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

    const isUnusual = !!(
      calendarData.value.unusualDays && calendarData.value.unusualDays[dateStr]
    );
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
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    return leaveRequests.value
      .filter((leave) => {
        if (!leave.dateFrom || !leave.dateTo) return false;
        return new Date(leave.dateFrom) <= endOfMonth && new Date(leave.dateTo) >= startOfMonth;
      })
      .sort(
        (left, right) =>
          new Date(left.dateFrom).getTime() - new Date(right.dateFrom).getTime(),
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
        groups.push({ name: holiday.name, dates: currentGroup.dates });
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

  const getEnglishName = (name) => name.split("(")[0].trim();

  const getKhmerName = (name) => {
    const match = name.match(/\(([^)]+)\)/);
    return match ? match[1] : "";
  };

  const handleRefresh = async (event) => {
    await fetchCalendarData();
    event.target.complete();
  };

  const goToHolidayDetail = (holiday) => {
    selectedHoliday.value = holiday;
    isHolidayDetailModalOpen.value = true;
  };

  const handleDayClick = (dateObj) => {
    const status = getDayStatus(dateObj);

    if (status.isPublicHoliday && status.specialDay) {
      const holidayDate = new Date(status.specialDay.date);
      goToHolidayDetail({
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
      });
      return;
    }

    if (status.hasLeave) {
      const dateStr = `${dateObj.year}-${String(dateObj.month + 1).padStart(2, "0")}-${String(
        dateObj.day,
      ).padStart(2, "0")}`;

      const leave = leaveRequests.value.find((request) => {
        if (!request.dateFrom || !request.dateTo) return false;
        const start = request.dateFrom.split(" ")[0];
        const stop = request.dateTo.split(" ")[0];
        return dateStr >= start && dateStr <= stop;
      });

      if (leave) {
        selectedRequest.value = leave;
        isDetailModalOpen.value = true;
      }
    }
  };

  const goToMyRequests = () => {
    void router.push("/tabs/requests");
  };

  const goToRequestDetail = (leave) => {
    if (!leave.request) return;
    selectedRequest.value = leave.request;
    isDetailModalOpen.value = true;
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

  return {
    weekDays,
    loading,
    currentEmployee,
    showSkeleton,
    currentDate,
    errorMessage,
    isDetailModalOpen,
    isHolidayDetailModalOpen,
    selectedRequest,
    selectedHoliday,
    currentMonthYear,
    calendarDays,
    monthlyLeaves,
    monthlyPublicHolidays,
    fetchCalendarData,
    prevMonth,
    nextMonth,
    getDayStatus,
    getEnglishName,
    getKhmerName,
    handleRefresh,
    handleDayClick,
    goToMyRequests,
    goToRequestDetail,
    goToHolidayDetail,
    closeHolidayDetail,
    closeRequestDetail,
  };
}
