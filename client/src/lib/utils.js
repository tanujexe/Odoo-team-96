import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
export function formatRoleLabel(role) {
  if (!role) return '';
  switch (role) {
    case 'EMPLOYEE':
      return 'Employee';
    case 'HR_MANAGER':
      return 'HR Manager';
    case 'HR_PAYROLL_USER':
      return 'HR Payroll User';
    case 'HR_PAYROLL_MANAGER':
      return 'HR Payroll Manager';
    case 'ADMIN':
      return 'Admin';
    default:
      return String(role).replace(/_/g, ' ');
  }
}
