import axios from "axios";

export const ODOO_BASE_URL = import.meta.env.VITE_ODOO_BASE_URL;
export const WEB_PROXY_BASE = "/odoo-api";

export const odooAxios = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});
