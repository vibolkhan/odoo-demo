import { createRouter, createWebHistory } from "@ionic/vue-router";
import TabsPage from "@/views/TabsPage.vue";
import { useAuthStore } from "@/stores/auth";

const routes = [
  {
    path: "/",
    redirect: "/tabs/tab1",
  },
  {
    path: "/auth",
    name: "auth",
    component: () => import("@/views/AuthPage.vue"),
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
        redirect: "/tabs/tab1",
      },
      {
        path: "tab1",
        name: "tab1",
        component: () => import("@/views/Tab1Page.vue"),
      },
      {
        path: "tab2",
        name: "tab2",
        component: () => import("@/views/Tab2Page.vue"),
      },
      {
        path: "tab3",
        name: "tab3",
        component: () => import("@/views/Tab3Page.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.initialize();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return "/auth";
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return "/tabs/tab1";
  }

  return true;
});

export default router;
