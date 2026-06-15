import { ref } from "vue";
import { getErrorMessage } from "@/composables/useSupabaseError";

export function useToast() {
  const toastMessage = ref("");
  const toastColor = ref<"danger" | "success" | "warning">("success");
  const toastOpen = ref(false);

  function showToast(message: string, color: "danger" | "success" | "warning" = "success") {
    toastMessage.value = message;
    toastColor.value = color;
    toastOpen.value = true;
  }

  function showError(error: unknown, fallback?: string) {
    showToast(getErrorMessage(error, fallback), "danger");
  }

  return { showError, showToast, toastColor, toastMessage, toastOpen };
}
