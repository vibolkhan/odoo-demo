import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type CurrentUserContext = {
  authUser: User;
  appUser: Record<string, any>;
  employee: Record<string, any> | null;
  role: string | null;
};

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentAuthUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function loadAppUserProfile(authUserId: string) {
  // Regenerate database.types.ts after applying the current SQL schema.
  const appUsers = supabase.from("app_users") as any;
  const { data, error } = await appUsers
    .select(`
      *,
      roles!fk_app_users_role(*),
      employees!fk_app_users_employee(
        *,
        departments!fk_employees_department(*),
        positions!fk_employees_position(*)
      )
    `)
    .eq("auth_user_id", authUserId)
    .single();

  if (error) throw error;
  return data;
}

export async function loadCurrentUserContext(): Promise<CurrentUserContext | null> {
  const authUser = await getCurrentAuthUser();

  if (!authUser) return null;

  const appUser = await loadAppUserProfile(authUser.id);

  if (!appUser.is_active) {
    throw new Error("This application account is inactive.");
  }

  if (!appUser.roles?.name) {
    throw new Error("No application role is assigned to this account.");
  }

  return {
    authUser,
    appUser,
    employee: appUser.employees,
    role: appUser.roles?.name ?? null,
  };
}
