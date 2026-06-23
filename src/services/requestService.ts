import type { TablesInsert } from "@/types/database.types";
import { supabase } from "@/lib/supabase";

type RequestTable = "leave_requests" | "overtime_requests" | "attendance_corrections";

async function getRequests(table: RequestTable, employeeId?: number) {
  let query = supabase
    .from(table)
    .select(`
      *,
      employees!fk_${table}_employee(id, first_name, last_name, employee_code)
    `)
    .order("created_at", { ascending: false });
  if (employeeId) query = query.eq("employee_id", employeeId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function updateRequestStatus(table: RequestTable, id: number, status: string, rejectionReason?: string) {
  const { data, error } = await supabase
    .from(table)
    .update({ status, rejection_reason: rejectionReason || null })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export const getLeaveRequests = (employeeId?: number) => getRequests("leave_requests", employeeId);
export const getOvertimeRequests = (employeeId?: number) =>
  getRequests("overtime_requests", employeeId);
export const getCorrectionRequests = (employeeId?: number) =>
  getRequests("attendance_corrections", employeeId);

export async function createLeaveRequest(payload: TablesInsert<"leave_requests">) {
  const { data, error } = await supabase.from("leave_requests").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function createOvertimeRequest(payload: TablesInsert<"overtime_requests">) {
  const { data, error } = await supabase.from("overtime_requests").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function createCorrectionRequest(payload: TablesInsert<"attendance_corrections">) {
  const { data, error } = await supabase
    .from("attendance_corrections")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export const setLeaveRequestStatus = (id: number, status: string, reason?: string) =>
  updateRequestStatus("leave_requests", id, status, reason);
export const setOvertimeRequestStatus = (id: number, status: string, reason?: string) =>
  updateRequestStatus("overtime_requests", id, status, reason);
export const setCorrectionRequestStatus = (id: number, status: string, reason?: string) =>
  updateRequestStatus("attendance_corrections", id, status, reason);
