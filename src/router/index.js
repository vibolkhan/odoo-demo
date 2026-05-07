import { createRouter, createWebHistory } from "@ionic/vue-router";
import TabsPage from "../views/layout/TabsPage.vue";
import { useAuthStore } from "@/stores/auth.store";
import { pinia } from "@/stores";

const routes = [
  {
    path: "/",
    redirect: "/tabs/leave-calendar",
  },
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/auth/LoginPage.vue"),
    meta: {
      guestOnly: true,
    },
  },
  {
    path: "/tabs/",
    component: TabsPage,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: "",
        redirect: "/tabs/leave-calendar",
      },
      {
        path: "leave-types",
        name: "leave-types",
        component: () => import("@/views/leave/LeaveTypesPage.vue"),
      },
      {
        path: "profile",
        name: "profile",
        component: () => import("@/views/profile/ProfilePage.vue"),
      },
      {
        path: "requests",
        name: "requests",
        component: () => import("@/views/leave/RequestListPage.vue"),
      },
      {
        path: "leave-balance",
        name: "leave-balance",
        component: () => import("@/views/leave/LeaveBalancePage.vue"),
      },
      {
        path: "leave-calendar",
        name: "leave-calendar",
        component: () => import("@/views/leave/LeaveCalendarPage.vue"),
      },
      {
        path: "admin-attendance",
        name: "admin-attendance",
        component: () => import("@/views/attendance/AdminAttendancePage.vue"),
      },
      {
        path: "my-attendance",
        name: "my-attendance",
        component: () => import("@/views/attendance/MyAttendancePage.vue"),
      },
      {
        path: "leave-approval",
        name: "leave-approval",
        component: () => import("@/views/leave/LeaveApprovalPage.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore(pinia);
  if (!authStore.sessionReady) {
    await authStore.hydrateSession();
  }
  const loggedIn = authStore.isAuthenticated;

  if (to.meta.requiresAuth && !loggedIn) {
    return {
      path: "/login",
      query: {
        redirect: to.fullPath,
      },
    };
  }

  if (to.meta.guestOnly && loggedIn) {
    return "/tabs/leave-calendar";
  }

  return true;
});

export default router;
