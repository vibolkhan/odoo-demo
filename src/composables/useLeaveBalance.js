import { computed } from 'vue';
import { 
  medicalOutline, 
  calendarOutline, 
  airplaneOutline, 
  briefcaseOutline, 
  sparklesOutline 
} from "ionicons/icons";
import { useTimeoffStore } from "@/stores/timeoff.store";
import { getLeaveTypeEnglishName, getLeaveTypeKhmerName } from "@/utils/format";

export function useLeaveBalance() {
  const store = useTimeoffStore();

  const getIconForType = (name) => {
    const n = name.toLowerCase();
    if (n.includes("sick")) return medicalOutline;
    if (n.includes("annual")) return calendarOutline;
    if (n.includes("special")) return airplaneOutline;
    if (n.includes("business")) return briefcaseOutline;
    return sparklesOutline;
  };

  const getColorForType = (name) => {
    const n = name.toLowerCase();
    if (n.includes("sick")) return "#f43f5e";
    if (n.includes("annual")) return "#3b82f6";
    if (n.includes("special")) return "#fbbf24";
    if (n.includes("business")) return "#8b5cf6";
    return "#10b981";
  };

  const balances = computed(() => {
    return store.balances.map(b => ({
      ...b,
      icon: getIconForType(b.name),
      color: getColorForType(b.name),
    }));
  });

  return {
    getLeaveTypeEnglishName,
    getLeaveTypeKhmerName,
    totalEntitlement: computed(() => store.totalEntitlement),
    totalTaken: computed(() => store.totalTaken),
    totalRemaining: computed(() => store.totalRemaining),
    usagePercentage: computed(() => store.usagePercentage),
    balances,
  };
}
