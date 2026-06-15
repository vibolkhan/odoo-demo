import { supabase } from "@/lib/supabase";

export async function getTodayDashboardSummary() {
  const today = new Date().toISOString().slice(0, 10);
  const [
    { count: totalEmployees, error: employeeError },
    { data: attendance, error: attendanceError },
    { count: pendingLeave, error: leaveError },
    { count: pendingOT, error: overtimeError },
    { count: pendingCorrections, error: correctionError },
  ] = await Promise.all([
    supabase.from("employees").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("attendance_records").select("*").eq("attendance_date", today),
    supabase.from("leave_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("overtime_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("attendance_corrections")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const error =
    employeeError || attendanceError || leaveError || overtimeError || correctionError;
  if (error) throw error;

  const records = attendance || [];
  return {
    totalEmployees: totalEmployees || 0,
    presentToday: records.filter((record) => record.status === "present").length,
    lateToday: records.filter((record) => record.status === "late").length,
    absentToday: records.filter((record) => record.status === "absent").length,
    missingCheckout: records.filter((record) => record.check_in && !record.check_out).length,
    pendingLeave: pendingLeave || 0,
    pendingOT: pendingOT || 0,
    pendingCorrections: pendingCorrections || 0,
  };
}

export async function getQrLocations() {
  // Remove the cast after regenerating types with qr_locations included.
  const qrLocations = (supabase as any).from("qr_locations");
  const { data, error } = await qrLocations.select("*").order("name");
  if (error) throw error;
  return data || [];
}

export async function createQrLocation(payload: Record<string, unknown>) {
  const qrLocations = (supabase as any).from("qr_locations");
  const { data, error } = await qrLocations.insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateQrLocation(id: number, payload: Record<string, unknown>) {
  const qrLocations = (supabase as any).from("qr_locations");
  const { data, error } = await qrLocations.update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export function disableQrLocation(id: number) {
  return updateQrLocation(id, { is_active: false });
}
