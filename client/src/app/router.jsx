import React from 'react';
import { createBrowserRouter, Navigate, useNavigate } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { ROLES, useAuth } from './auth/AuthContext';

// Feature Components
import DashboardFeature from '../features/reports/Dashboard';
import EmployeesFeature from '../features/employees';
import ContractsFeature from '../features/contracts';
import AttendanceFeature from '../features/attendance';
import TimeOffFeature from '../features/time-off';
import PayrollFeature from '../features/payroll';
import ReportsFeature from '../features/reports';
import AdminFeature from '../features/admin';
import LoginFeature from '../features/auth';
import HeroPage from '../pages/HeroPage';

/**
 * RoleBasedRedirect — index route of the protected app.
 * Reads current role and sends user to their default landing page.
 */
function RoleBasedRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  const role = user?.role;

  if (role === ROLES.ADMIN) return <Navigate to="/app/admin" replace />;
  if (role === ROLES.HR_PAYROLL_MANAGER || role === ROLES.HR_PAYROLL_USER)
    return <Navigate to="/app/payroll" replace />;
  if (role === ROLES.HR_MANAGER) return <Navigate to="/app/employees" replace />;
  if (role === ROLES.EMPLOYEE) return <Navigate to="/app/attendance" replace />;

  // Fallback for any other authenticated role
  return <Navigate to="/app/reports" replace />;
}

/**
 * NotFound — shown for any URL that doesn't match a defined route.
 */
function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
      <div className="text-8xl font-black text-emerald-600 mb-4">404</div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h1>
      <p className="text-slate-500 mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
      >
        Go Home
      </button>
    </div>
  );
}

export const router = createBrowserRouter([
  // ── Public routes ──────────────────────────────────────────────────────────
  {
    // Root: public marketing / landing page
    path: '/',
    element: <HeroPage />,
  },
  {
    path: '/login',
    element: <LoginFeature />,
  },
  {
    path: '/hero',
    element: <HeroPage />,
  },
  {
    path: '/landing',
    element: <HeroPage />,
  },

  // ── Protected app shell (all app pages live under /app) ────────────────────
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        // /app → smart redirect to each role's home
        index: true,
        element: <RoleBasedRedirect />,
      },
      {
        path: 'dashboard',
        element: <DashboardFeature />,
      },
      {
        path: 'employees/*',
        element: (
          <ProtectedRoute
            allowedRoles={[
              ROLES.ADMIN,
              ROLES.HR_PAYROLL_MANAGER,
              ROLES.HR_PAYROLL_USER,
              ROLES.HR_MANAGER,
              ROLES.EMPLOYEE,
            ]}
          >
            <EmployeesFeature />
          </ProtectedRoute>
        ),
      },
      {
        path: 'contracts/*',
        element: (
          <ProtectedRoute
            allowedRoles={[
              ROLES.ADMIN,
              ROLES.HR_PAYROLL_MANAGER,
              ROLES.HR_PAYROLL_USER,
              ROLES.HR_MANAGER,
            ]}
          >
            <ContractsFeature />
          </ProtectedRoute>
        ),
      },
      {
        path: 'attendance/*',
        element: <AttendanceFeature />,
      },
      {
        path: 'time-off/*',
        element: <TimeOffFeature />,
      },
      {
        path: 'payroll/*',
        element: (
          <ProtectedRoute
            allowedRoles={[
              ROLES.ADMIN,
              ROLES.HR_PAYROLL_MANAGER,
              ROLES.HR_PAYROLL_USER,
            ]}
          >
            <PayrollFeature />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports/*',
        element: (
          <ProtectedRoute
            allowedRoles={[
              ROLES.ADMIN,
              ROLES.HR_PAYROLL_MANAGER,
              ROLES.HR_PAYROLL_USER,
            ]}
          >
            <ReportsFeature />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/*',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminFeature />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // ── Legacy redirects: old root-level paths → /app equivalents ─────────────
  { path: '/employees/*', element: <Navigate to="/app/employees" replace /> },
  { path: '/contracts/*', element: <Navigate to="/app/contracts" replace /> },
  { path: '/attendance/*', element: <Navigate to="/app/attendance" replace /> },
  { path: '/time-off/*', element: <Navigate to="/app/time-off" replace /> },
  { path: '/payroll/*', element: <Navigate to="/app/payroll" replace /> },
  { path: '/reports/*', element: <Navigate to="/app/reports" replace /> },
  { path: '/admin/*', element: <Navigate to="/app/admin" replace /> },
  { path: '/dashboard', element: <Navigate to="/app/dashboard" replace /> },

  // ── 404 catch-all ─────────────────────────────────────────────────────────
  {
    path: '*',
    element: <NotFound />,
  },
]);
