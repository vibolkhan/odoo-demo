import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import axios from "axios";
import { ODOO_BASE_URL, WEB_PROXY_BASE, odooAxios } from "@/api/axios";

const STORAGE_KEY = "odoo-demo-session";
const LEGACY_STORAGE_KEYS = {
  authenticated: "odoo-demo-authenticated",
  username: "odoo-demo-username",
  uid: "odoo-demo-uid",
};

const ODOO_DATABASE = import.meta.env.VITE_ODOO_DATABASE;
const AUTH_ENDPOINT = "/web/session/authenticate";
const LOGOUT_ENDPOINT = "/web/session/destroy";

export const DEFAULT_ALLOWED_COMPANY_IDS = [1];
export const DEFAULT_COMPANY_ID = 1;
export const SESSION_EXPIRED_ERROR_CODE = "SESSION_EXPIRED";

const hasBrowserStorage = () => typeof window !== "undefined";

export const isNativePlatform = () => Capacitor.isNativePlatform();

export const buildUrl = (path = "") => {
  if (isNativePlatform()) {
    return `${ODOO_BASE_URL}${path}`;
  }

  if (import.meta.env.DEV) {
    return `${WEB_PROXY_BASE}${path}`;
  }

  return `${ODOO_BASE_URL}${path}`;
};

export const createSessionExpiredError = (message) => {
  const error = new Error(message);
  error.code = SESSION_EXPIRED_ERROR_CODE;
  return error;
};

export const containsSessionExpiredText = (text) => {
  if (!text) return false;

  const value = text.toLowerCase();

  return [
    "session expired",
    "session has expired",
    "invalid session",
    "session is invalid",
    "authentication required",
    "access denied",
  ].some((message) => value.includes(message));
};

export const isSessionExpiredError = (error) => {
  if (!error) return false;

  return (
    containsSessionExpiredText(error.message) ||
    containsSessionExpiredText(error.data?.message) ||
    containsSessionExpiredText(error.data?.debug) ||
    error.data?.name === "odoo.http.SessionExpiredException"
  );
};

const removeLegacyStorage = () => {
  if (!hasBrowserStorage()) return;

  localStorage.removeItem(LEGACY_STORAGE_KEYS.authenticated);
  localStorage.removeItem(LEGACY_STORAGE_KEYS.username);
  localStorage.removeItem(LEGACY_STORAGE_KEYS.uid);
};

const writeSessionToLocalStorage = (session) => {
  if (!hasBrowserStorage()) return;

  if (!session?.authenticated) {
    localStorage.removeItem(STORAGE_KEY);
    removeLegacyStorage();
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  localStorage.setItem(LEGACY_STORAGE_KEYS.authenticated, "true");
  localStorage.setItem(LEGACY_STORAGE_KEYS.username, session.username || "");

  if (session.userId) {
    localStorage.setItem(LEGACY_STORAGE_KEYS.uid, String(session.userId));
  } else {
    localStorage.removeItem(LEGACY_STORAGE_KEYS.uid);
  }
};

const readLegacySession = () => {
  if (!hasBrowserStorage()) return null;

  const authenticated =
    localStorage.getItem(LEGACY_STORAGE_KEYS.authenticated) === "true";

  if (!authenticated) {
    return null;
  }

  const username = localStorage.getItem(LEGACY_STORAGE_KEYS.username) || "";
  const userId = Number(localStorage.getItem(LEGACY_STORAGE_KEYS.uid));

  return {
    authenticated: true,
    username,
    userId: Number.isFinite(userId) && userId > 0 ? userId : null,
  };
};

const redirectToLoginPage = () => {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;

  const currentUrl =
    window.location.pathname + window.location.search + window.location.hash;

  const loginUrl = new URL("/login", window.location.origin);
  loginUrl.searchParams.set("redirect", currentUrl);

  window.location.replace(loginUrl.toString());
};

export const restoreStoredSession = async () => {
  const preferenceResult = await Preferences.get({ key: STORAGE_KEY });

  if (preferenceResult.value) {
    try {
      const session = JSON.parse(preferenceResult.value);
      writeSessionToLocalStorage(session);
      return session;
    } catch {
      await Preferences.remove({ key: STORAGE_KEY });
    }
  }

  const browserSession = hasBrowserStorage()
    ? localStorage.getItem(STORAGE_KEY)
    : null;

  if (browserSession) {
    try {
      const session = JSON.parse(browserSession);
      await Preferences.set({
        key: STORAGE_KEY,
        value: JSON.stringify(session),
      });
      return session;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const legacySession = readLegacySession();

  if (legacySession) {
    await persistSession(legacySession);
    return legacySession;
  }

  return {
    authenticated: false,
    username: "",
    userId: null,
  };
};

export const persistSession = async (session) => {
  const nextSession = {
    authenticated: Boolean(session?.authenticated),
    username: session?.username || "",
    userId:
      Number.isFinite(Number(session?.userId)) && Number(session?.userId) > 0
        ? Number(session.userId)
        : null,
  };

  await Preferences.set({
    key: STORAGE_KEY,
    value: JSON.stringify(nextSession),
  });

  writeSessionToLocalStorage(nextSession);

  return nextSession;
};

export const clearPersistedSession = async () => {
  await Preferences.remove({ key: STORAGE_KEY });

  if (hasBrowserStorage()) {
    localStorage.removeItem(STORAGE_KEY);
  }

  removeLegacyStorage();
};

export const handleExpiredSession = async () => {
  await clearPersistedSession();
  redirectToLoginPage();
};

const getOdooErrorMessage = (error) => error.data?.message || error.message;

export const loginRequest = async (username, password) => {
  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      db: ODOO_DATABASE,
      login: username,
      password,
    },
    id: 1,
  };
  let payload;

  try {
    if (isNativePlatform()) {
      const response = await CapacitorHttp.post({
        url: buildUrl(AUTH_ENDPOINT),
        headers: {
          "Content-Type": "application/json",
        },
        data: body,
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(String(response.status));
      }

      payload = response.data;
    } else {
      const response = await odooAxios.post(buildUrl(AUTH_ENDPOINT), body);
      payload = response.data;
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
      throw error;
    }

    throw error;
  }

  if (payload.error) {
    await clearPersistedSession();
    throw new Error(getOdooErrorMessage(payload.error));
  }

  const user = payload.result;
  const displayName = user?.username || username.trim();

  await persistSession({
    authenticated: true,
    username: displayName,
    userId: user?.uid ?? null,
  });

  return user;
};

export const logoutRequest = async () => {
  const body = {
    jsonrpc: "2.0",
    method: "call",
    params: {},
    id: 1,
  };

  try {
    if (isNativePlatform()) {
      const response = await CapacitorHttp.post({
        url: buildUrl(LOGOUT_ENDPOINT),
        headers: {
          "Content-Type": "application/json",
        },
        data: body,
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(String(response.status));
      }
    } else {
      await odooAxios.post(buildUrl(LOGOUT_ENDPOINT), body);
    }
  } catch {
    // Still clear persisted session even when the server logout fails.
  } finally {
    await clearPersistedSession();
  }
};
