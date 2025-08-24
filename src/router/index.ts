import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/sales',
      name: 'sales',
      component: () => import('../views/sales/SalesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: () => import('../views/inventory/InventoryView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/purchases',
      name: 'purchases',
      component: () => import('../views/purchases/PurchasesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/branches',
      name: 'branches',
      component: () => import('../views/branches/BranchesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('../views/reports/ReportsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/receipts',
      name: 'receipts',
      component: () => import('../views/receipts/ReceiptsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/employees',
      name: 'employees',
      component: () => import('../views/employees/EmployeesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/crm',
      name: 'crm',
      component: () => import('../views/crm/CRMView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/end-of-day',
      name: 'end-of-day',
      component: () => import('../views/endofday/EndOfDayView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: () => import('../views/analytics/AnalyticsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/hardware/pos',
      name: 'pos-hardware',
      component: () => import('../views/hardware/POSHardwareView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/hardware/kitchen-display',
      name: 'kitchen-display',
      component: () => import('../views/hardware/KitchenDisplayView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/hardware/menu-boards',
      name: 'menu-boards',
      component: () => import('../views/hardware/MenuBoardsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/hardware/iot-monitoring',
      name: 'iot-monitoring',
      component: () => import('../views/hardware/IoTMonitoringView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mobile/staff',
      name: 'mobile-staff',
      component: () => import('../views/mobile/StaffMobileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mobile/customer',
      name: 'mobile-customer',
      component: () => import('../views/mobile/CustomerMobileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mobile/manager',
      name: 'mobile-manager',
      component: () => import('../views/mobile/ManagerMobileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mobile/delivery-tracking',
      name: 'mobile-delivery',
      component: () => import('../views/mobile/DeliveryTrackingView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('auth_token') // Simple auth check

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
