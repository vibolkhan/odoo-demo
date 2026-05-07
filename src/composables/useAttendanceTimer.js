import { ref, watch, onUnmounted } from 'vue';

export function useAttendanceTimer(isCheckedIn, checkInTime) {
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
        minutes
      ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    } else {
      workingDuration.value = "00:00:00";
    }
  };

  const startTimer = () => {
    updateTimer();
    if (!timerInterval) {
      timerInterval = setInterval(updateTimer, 1000);
    }
  };

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    workingDuration.value = "00:00:00";
  };

  watch(isCheckedIn, (newVal) => {
    if (newVal) {
      startTimer();
    } else {
      stopTimer();
    }
  }, { immediate: true });

  watch(checkInTime, () => {
    if (isCheckedIn.value) {
      updateTimer();
    }
  });

  onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval);
  });

  return {
    workingDuration,
    updateTimer,
  };
}
