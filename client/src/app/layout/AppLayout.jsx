import React, { useState } from 'react';
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
  Menu,
  X,
} from 'lucide-react';
import { cn, formatRoleLabel } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';

export function AppLayout() {
  const { user, role, switchRole, logout, availableRoles } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Role-aware navigation definitions
  const navItems = [
    {
      label: 'Dashboard',
      path: '/app/dashboard',
      icon: LayoutDashboard,
      roles: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.HR_MANAGER, ROLES.EMPLOYEE],
    },
    {
      label: 'Employees',
      path: '/app/employees',
      icon: Users,
      roles: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.HR_MANAGER],
    },
    {
      label: 'Contracts & Schedules',
      path: '/app/contracts',
      icon: FileSignature,
      roles: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.HR_MANAGER],
    },
    {
      label: 'Attendance',
      path: '/app/attendance',
      icon: Clock,
      roles: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.HR_MANAGER, ROLES.EMPLOYEE],
    },
    {
      label: 'Time Off',
      path: '/app/time-off',
      icon: CalendarDays,
      roles: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.HR_MANAGER, ROLES.EMPLOYEE],
    },
    {
      label: 'Payroll & Payslips',
      path: '/app/payroll',
      icon: Calculator,
      roles: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER],
    },
    {
      label: 'Reports & Analytics',
      path: '/app/reports',
      icon: BarChart3,
      roles: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER],
    },
    {
      label: 'Administration',
      path: '/app/admin',
      icon: ShieldCheck,
      roles: [ROLES.ADMIN],
    },
  ];

  const visibleNavItems = navItems.filter((item) => item.roles.includes(role));

  const getUserInitials = () => {
    if (!user?.name) return 'KK';
    const parts = user.name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const getRoleLabel = (roleName) => {
    switch (roleName) {
      case ROLES.ADMIN:
        return 'System Administrator';
      case ROLES.HR_PAYROLL_MANAGER:
        return 'HR Payroll Lead';
      case ROLES.HR_PAYROLL_USER:
        return 'Payroll Specialist';
      case ROLES.HR_MANAGER:
        return 'HR Manager';
      case ROLES.EMPLOYEE:
        return 'Staff Member';
      default:
        return 'HR Payroll Lead';
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#F8F6F1]">
      {/* Top Scrollable Area */}
      <div className="flex-1 p-4 overflow-y-auto no-scrollbar">
        {/* Brand Header with Uploaded Logo Centered */}
        <div className="relative flex items-center justify-center w-full px-1 py-1">
          <NavLink to="/app" className="block cursor-pointer">
            <img src="/logo.png" alt="PeoplePay Logo" className="h-14 sm:h-16 w-auto object-contain max-w-[210px] mx-auto" />
          </NavLink>
          {/* Close button for mobile drawer */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Widget */}
        <div className="bg-[#EFECE5] rounded-2xl p-4 my-5 flex flex-col items-center text-center relative border border-stone-200/60 shadow-2xs">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-[#1A1D20] text-white font-bold text-base flex items-center justify-center shadow-sm tracking-wider">
              {getUserInitials()}
            </div>
            <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#EFECE5] absolute bottom-0 right-0" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mt-2.5 truncate max-w-full">
            {user?.name || 'Kartik Kumar'}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium truncate max-w-full mt-0.5">
            {getRoleLabel(role)}
          </p>
        </div>

        {/* Navigation Items */}
        <nav data-testid="sidebar-nav" className="space-y-1.5">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/app' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold tracking-wide transition-all group',
                  isActive
                    ? 'bg-[#1A1D20] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-stone-200/60 hover:text-slate-900'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0',
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-800'
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {item.path === '/app/payroll' && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Pinned Sticky Bottom Section: Role Switcher & Light Red Logout Button */}
      <div className="p-4 border-t border-stone-200/80 bg-[#F8F6F1] shrink-0 space-y-3">
        {/* Role Tester */}
        <div className="bg-[#EFECE5]/80 p-2.5 rounded-xl border border-stone-200/50">
          <label className="block text-[9px] uppercase font-bold tracking-wider text-slate-500 mb-1 flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-emerald-600" />
            Switch Role (Demo)
          </label>
          <div className="relative">
            <select
              aria-label="Demo role selector"
              value={role || ''}
              onChange={(e) => switchRole(e.target.value)}
              className="w-full text-[11px] bg-white border border-stone-300 rounded-lg px-2 py-1 text-slate-800 font-semibold focus:ring-1 focus:ring-slate-900 focus:outline-none appearance-none pr-6 cursor-pointer shadow-2xs"
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {formatRoleLabel(r)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Sticky Light Red Logout Button */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100/90 active:bg-rose-200 border border-rose-200/90 rounded-xl transition-all shadow-2xs cursor-pointer group"
        >
          <LogOut className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-[#FAF8F5] flex flex-col md:flex-row font-sans text-slate-800 overflow-hidden">
      {/* Mobile Top Header Bar */}
      <header className="md:hidden bg-[#F8F6F1] border-b border-stone-200/80 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-2">
          <NavLink to="/app" className="block">
            <img src="/logo.png" alt="PeoplePay Logo" className="h-8 w-auto object-contain" />
          </NavLink>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono">
            {formatRoleLabel(role)}
          </span>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
            className="p-2 rounded-xl text-slate-700 hover:bg-stone-200/60 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex w-64 bg-[#F8F6F1] flex-col shrink-0 border-r border-stone-200/80 h-full overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-[#F8F6F1] h-full shadow-2xl z-10 flex flex-col">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content Workspace Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#FAF8F5]">
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
