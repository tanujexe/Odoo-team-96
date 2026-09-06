import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, ROLES, DEFAULT_USERS } from '../../app/auth/AuthContext';
import { AtSign, Key, ArrowRight, Lock, ShieldCheck, AlertCircle, Sparkles, CheckCircle2, Home } from 'lucide-react';

export default function LoginFeature() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('payrollmanager@peoplepay.com');
  const [password, setPassword] = useState('Password123!');
  const [selectedRole, setSelectedRole] = useState(ROLES.HR_PAYROLL_MANAGER);
  const [errorMessage, setErrorMessage] = useState('');
  const [forgotNotice, setForgotNotice] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleRoleQuickSelect = (roleKey) => {
    setSelectedRole(roleKey);
    const user = DEFAULT_USERS[roleKey];
    setEmail(user.email);
    setPassword('Password123!');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    try {
      await login({ email, password, role: selectedRole });
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid corporate email or password');
    }
  };

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum = today.getDate();
  const ordinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="min-h-screen bg-[#F6EFE8] font-sans antialiased text-[#1C1613] flex items-center justify-center p-3 sm:p-6 md:p-10 relative overflow-x-hidden selection:bg-[#F3E5D4] selection:text-[#1E1714]">
      
      {/* 3D STUDIO SCENE BACKGROUND ELEMENTS */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full bg-gradient-to-br from-[#F5E6D8]/60 to-[#EAD4C3]/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[450px] sm:w-[700px] h-[450px] sm:h-[700px] rounded-full bg-gradient-to-tr from-[#F0DDD0]/80 via-[#E8CFBD]/50 to-[#DFBEA9]/30 blur-3xl pointer-events-none" />
      
      {/* 3D Sphere Accents */}
      <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-gradient-to-tr from-[#E6CFBC] to-[#F7EBE1] shadow-2xl blur-xs opacity-70 pointer-events-none hidden lg:block" />
      <div className="absolute top-12 right-20 w-32 h-32 rounded-full bg-gradient-to-b from-white/60 to-[#E8D7C8]/40 shadow-xl backdrop-blur-md opacity-60 pointer-events-none hidden lg:block" />

      {/* MAIN DUAL-PANEL GLASS CONTAINER */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 relative z-10 items-stretch my-auto">
        
        {/* LEFT STACK: LOGIN CARD & "NEW IN" CARD */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4 sm:space-y-6">
          
          {/* GLASSMORPHISM LOGIN CARD */}
          <div className="p-5 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.8rem] bg-white/50 backdrop-blur-2xl border border-white/70 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-b from-white/30 to-transparent rounded-full blur-2xl pointer-events-none" />

            {/* Header: Logo & Home Button & Sign up action */}
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => navigate('/hero')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-[#1C1613] bg-white/80 hover:bg-white border border-white/90 shadow-2xs transition group"
                  title="Back to Home Page"
                >
                  <Home className="w-3.5 h-3.5 text-[#FF7A00] group-hover:scale-110 transition-transform" />
                  <span>Home</span>
                </button>
                <img src="/logo.png" alt="PeoplePay Logo" className="h-8 sm:h-9 w-auto object-contain" />

              </div>
              <button 
                type="button"
                onClick={() => handleRoleQuickSelect(ROLES.ADMIN)}
                className="px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs font-semibold text-[#1C1613] bg-white/80 hover:bg-white border border-white/90 shadow-2xs transition"
              >
                Sign up
              </button>
            </div>

            {/* Form Title & SSO Pill */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#1C1613]">Log in</h1>
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/80 border border-white/90 shadow-2xs text-[11px] sm:text-xs font-medium text-[#4A3E37]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B86B30]" />
                <span>Corporate SSO</span>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Forgot Password Notice */}
            {forgotNotice && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Password resets are managed by your System Administrator. Use quick roles below to test.</span>
              </div>
            )}

            {/* LOGIN FORM */}
            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4 mb-4 sm:mb-6">
              
              {/* Email Pill Input */}
              <div className="relative flex items-center">
                <div className="absolute left-4 text-[#8C7E74]">
                  <AtSign className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="e-mail address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-full bg-white/70 border border-white/90 text-xs sm:text-sm font-medium text-[#1C1613] placeholder-[#8C7E74] focus:outline-none focus:ring-2 focus:ring-[#B86B30]/30 focus:bg-white transition shadow-2xs"
                />
              </div>

              {/* Password Pill Input with Embedded "I forgot" button */}
              <div className="relative flex items-center">
                <div className="absolute left-4 text-[#8C7E74]">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-24 sm:pr-28 py-3 sm:py-3.5 rounded-full bg-white/70 border border-white/90 text-xs sm:text-sm font-medium text-[#1C1613] placeholder-[#8C7E74] focus:outline-none focus:ring-2 focus:ring-[#B86B30]/30 focus:bg-white transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setForgotNotice(!forgotNotice)}
                  className="absolute right-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium text-[#70655D] bg-white hover:bg-[#FAF7F2] border border-[#E8DFD1] shadow-2xs transition"
                >
                  I forgot
                </button>
              </div>

              {/* Bottom Notice & Circular Submit Button */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <p className="text-[10px] sm:text-[11px] text-[#70655D] leading-tight max-w-[200px] sm:max-w-xs">
                  Enterprise operational HR & payroll platform. For authorized personnel.
                </p>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1C1613] hover:bg-[#B86B30] text-white flex items-center justify-center transition-all hover:scale-105 shadow-xl shrink-0 group"
                >
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </form>

            {/* SEED ROLE SELECTORS FOR EASY TESTING */}
            <div className="pt-3 border-t border-white/60">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#8C7E74] block mb-2">
                Quick Demo Access:
              </span>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  { key: ROLES.ADMIN, label: 'Admin' },
                  { key: ROLES.HR_PAYROLL_MANAGER, label: 'Payroll Manager' },
                  { key: ROLES.HR_MANAGER, label: 'HR Manager' },
                  { key: ROLES.HR_PAYROLL_USER, label: 'Payroll User' },
                  { key: ROLES.EMPLOYEE, label: 'Employee' }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleRoleQuickSelect(item.key)}
                    className={`px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold transition ${
                      selectedRole === item.key
                        ? 'bg-[#1C1613] text-white shadow-sm'
                        : 'bg-white/60 text-[#4A3E37] hover:bg-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* BOTTOM LEFT: "NEW IN" FEATURE CARD */}
          <div className="p-5 sm:p-8 rounded-[1.8rem] sm:rounded-[2.2rem] bg-[#1C1613] text-white shadow-xl flex items-center sm:items-end justify-between relative overflow-hidden">
            <div className="space-y-0.5">
              <span className="text-xl sm:text-3xl font-extrabold tracking-tight block text-white">New in</span>
              <p className="text-xs sm:text-sm text-white/70">PeoplePay Connected Flow</p>
            </div>
            <button 
              type="button"
              onClick={() => navigate('/hero')}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition flex items-center gap-1.5"
            >
              Discover
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* RIGHT PANEL: LIVE INTERACTIVE WIDGET CARD (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col">
          <div className="h-full p-6 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.8rem] bg-white/85 backdrop-blur-xl border border-white/60 shadow-2xl flex flex-col justify-between relative overflow-hidden min-h-[420px] sm:min-h-[520px]">
            
            {/* MOUNTAIN BACKGROUND IMAGE WITH SUBTLE TRANSPARENCY */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2rem] sm:rounded-[2.8rem] -z-0">
              <img
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80"
                alt="Mountains Background"
                className="w-full h-full object-cover opacity-[0.20] mix-blend-multiply filter contrast-125"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/65 via-white/30 to-white/75" />
            </div>

            {/* Top Widget Header: Live Date & Location */}
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1C1613] block">
                  {dayName}
                </span>
                <span className="text-2xl sm:text-4xl font-light text-[#8C7E74] block">
                  {ordinal(dayNum)}
                </span>
              </div>
              <div className="text-right text-xs">
                <span className="font-bold text-[#1C1613] block uppercase tracking-wider text-[10px] sm:text-xs">Grand opening</span>
                <span className="text-[#8C7E74] block text-[10px] sm:text-xs">New release v2.4</span>
              </div>
            </div>

            {/* Center Area: Terracotta Glowing Orb & Live Schedule info */}
            <div className="my-6 sm:my-8 relative z-10 flex items-center justify-between">
              <div className="space-y-1 text-xs text-[#4A3E37] relative z-10">
                <span className="font-bold text-[#1C1613] text-xs sm:text-sm block">18 PM</span>
                <p className="font-medium text-[#655951]">Corporate HQ</p>
                <p className="text-[#8C7E74]">Payroll Engine Active</p>
              </div>

              {/* Terracotta Orb Graphic */}
              <div className="w-28 h-28 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-[#FF7A00] via-[#FF9335] to-[#FFA756] shadow-2xl shadow-orange-500/30 animate-pulse-glow flex items-center justify-center text-white relative">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-spin-slow" />
                </div>
              </div>
            </div>

            {/* Bottom Footer & CTA */}
            <div className="pt-4 sm:pt-6 border-t border-[#F4EFEA] flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#1C1613] text-white flex items-center justify-center text-[10px] font-bold">
                  P
                </div>
                <span className="font-bold text-xs text-[#1C1613]">PeoplePay</span>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#1C1613] hover:bg-[#B86B30] text-white text-xs font-bold transition shadow-lg group"
              >
                <span>Join in</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
