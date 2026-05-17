import { CapacitorHttp } from "@capacitor/core";

export const ODOO_BASE_URL = import.meta.env.VITE_ODOO_BASE_URL;
export const WEB_PROXY_BASE = "/odoo-api";

export const postJson = async (url, data) => {
  const response = await CapacitorHttp.post({
    url,
    headers: {
      "Content-Type": "application/json",
    },
    data,
    webFetchExtra: {
      credentials: "include",
    },
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Request failed with status ${response.status}.`);
  }

  return response.data;
};

export const odooHttp = {
  post: async (url, data) => ({
    data: await postJson(url, data),
  }),
};
