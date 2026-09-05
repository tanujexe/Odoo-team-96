import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, hasAccess, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !hasAccess(allowedRoles)) {
    return (
      <div data-testid="unauthorized-state" className="p-12 max-w-lg mx-auto text-center mt-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-600 mb-6">
          Your role (<span className="font-semibold text-slate-900">{user?.role}</span>) does not have permission to access this module.
        </p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return children;
}
