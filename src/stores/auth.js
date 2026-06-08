import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { supabase } from "@/lib/supabase";

export const useAuthStore = defineStore("auth", () => {
  const initialized = ref(false);
  const loading = ref(false);
  const session = ref(null);
  const user = computed(() => session.value?.user ?? null);
  const isAuthenticated = computed(() => Boolean(user.value));

  async function initialize() {
    if (initialized.value) return;

    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    session.value = data.session;
    initialized.value = true;

    supabase.auth.onAuthStateChange((_event, nextSession) => {
      session.value = nextSession;
    });
  }

  async function signIn(email, password) {
    loading.value = true;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      session.value = data.session;
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function signUp(email, password) {
    loading.value = true;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      session.value = data.session;
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function signOut() {
    loading.value = true;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      session.value = null;
    } finally {
      loading.value = false;
    }
  }

  return {
    initialized,
    isAuthenticated,
    loading,
    session,
    user,
    initialize,
    signIn,
    signOut,
    signUp,
  };
});
