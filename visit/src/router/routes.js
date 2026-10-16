const routes = [
  {
    path: "/",
    component: () => import("@/layouts/MainLayout.vue"),
    children: [{ path: "", component: () => import("@/pages/HomePage.vue") }],
  },
  {
    path: "/step/:name",
    component: () => import("@/pages/InterviewStep.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/login",
    component: () => import("@/pages/LoginPage.vue"),
  },
  {
    path: "/go",
    redirect: "/login",
  },
  {
    path: "/go/:code",
    component: () => import("@/pages/LoginPage.vue"),
  },
  {
    path: "/forgot-password",
    component: () => import("@/pages/ForgotPasswordPage.vue"),
  },
  {
    path: "/reset-password",
    component: () => import("@/pages/ResetPasswordPage.vue"),
  },
  {
    path: "/register",
    component: () => import("@/pages/RegisterPage.vue"),
  },
  {
    path: "/verify",
    component: () => import("@/pages/VerifyPage.vue"),
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("@/pages/ErrorNotFound.vue"),
  },
];

export default routes;
