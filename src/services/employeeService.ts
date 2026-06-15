import type { TablesInsert, TablesUpdate } from "@/types/database.types";
import { supabase } from "@/lib/supabase";

export async function getEmployees() {
  const { data, error } = await supabase
    .from("employees")
    .select(`
      *,
      departments!fk_employees_department(*),
      positions!fk_employees_position(*)
    `)
    .order("id");

  if (error) throw error;
  return data || [];
}

export async function getEmployeeById(id: number) {
  const { data, error } = await supabase
    .from("employees")
    .select(`
      *,
      departments!fk_employees_department(*),
      positions!fk_employees_position(*)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createEmployee(payload: TablesInsert<"employees">) {
  const { data, error } = await supabase.from("employees").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateEmployee(id: number, payload: TablesUpdate<"employees">) {
  const { data, error } = await supabase
    .from("employees")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function deactivateEmployee(id: number) {
  return updateEmployee(id, { status: "inactive" });
}
