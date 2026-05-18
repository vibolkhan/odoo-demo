import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { computed, ref } from "vue";
import { useNotification } from "@/composables/useNotification";
import { useUserStore } from "@/stores/user.store";

const LOCATION_ACCESS_MESSAGE =
  "Unable to access location. Please enable location permissions and GPS.";

export function useAttendanceActions() {
  const userStore = useUserStore();
  const { showToast } = useNotification();
  const isResolvingLocation = ref(false);
  const isToggling = computed(
    () => isResolvingLocation.value || userStore.loading.attendanceToggle,
  );

  const getCurrentPosition = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        let status = await Geolocation.checkPermissions();

        if (status.location !== "granted") {
          status = await Geolocation.requestPermissions();
        }

        if (status.location !== "granted") {
          return null;
        }

        const { coords } = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        });

        return { latitude: coords.latitude, longitude: coords.longitude };
      } catch (e) {
        console.warn("Capacitor Geolocation error:", e);
        return null;
      }
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      return null;
    }

    try {
      if (navigator.permissions?.query) {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });

        if (permission.state === "denied") {
          return null;
        }
      }
    } catch (e) {
      console.warn("Browser geolocation permission check failed:", e);
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

    isResolvingLocation.value = true;

    try {
      const location = await getCurrentPosition();

      if (!location) {
        await showToast(LOCATION_ACCESS_MESSAGE, "danger");
        return;
      }

      await userStore.toggleAttendance(location.latitude, location.longitude);
    } catch (error) {
      console.error("Attendance toggle failed:", error);
      const errorMessage =
        userStore.error.attendanceToggle ||
        "Failed to update attendance status.";
      await showToast(errorMessage, "danger");
    } finally {
      isResolvingLocation.value = false;
    }
  };

  return {
    isToggling,
    toggleAttendance,
    showToast,
  };
}
