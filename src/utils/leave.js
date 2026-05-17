import {
  airplaneOutline,
  calendarClearOutline,
  medkitOutline,
  personOutline,
  sparklesOutline,
} from "ionicons/icons";

export const LEAVE_STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

export const getLeaveTypeEnglishName = (name = "") =>
  name.split(" - ")[0] || name;

export const getLeaveTypeKhmerName = (name = "") =>
  name.split(" - ")[1] || "";

export const formatLeaveStateLabel = (state = "") => {
  switch (state) {
    case "confirm":
      return "Pending";
    case "validate1":
      return "Review";
    case "validate":
      return "Approved";
    case "refuse":
      return "Refused";
    case "cancel":
      return "Cancelled";
    case "draft":
      return "Draft";
    default:
      return state ? state.charAt(0).toUpperCase() + state.slice(1) : "";
  }
};

export const getLeaveStatusClass = (state = "") => {
  switch (state) {
    case "validate1":
      return "status-review";
    case "validate":
      return "status-approved";
    case "refuse":
    case "cancel":
      return "status-refused";
    default:
      return "status-pending";
  }
};

export const matchesLeaveStatusFilter = (request, filter) => {
  if (filter === "all") return true;
  if (filter === "pending") {
    return request.state === "confirm" || request.state === "validate1";
  }
  if (filter === "approved") return request.state === "validate";
  if (filter === "rejected") return request.state === "refuse";
  return true;
};

export const requestTypeIcon = (leaveType = "") => {
  const normalizedType = leaveType.toLowerCase();
  if (normalizedType.includes("sick")) return medkitOutline;
  if (normalizedType.includes("personal")) return personOutline;
  if (normalizedType.includes("annual")) return calendarClearOutline;
  if (normalizedType.includes("unpaid")) return airplaneOutline;
  return sparklesOutline;
};

export const leaveTypeTone = (leaveType = "") => {
  const normalizedType = leaveType.toLowerCase();
  if (normalizedType.includes("sick")) return "tone-blue";
  if (normalizedType.includes("personal")) return "tone-coral";
  if (normalizedType.includes("annual")) return "tone-lilac";
  return "tone-sand";
};
