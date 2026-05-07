import { defineStore } from "pinia";
import {
  buildUrl,
  clearPersistedSession,
  loginRequest,
  logoutRequest,
  restoreStoredSession,
} from "@/api/auth.api";
import { createAsyncState, runAsync } from "@/utils/async-state";

const getDefaultState = () => ({
  sessionReady: false,
  isAuthenticated: false,
  username: "",
  userId: null,
  asyncState: createAsyncState(),
});

export const useAuthStore = defineStore("auth", {
  state: () => getDefaultState(),

  getters: {
    displayName: (state) => state.username || "Guest User",
    hasSession: (state) => state.isAuthenticated && Boolean(state.userId),
    loginBaseUrl: () => buildUrl(),
    isLoading: (state) => state.asyncState.status === "loading",
    error: (state) => state.asyncState.error,
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

    async hydrateSession(force = false) {
      if (this.sessionReady && !force) return this.isAuthenticated;

      try {
        const session = await restoreStoredSession();
        this.applySession(session);
      } catch {
        await clearPersistedSession();
        this.clearSessionState();
      }

      return this.isAuthenticated;
    },

    async login(username, password) {
      return runAsync(this.asyncState, async () => {
        try {
          const user = await loginRequest(username, password);
          await this.hydrateSession(true);
          return user;
        } catch (error) {
          await clearPersistedSession();
          this.clearSessionState();
          throw error;
        }
      });
    },

    async logout() {
      return runAsync(this.asyncState, async () => {
        try {
          await logoutRequest();
        } finally {
          this.clearSessionState();
          const { useUserStore } = await import("@/stores/user.store");
          const { useTimeoffStore } = await import("@/stores/timeoff.store");

          useUserStore().resetState();
          useTimeoffStore().resetState();
        }
      });
    },
  },
});
