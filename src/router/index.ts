import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'
import { isAuthenticated } from '@/utils/auth'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/tab1'
  },
  {
    path: '/login',
    component: () => import('@/views/LoginPage.vue'),
    meta: {
      guestOnly: true
    }
  },
  {
    path: '/tabs/',
    component: TabsPage,
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '',
        redirect: '/tabs/tab1'
      },
      {
        path: 'tab1',
        component: () => import('@/views/LeaveTypesPage.vue')
      },
      {
        path: 'tab2',
        redirect: '/tabs/tab4'
      },
      {
        path: 'tab3',
        component: () => import('@/views/ProfilePage.vue')
      },
      {
        path: 'tab4',
        component: () => import('@/views/RequestListPage.vue')
      },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to) => {
  const loggedIn = isAuthenticated()

  if (to.meta.requiresAuth && !loggedIn) {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    }
  }

  if (to.meta.guestOnly && loggedIn) {
    return '/tabs/tab1'
  }

  return true
})

export default router
