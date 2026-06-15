import type { Session, User } from "@supabase/supabase-js";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { supabase } from "@/lib/supabase";
import {
  loadCurrentUserContext,
  login,
  logout,
  type CurrentUserContext,
} from "@/services/authService";

type AppUser = CurrentUserContext["appUser"];
type Employee = CurrentUserContext["employee"];

export const useAuthStore = defineStore("auth", () => {
  const initialized = ref(false);
  const loading = ref(false);
  const session = ref<Session | null>(null);
  const authUser = ref<User | null>(null);
  const appUser = ref<AppUser | null>(null);
  const employee = ref<Employee>(null);
  const role = ref<string | null>(null);
  const roleName = role;

  const user = computed(() => authUser.value || session.value?.user || null);
  const isAuthenticated = computed(() => Boolean(user.value));
  const isAdminOrHR = computed(() => ["Admin", "HR Manager"].includes(role.value || ""));
  const isAdmin = computed(() => role.value === "Admin");
  const isHR = computed(() => role.value === "HR Manager");
  const isManager = computed(() => role.value === "Manager");
  const isEmployee = computed(() => role.value === "Employee");

  function clearContext() {
    session.value = null;
    authUser.value = null;
    appUser.value = null;
    employee.value = null;
    role.value = null;
  }

  async function loadSession() {
    const context = await loadCurrentUserContext();

    if (!context) {
      clearContext();
      return null;
    }

    authUser.value = context.authUser;
    appUser.value = context.appUser;
    employee.value = context.employee;
    role.value = context.role;
    return context;
  }

  async function loadProfile() {
    return loadSession();
  }

  async function initialize() {
    if (initialized.value) return;

    loading.value = true;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      session.value = data.session;
      if (data.session) await loadSession();
      initialized.value = true;

      supabase.auth.onAuthStateChange((_event, nextSession) => {
        session.value = nextSession;
        if (!nextSession) clearContext();
      });
    } catch (error) {
      await supabase.auth.signOut();
      clearContext();
      initialized.value = true;
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function loginAction(email: string, password: string) {
    loading.value = true;
    try {
      const data = await login(email, password);
      session.value = data.session;
      await loadSession();
      return data;
    } catch (error) {
      await supabase.auth.signOut();
      clearContext();
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function logoutAction() {
    loading.value = true;
    try {
      await logout();
      clearContext();
    } finally {
      loading.value = false;
    }
  }

  function hasRole(...allowedRoles: string[]) {
    return allowedRoles.includes(role.value || "");
  }

  return {
    appUser,
    authUser,
    employee,
    hasRole,
    initialized,
    isAdminOrHR,
    isAdmin,
    isHR,
    isAuthenticated,
    isEmployee,
    isManager,
    loading,
    role,
    roleName,
    session,
    user,
    initialize,
    loadSession,
    loadProfile,
    loginAction,
    logoutAction,
    signIn: loginAction,
    signOut: logoutAction,
    login: loginAction,
    logout: logoutAction,
  };
});
