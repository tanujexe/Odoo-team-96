import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { ROLES } from './auth/AuthContext';

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

export const router = createBrowserRouter([
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
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardFeature />,
      },
      {
        path: 'employees/*',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.HR_MANAGER, ROLES.EMPLOYEE]}>
            <EmployeesFeature />
          </ProtectedRoute>
        ),
      },
      {
        path: 'contracts/*',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.HR_MANAGER]}>
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
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER]}>
            <PayrollFeature />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports/*',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.HR_MANAGER]}>
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
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
