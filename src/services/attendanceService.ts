import type { TablesInsert, TablesUpdate } from "@/types/database.types";
import { supabase } from "@/lib/supabase";

function getLocalDate() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export async function getMyTodayAttendance(employeeId: number) {
  const today = getLocalDate();
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("attendance_date", today)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getMyAttendanceHistory(
  employeeId: number,
  startDate: string,
  endDate: string,
) {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("attendance_date", startDate)
    .lte("attendance_date", endDate)
    .order("attendance_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function processQrAttendance(payload: {
  qrCodeValue: string;
  logType: "check_in" | "check_out" | "break_in" | "break_out";
  deviceId?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
}) {
  const qrCodeValue = payload.qrCodeValue.trim();
  if (!qrCodeValue) throw new Error("Enter or scan a QR code first.");

  // Keep rpc bound to the Supabase client. Detaching the method loses `this.rest`.
  const { data, error } = await (supabase as any).rpc("process_qr_attendance", {
    p_qr_code_value: qrCodeValue,
    p_log_type: payload.logType,
    p_device_id: payload.deviceId?.slice(0, 100) || null,
    p_location: payload.location?.slice(0, 255) || null,
    p_latitude: payload.latitude || null,
    p_longitude: payload.longitude || null,
    p_ip_address: payload.ipAddress || null,
  });

  if (error) throw error;
  if (!data) throw new Error("Attendance RPC returned no result.");
  return data;
}

export async function getTodayEmployeeHomeData(employeeId: number, appUserId: number) {
  const today = getLocalDate();
  const [attendance, leave, overtime, corrections, notifications] = await Promise.all([
    supabase.from("attendance_records").select("*").eq("employee_id", employeeId).eq("attendance_date", today).maybeSingle(),
    supabase.from("leave_requests").select("*", { count: "exact", head: true }).eq("employee_id", employeeId).eq("status", "pending"),
    supabase.from("overtime_requests").select("*", { count: "exact", head: true }).eq("employee_id", employeeId).eq("status", "pending"),
    supabase.from("attendance_corrections").select("*", { count: "exact", head: true }).eq("employee_id", employeeId).eq("status", "pending"),
    supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", appUserId).eq("is_read", false),
  ]);
  const error = [attendance, leave, overtime, corrections, notifications].find((result) => result.error)?.error;
  if (error) throw error;
  return {
    attendance: attendance.data,
    notificationCount: notifications.count || 0,
    pendingRequestCount: (leave.count || 0) + (overtime.count || 0) + (corrections.count || 0),
  };
}

export async function getAttendanceRecords(filters: {
  startDate?: string;
  endDate?: string;
  employeeId?: number;
  status?: string;
}) {
  let query = supabase
    .from("attendance_records")
    .select("*, employees!fk_attendance_records_employee(*)")
    .order("attendance_date", { ascending: false });

  if (filters.startDate) query = query.gte("attendance_date", filters.startDate);
  if (filters.endDate) query = query.lte("attendance_date", filters.endDate);
  if (filters.employeeId) query = query.eq("employee_id", filters.employeeId);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createAttendanceRecord(payload: TablesInsert<"attendance_records">) {
  const { data, error } = await supabase
    .from("attendance_records")
    .insert(payload)
    .select("*, employees!fk_attendance_records_employee(*)")
    .single();

  if (error) throw error;
  return data;
}

export async function updateAttendanceRecord(id: number, payload: TablesUpdate<"attendance_records">) {
  const { data, error } = await supabase
    .from("attendance_records")
    .update(payload)
    .eq("id", id)
    .select("*, employees!fk_attendance_records_employee(*)")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAttendanceRecord(id: number) {
  const { error } = await supabase
    .from("attendance_records")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getScanLogs() {
  const { data, error } = await supabase
    .from("attendance_logs")
    .select("*, employees!fk_attendance_logs_employee(*)")
    .order("log_time", { ascending: false });

  if (error) throw error;
  return data || [];
}
