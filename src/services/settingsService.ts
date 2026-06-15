import type { TablesInsert, TablesUpdate } from "@/types/database.types";
import { supabase } from "@/lib/supabase";

export async function getSettingsData() {
  const [departments, positions, schedules, leaveTypes, holidays, qrLocations] = await Promise.all([
    supabase.from("departments").select("*").order("name"),
    supabase.from("positions").select("*").order("title"),
    supabase.from("working_schedules").select("*").order("name"),
    supabase.from("leave_types").select("*").order("name"),
    supabase.from("public_holidays").select("*").order("holiday_date"),
    (supabase as any).from("qr_locations").select("*").order("name"),
  ]);
  const error = [departments, positions, schedules, leaveTypes, holidays, qrLocations].find((result) => result.error)?.error;
  if (error) throw error;
  return {
    departments: departments.data || [],
    positions: positions.data || [],
    schedules: schedules.data || [],
    leaveTypes: leaveTypes.data || [],
    holidays: holidays.data || [],
    qrLocations: qrLocations.data || [],
  };
}

export async function createDepartment(payload: TablesInsert<"departments">) {
  const { data, error } = await supabase.from("departments").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function createPosition(payload: TablesInsert<"positions">) {
  const { data, error } = await supabase.from("positions").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function createLeaveType(payload: TablesInsert<"leave_types">) {
  const { data, error } = await supabase.from("leave_types").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateLeaveType(id: number, payload: TablesUpdate<"leave_types">) {
  const { data, error } = await supabase.from("leave_types").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
