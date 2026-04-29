import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
import TabsPage from "../views/TabsPage.vue";
import { isAuthenticated } from "@/utils/auth";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/tabs/leave-calendar",
  },
  {
    path: "/login",
    component: () => import("@/views/LoginPage.vue"),
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
        path: "tab1",
        component: () => import("@/views/LeaveTypesPage.vue"),
      },
      {
        path: "tab2",
        redirect: "/tabs/tab4",
      },
      {
        path: "tab3",
        component: () => import("@/views/ProfilePage.vue"),
      },
      {
        path: "tab4",
        component: () => import("@/views/RequestListPage.vue"),
      },
      {
        path: "leave-balance",
        component: () => import("@/views/LeaveBalancePage.vue"),
      },
      {
        path: "leave-calendar",
        component: () => import("@/views/LeaveCalendarPage.vue"),
      },
      {
        path: "admin-attendance",
        component: () => import("@/views/AdminAttendancePage.vue"),
      },
      {
        path: "leave-approval",
        component: () => import("@/views/LeaveApprovalPage.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  const loggedIn = isAuthenticated();

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
