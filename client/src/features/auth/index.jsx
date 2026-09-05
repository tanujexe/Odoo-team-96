import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '../../app/auth/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Lock, Mail, ShieldCheck } from 'lucide-react';

export default function LoginFeature() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(ROLES.HR_PAYROLL_MANAGER);
  const [email, setEmail] = useState('sarah.payroll@peoplepay360.com');
  const [password, setPassword] = useState('password123');

  const handleRoleQuickSelect = (roleKey, defaultEmail) => {
    setSelectedRole(roleKey);
    setEmail(defaultEmail);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    login(selectedRole);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-xl shadow-emerald-900/40">
          P
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-white tracking-tight">PeoplePay360</h2>
        <p className="mt-1 text-xs text-slate-400">Enterprise HR & Deterministic Payroll Platform</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-slate-800 bg-slate-950/80 shadow-2xl">
          <CardContent className="p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Corporate Email"
                type="email"
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

              <Button type="submit" variant="primary" size="lg" className="w-full mt-2">
                Sign In to Workspace
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-800">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Demo Quick Sign-In (Roles):
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleRoleQuickSelect(ROLES.HR_PAYROLL_MANAGER, 'sarah.payroll@peoplepay360.com')}
                  className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500 text-left transition-colors"
                >
                  <span className="font-semibold block text-emerald-400">Payroll Manager</span>
                  <span className="text-[10px] text-slate-500">Sarah Connor</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleQuickSelect(ROLES.ADMIN, 'admin@peoplepay360.com')}
                  className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500 text-left transition-colors"
                >
                  <span className="font-semibold block text-purple-400">Admin</span>
                  <span className="text-[10px] text-slate-500">Eleanor Vance</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleQuickSelect(ROLES.HR_MANAGER, 'rachel.hr@peoplepay360.com')}
                  className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500 text-left transition-colors"
                >
                  <span className="font-semibold block text-blue-400">HR Manager</span>
                  <span className="text-[10px] text-slate-500">Rachel Green</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleQuickSelect(ROLES.EMPLOYEE, 'alex.rivera@peoplepay360.com')}
                  className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500 text-left transition-colors"
                >
                  <span className="font-semibold block text-amber-400">Employee</span>
                  <span className="text-[10px] text-slate-500">Alex Rivera</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
