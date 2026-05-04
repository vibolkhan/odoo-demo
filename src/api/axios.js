import axios from "axios";

export const ODOO_BASE_URL = "https://mrp.staging-sourceamax.asia";
export const WEB_PROXY_BASE = "/odoo-api";

export const odooAxios = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});
