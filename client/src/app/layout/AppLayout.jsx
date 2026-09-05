import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth, ROLES } from '../auth/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileSignature,
  Clock,
  CalendarDays,
  Calculator,
  BarChart3,
  ShieldCheck,
  UserCheck,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';

export function AppLayout() {
  const { user, role, switchRole, logout, availableRoles } = useAuth();
  const location = useLocation();

  // Role-aware navigation definitions
  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.HR_MANAGER, ROLES.EMPLOYEE],
    },
    {
      label: 'Employees',
      path: '/employees',
      icon: Users,
      roles: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.HR_MANAGER],
    },
    {
      label: 'Contracts & Schedules',
      path: '/contracts',
      icon: FileSignature,
      roles: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.HR_MANAGER],
    },
    {
      label: 'Attendance',
      path: '/attendance',
      icon: Clock,
      roles: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.HR_MANAGER, ROLES.EMPLOYEE],
    },
    {
      label: 'Time Off',
      path: '/time-off',
      icon: CalendarDays,
      roles: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.HR_MANAGER, ROLES.EMPLOYEE],
    },
    {
      label: 'Payroll & Payslips',
      path: '/payroll',
      icon: Calculator,
      roles: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER],
    },
    {
      label: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
      roles: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.HR_MANAGER],
    },
    {
      label: 'Administration',
      path: '/admin',
      icon: ShieldCheck,
      roles: [ROLES.ADMIN],
    },
  ];

  const visibleNavItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800 bg-slate-950/40">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-900/30">
            P
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-tight">PeoplePay360</h1>
            <p className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Enterprise HR & Payroll</p>
          </div>
        </div>

        {/* Quick Role Tester Widget (Crucial for multi-role evaluation & demo) */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800/80">
          <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            Switch Active Role (Demo)
          </label>
          <div className="relative">
            <select
              aria-label="Demo role selector"
              value={role || ''}
              onChange={(e) => switchRole(e.target.value)}
              className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none appearance-none pr-8 cursor-pointer"
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Navigation Items */}
        <nav data-testid="sidebar-nav" className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all',
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Info Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white uppercase shrink-0">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-400 font-medium truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Workspace</span>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-800">
              {navItems.find((item) => (item.path !== '/' ? location.pathname.startsWith(item.path) : location.pathname === '/'))?.label || 'Overview'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Badge status={role} variant="COMPUTED" dot={true}>
              {role}
            </Badge>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
