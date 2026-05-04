import { defineStore } from "pinia";
import {
  buildUrl,
  clearPersistedSession,
  loginRequest,
  logoutRequest,
  restoreStoredSession,
} from "@/api/auth.api";

const getDefaultState = () => ({
  sessionReady: false,
  isAuthenticated: false,
  username: "",
  userId: null,
  loading: false,
  error: "",
});

export const useAuthStore = defineStore("auth", {
  state: () => getDefaultState(),

  getters: {
    displayName: (state) => state.username || "Guest User",
    hasSession: (state) => state.isAuthenticated && Boolean(state.userId),
    loginBaseUrl: () => buildUrl(),
  },

  actions: {
    applySession(session) {
      this.isAuthenticated = Boolean(session?.authenticated);
      this.username = session?.username || "";
      this.userId = session?.userId ?? null;
      this.sessionReady = true;
    },

    clearSessionState() {
      Object.assign(this, {
        ...getDefaultState(),
        sessionReady: true,
      });
    },

    async hydrateSession() {
      const session = await restoreStoredSession();
      this.applySession(session);
      return this.isAuthenticated;
    },

    async login(username, password) {
      this.loading = true;
      this.error = "";

      try {
        const user = await loginRequest(username, password);
        await this.hydrateSession();
        return user;
      } catch (error) {
        await clearPersistedSession();
        this.clearSessionState();
        this.error =
          error instanceof Error
            ? error.message
            : "Unable to sign in right now. Please try again.";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      this.loading = true;
      this.error = "";

      try {
        await logoutRequest();
      } finally {
        this.clearSessionState();
        const { useUserStore } = await import("@/stores/user.store");
        const { useTimeoffStore } = await import("@/stores/timeoff.store");

        useUserStore().resetState();
        useTimeoffStore().resetState();
        this.loading = false;
      }
    },
  },
});
