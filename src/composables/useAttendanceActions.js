import { computed } from 'vue';
import { Geolocation } from "@capacitor/geolocation";
import { toastController } from "@ionic/vue";
import { useNotification } from "@/composables/useNotification";
import { useUserStore } from "@/stores/user.store";

export function useAttendanceActions() {
  const userStore = useUserStore();
  const { showToast } = useNotification();
  const isToggling = computed(() => userStore.loading.attendanceToggle);

  const getCurrentPosition = async () => {
    // ① Native Android/iOS via Capacitor
    try {
      let status = await Geolocation.checkPermissions();
      if (status.location !== 'granted') {
        status = await Geolocation.requestPermissions();
      }
      
      if (status.location === "granted") {
        const { coords } = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });
        return { latitude: coords.latitude, longitude: coords.longitude };
      }
    } catch (e) {
      console.warn("Capacitor Geolocation error:", e);
    }

    // ② Browser fallback
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      return null;
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        (err) => {
          console.warn("Geolocation error:", err);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
      );
    });
  };

  const toggleAttendance = async () => {
    if (isToggling.value) return;
    
    try {
      const location = await getCurrentPosition();
      if (!location) {
        await showToast("Unable to get location. Please enable GPS.", "danger");
        await userStore.toggleAttendance(null, null);
        return;
      }
      await userStore.toggleAttendance(location.latitude, location.longitude);
    } catch (error) {
      console.error("Attendance toggle failed:", error);
      const errorMessage = userStore.error.attendanceToggle || "Failed to update attendance status.";
      await showToast(errorMessage, "danger");
    }
  };

  return {
    isToggling,
    toggleAttendance,
    showToast,
  };
}
