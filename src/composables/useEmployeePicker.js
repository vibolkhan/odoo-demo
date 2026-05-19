import { ref } from "vue";
import { useNotification } from "@/composables/useNotification";

export function useEmployeePicker(userStore, options = {}) {
  const pageSize = options.pageSize ?? 10;
  const employeeSearch = ref("");
  const employeeOptions = ref([]);
  const selectedEmployees = ref([]);
  const employeeOffset = ref(0);
  const hasMoreEmployees = ref(true);
  const loadingEmployees = ref(false);
  const showAllEmployees = ref(false);
  const { showToast } = useNotification();

  const loadEmployees = async (reset = false) => {
    if (loadingEmployees.value) return;
    if (!reset && !hasMoreEmployees.value) return;

    loadingEmployees.value = true;
    if (reset) {
      employeeOffset.value = 0;
      employeeOptions.value = [];
    }

    try {
      const result = await userStore.fetchEmployees({
        query: employeeSearch.value,
        offset: employeeOffset.value,
        limit: pageSize,
      });

      employeeOptions.value = [...employeeOptions.value, ...result.records];
      hasMoreEmployees.value = result.hasMore;
      employeeOffset.value += result.records.length;
      showAllEmployees.value = !employeeSearch.value;
    } catch (error) {
      console.error("Error loading employees:", error);
      await showToast("Failed to load employees list.", "danger");
    } finally {
      loadingEmployees.value = false;
    }
  };

  const onEmployeeSearch = (event) => {
    if (event?.target && "value" in event.target) {
      employeeSearch.value = event.target.value;
    }
    loadEmployees(true);
  };

  const onEmployeeFocus = () => {
    if (employeeOptions.value.length === 0) {
      loadEmployees(true);
    } else {
      showAllEmployees.value = true;
    }
  };

  const onEmployeeBlur = () => {
    setTimeout(() => {
      showAllEmployees.value = false;
    }, 200);
  };

  const onEmployeeScroll = (event) => {
    const target = event.target;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 20) {
      loadEmployees();
    }
  };

  const selectEmployee = (employee) => {
    if (!selectedEmployees.value.find((item) => item.id === employee.id)) {
      selectedEmployees.value.push(employee);
    }
    employeeSearch.value = "";
    employeeOptions.value = [];
    showAllEmployees.value = false;
  };

  const removeEmployee = (employeeId) => {
    selectedEmployees.value = selectedEmployees.value.filter(
      (employee) => employee.id !== employeeId,
    );
  };

  const resetEmployeePicker = () => {
    selectedEmployees.value = [];
    employeeSearch.value = "";
    employeeOptions.value = [];
    employeeOffset.value = 0;
    hasMoreEmployees.value = true;
    showAllEmployees.value = false;
  };

  return {
    employeeSearch,
    employeeOptions,
    selectedEmployees,
    loadingEmployees,
    showAllEmployees,
    loadEmployees,
    onEmployeeSearch,
    onEmployeeFocus,
    onEmployeeBlur,
    onEmployeeScroll,
    selectEmployee,
    removeEmployee,
    resetEmployeePicker,
  };
}
