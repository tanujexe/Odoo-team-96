import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth, ROLES } from '../auth/AuthContext';
import { fetchEmployees } from '../../lib/api/employees';
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
  const [employeeCount, setEmployeeCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    fetchEmployees().then((employees) => {
      if (isMounted) setEmployeeCount(employees.length);
    });

    return () => {
      isMounted = false;
    };
  }, []);

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
      roles: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER],
    },
    {
      label: 'Administration',
      path: '/admin',
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

  return (
    <div className="h-screen w-screen bg-[#FAF8F5] flex flex-col md:flex-row font-sans text-slate-800 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#F8F6F1] flex flex-col shrink-0 border-b md:border-b-0 md:border-r border-stone-200/80 p-5 justify-between overflow-y-auto no-scrollbar h-full">
        <div>
          {/* Brand Header with 4-dot mark */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-xl bg-white p-1.5 grid grid-cols-2 gap-1 shadow-xs border border-stone-200/60 shrink-0">
              <span className="bg-[#E0533C] rounded-full" />
              <span className="bg-[#22C55E] rounded-full" />
              <span className="bg-[#3B82F6] rounded-full" />
              <span className="bg-[#EAB308] rounded-full" />
            </div>
            <h1 className="font-extrabold text-slate-900 text-lg tracking-tight leading-tight">
              PeoplePay<span className="text-slate-700">360</span>
            </h1>
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
                (item.path !== '/' && location.pathname.startsWith(item.path));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
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

                    {/* Navigation Pills / Indicators matching reference UI */}
                    {item.path === '/employees' && (
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full',
                          isActive
                            ? 'bg-slate-700/80 text-white'
                            : 'bg-stone-200 text-slate-700'
                        )}
                      >
                        {employeeCount}
                      </span>
                    )}

                  {item.path === '/payroll' && !isActive && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Role Switcher Demo Widget & Log Out */}
        <div className="pt-4 border-t border-stone-200/80 space-y-3">
          {/* Role Tester (preserves functionality for multi-role evaluation) */}
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
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50/70 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#FAF8F5]">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

