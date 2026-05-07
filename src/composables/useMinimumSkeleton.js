import { onBeforeUnmount, ref, watch } from "vue";

export const useMinimumSkeleton = (loadingSource, minDuration = 1000) => {
  const showSkeleton = ref(false);
  let hideTimer = null;
  let visibleSince = 0;

  const clearHideTimer = () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  };

  watch(
    loadingSource,
    (isLoading) => {
      clearHideTimer();

      if (isLoading) {
        visibleSince = Date.now();
        showSkeleton.value = true;
        return;
      }

      if (!showSkeleton.value) {
        return;
      }

      const elapsed = Date.now() - visibleSince;
      const remaining = Math.max(0, minDuration - elapsed);

      if (remaining === 0) {
        showSkeleton.value = false;
        return;
      }

      hideTimer = setTimeout(() => {
        showSkeleton.value = false;
        hideTimer = null;
      }, remaining);
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    clearHideTimer();
  });

  return { showSkeleton };
};
