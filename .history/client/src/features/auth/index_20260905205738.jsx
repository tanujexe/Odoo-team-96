import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/auth/AuthContext';
import { DEFAULT_USERS, ROLES } from '../../app/auth/authConstants';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, AlertCircle, Lock } from 'lucide-react';

export default function LoginFeature() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('payrollmanager@peoplepay.com');
  const [password, setPassword] = useState('Password123!');
  const [selectedRole, setSelectedRole] = useState(ROLES.HR_PAYROLL_MANAGER);
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleRoleQuickSelect = (roleKey) => {
    setSelectedRole(roleKey);
    const user = DEFAULT_USERS[roleKey];
    setEmail(user.email);
    setPassword('Password123!');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      await login({ email, password, role: selectedRole });
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid corporate email or password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-xl shadow-emerald-900/40">
          P
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-white tracking-tight">PeoplePay360</h2>
        <p className="mt-1 text-xs text-slate-400">Enterprise HR & Deterministic Payroll Platform</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-slate-800 bg-slate-950/90 shadow-2xl">
          <CardContent className="p-8 space-y-6">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>User accounts are managed by System Administrators. Self-registration is disabled.</span>
            </div>

            {errorMessage && (
              <div data-testid="login-error-alert" className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Corporate Email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:ring-emerald-500"
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:ring-emerald-500"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Sign In to Workspace
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Seed Accounts (5 Roles):
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleRoleQuickSelect(ROLES.HR_PAYROLL_MANAGER)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    selectedRole === ROLES.HR_PAYROLL_MANAGER
                      ? 'bg-emerald-950/40 border-emerald-500 text-white'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <span className="font-semibold block text-emerald-400 text-[11px]">Payroll Manager</span>
                  <span className="text-[10px] text-slate-400 block truncate">Charlie Payroll Manager</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleQuickSelect(ROLES.HR_PAYROLL_USER)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    selectedRole === ROLES.HR_PAYROLL_USER
                      ? 'bg-teal-950/40 border-teal-500 text-white'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <span className="font-semibold block text-teal-400 text-[11px]">Payroll User</span>
                  <span className="text-[10px] text-slate-400 block truncate">Payroll User Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleQuickSelect(ROLES.ADMIN)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    selectedRole === ROLES.ADMIN
                      ? 'bg-purple-950/40 border-purple-500 text-white'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <span className="font-semibold block text-purple-400 text-[11px]">Admin</span>
                  <span className="text-[10px] text-slate-400 block truncate">System Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleQuickSelect(ROLES.HR_MANAGER)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    selectedRole === ROLES.HR_MANAGER
                      ? 'bg-blue-950/40 border-blue-500 text-white'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <span className="font-semibold block text-blue-400 text-[11px]">HR Manager</span>
                  <span className="text-[10px] text-slate-400 block truncate">Jane HR Specialist</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleQuickSelect(ROLES.EMPLOYEE)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    selectedRole === ROLES.EMPLOYEE
                      ? 'bg-amber-950/40 border-amber-500 text-white'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <span className="font-semibold block text-amber-400 text-[11px]">Employee</span>
                  <span className="text-[10px] text-slate-400 block truncate">John Developer</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
