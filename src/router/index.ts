import { createRouter, createWebHistory } from "@ionic/vue-router";
import AdminLayout from "@/layouts/AdminLayout.vue";
import EmployeeLayout from "@/layouts/EmployeeLayout.vue";
import { useAuthStore } from "@/stores/auth";

const adminRoles = ["Admin", "HR Manager"];
const employeeRoles = ["Manager", "Employee"];

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", name: "login", component: () => import("@/pages/auth/LoginPage.vue"), meta: { guestOnly: true } },
  {
    path: "/employee/tabs", component: EmployeeLayout, meta: { requiresAuth: true, roles: employeeRoles },
    children: [
      { path: "", redirect: "/employee/tabs/home" },
      { path: "home", component: () => import("@/pages/employee/EmployeeHomePage.vue") },
      { path: "scan", component: () => import("@/pages/employee/ScanPage.vue") },
      { path: "attendance", component: () => import("@/pages/employee/MyAttendancePage.vue") },
      { path: "requests", component: () => import("@/pages/employee/RequestsPage.vue") },
      { path: "profile", component: () => import("@/pages/employee/ProfilePage.vue") },
    ],
  },
  {
    path: "/admin/tabs", component: AdminLayout, meta: { requiresAuth: true, roles: adminRoles },
    children: [
      { path: "", redirect: "/admin/tabs/dashboard" },
      { path: "dashboard", component: () => import("@/pages/admin/AdminDashboardPage.vue") },
      { path: "scan", component: () => import("@/pages/employee/ScanPage.vue") },
      { path: "employees", component: () => import("@/pages/admin/EmployeesPage.vue") },
      { path: "attendance", component: () => import("@/pages/admin/AdminAttendancePage.vue") },
      { path: "requests", component: () => import("@/pages/admin/AdminRequestsPage.vue") },
      { path: "settings", component: () => import("@/pages/admin/SettingsPage.vue") },
    ],
  },
  { path: "/employee/:pathMatch(.*)*", redirect: "/employee/tabs/home" },
  { path: "/admin/:pathMatch(.*)*", redirect: "/admin/tabs/dashboard" },
  { path: "/:pathMatch(.*)*", redirect: "/login" },
];

const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes });

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  try { await auth.initialize(); } catch (error) { console.error("Unable to restore session.", error); }
  const home = auth.isAdminOrHR ? "/admin/tabs/dashboard" : "/employee/tabs/home";
  if (to.meta.requiresAuth && !auth.isAuthenticated) return "/login";
  if (to.meta.guestOnly && auth.isAuthenticated) return home;
  const allowedRoles = to.meta.roles as string[] | undefined;
  if (allowedRoles && !allowedRoles.includes(auth.roleName || "")) return home;
  return true;
});

export default router;
