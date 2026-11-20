import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import ApplicationsPage from '../pages/ApplicationsPage.jsx'
import DashboardPage from '../pages/DashboardPage.jsx'
import { LoginPage, RegistrationPage } from '../pages/AuthPage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'
import { GuestRoute, ProtectedRoute } from '../components/auth/RouteGuards.jsx'
import LoadingState from '../components/ui/LoadingState.jsx'

const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage.jsx'))

const router = createBrowserRouter([
  { element: <GuestRoute />, children: [
    { path: '/login', element: <LoginPage /> },
    { path: '/register', element: <RegistrationPage /> },
  ] },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <DashboardLayout />, children: [
        { index: true, element: <DashboardPage /> },
        { path: 'applications', element: <ApplicationsPage /> },
        { path: 'analytics', element: <Suspense fallback={<LoadingState label="Loading analytics…" />}><AnalyticsPage /></Suspense> },
      ] },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
