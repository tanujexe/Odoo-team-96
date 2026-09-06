import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import CurvedLoop from '../components/CurvedLoop';


// --- Synchronized Animation Variants ---
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05
    }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: 'spring', damping: 24, stiffness: 110 } 
  }
};

// Clarify Variant (blur to crystal-clear text reveal animation)
const clarifyAnimation = {
  hidden: { opacity: 0, filter: 'blur(12px)', y: 15 },
  show: { 
    opacity: 1, 
    filter: 'blur(0px)', 
    y: 0, 
    transition: { duration: 1.2, ease: [0.25, 1, 0.5, 1], delay: 0.15 } 
  }
};

export default function HeroPage() {
  const [activeRole, setActiveRole] = useState('employee');
  const [simulatorStep, setSimulatorStep] = useState(2); // 0 to 4
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- Scroll Expand & Scroll-Driven Animation References ---
  // 1. Hero Overview Cards Scroll Expand
  const heroShowcaseRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroShowcaseRef,
    offset: ["start end", "center center"]
  });
  const heroCardScale = useTransform(heroScroll, [0, 1], [0.85, 1]);
  const heroCardRotateX = useTransform(heroScroll, [0, 1], [12, 0]);
  const heroCardOpacity = useTransform(heroScroll, [0, 0.8], [0.4, 1]);

  // 2. Problem Flow Scroll Expand
  const problemRef = useRef(null);
  const { scrollYProgress: problemScroll } = useScroll({
    target: problemRef,
    offset: ["start end", "center center"]
  });
  const problemScale = useTransform(problemScroll, [0, 1], [0.9, 1]);
  const problemOpacity = useTransform(problemScroll, [0, 1], [0.5, 1]);

  // 3. Rule Pipeline Scroll Expand
  const pipelineRef = useRef(null);
  const { scrollYProgress: pipelineScroll } = useScroll({
    target: pipelineRef,
    offset: ["start end", "center center"]
  });
  const pipelineScale = useTransform(pipelineScroll, [0, 1], [0.9, 1]);

  // 4. Simulator Scroll Expand
  const simulatorRef = useRef(null);
  const { scrollYProgress: simulatorScroll } = useScroll({
    target: simulatorRef,
    offset: ["start end", "center center"]
  });
  const simulatorScale = useTransform(simulatorScroll, [0, 1], [0.92, 1]);

  // 5. Governance Card Scroll Expand
  const governanceRef = useRef(null);
  const { scrollYProgress: governanceScroll } = useScroll({
    target: governanceRef,
    offset: ["start end", "center center"]
  });
  const governanceScale = useTransform(governanceScroll, [0, 1], [0.9, 1]);

  // 6. Dashboard Analytics Scroll Expand
  const dashboardRef = useRef(null);
  const { scrollYProgress: dashboardScroll } = useScroll({
    target: dashboardRef,
    offset: ["start end", "center center"]
  });
  const dashboardScale = useTransform(dashboardScroll, [0, 1], [0.92, 1]);

  // 7. Final CTA Scroll Expand (Zoom In with Black Curve)
  const finalCtaRef = useRef(null);
  const { scrollYProgress: finalCtaScroll } = useScroll({
    target: finalCtaRef,
    offset: ["start end", "center center"]
  });
  const finalCtaScale = useTransform(finalCtaScroll, [0, 1], [0.75, 1]);
  const finalCtaOpacity = useTransform(finalCtaScroll, [0, 0.8], [0.3, 1]);

  const pillItems = ['Employees', 'Attendance', 'Time Off', 'Payroll', 'Payslips', 'Reports'];

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F3EFE9] text-[#1C1613] font-sans antialiased selection:bg-[#B86B30] selection:text-white relative overflow-x-hidden">
      
      {/* FLOATING PILL NAVIGATION */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
        className="fixed top-3 sm:top-5 inset-x-0 z-50 flex justify-center px-3 sm:px-6 pointer-events-none"
      >
        <header className="pointer-events-auto w-full max-w-5xl rounded-full bg-white/90 backdrop-blur-xl border border-[#E8DFD1]/90 shadow-pill py-2 px-3 sm:py-2.5 sm:px-6 flex items-center justify-between transition-all">
          <a className="flex items-center group py-0.5" href="#">
            <div className="flex items-baseline tracking-tight leading-none select-none">
              {/* "People" - Clean serif black */}
              <span className="font-logo-serif text-[#1C1613] text-xl sm:text-2xl font-bold tracking-tight">People</span>
              {/* "P" - Orange script */}
              <span className="font-logo-script text-[#FF7A00] text-2xl sm:text-3xl font-normal leading-none -ml-0.5 -mr-1 -mt-1 inline-block">P</span>
              {/* "ay" - Clean serif black */}
              <span className="font-logo-serif text-[#1C1613] text-xl sm:text-2xl font-bold tracking-tight">ay</span>
            </div>
          </a>
          <nav className="hidden lg:flex items-center gap-1 text-[13px] font-medium text-[#70655D]">
            <a onClick={(e) => scrollToSection(e, 'connected-system')} className="px-3 py-1.5 rounded-full hover:text-[#1E1714] hover:bg-[#F4EFEA] transition cursor-pointer" href="#connected-system">Overview</a>
            <a onClick={(e) => scrollToSection(e, 'core-platform')} className="px-3 py-1.5 rounded-full hover:text-[#1E1714] hover:bg-[#F4EFEA] transition cursor-pointer" href="#core-platform">Platform</a>
            <a onClick={(e) => scrollToSection(e, 'payroll-engine')} className="px-3 py-1.5 rounded-full hover:text-[#1E1714] hover:bg-[#F4EFEA] transition cursor-pointer" href="#payroll-engine">Payroll Engine</a>
            <a onClick={(e) => scrollToSection(e, 'role-based')} className="px-3 py-1.5 rounded-full hover:text-[#1E1714] hover:bg-[#F4EFEA] transition cursor-pointer" href="#role-based">Roles</a>
            <a onClick={(e) => scrollToSection(e, 'workflow')} className="px-3 py-1.5 rounded-full hover:text-[#1E1714] hover:bg-[#F4EFEA] transition cursor-pointer" href="#workflow">Workflow</a>
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <a className="text-xs font-semibold text-[#70655D] hover:text-[#1E1714] px-2.5 sm:px-3 py-1.5 rounded-full transition" href="/login">Sign In</a>
            <a onClick={(e) => scrollToSection(e, 'workflow')} className="inline-flex items-center justify-center px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium text-white bg-[#1C1613] hover:bg-[#B86B30] shadow-sm transition hover:scale-[1.02] cursor-pointer" href="#workflow">
              Explore Platform
            </a>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#1C1613] hover:bg-[#F4EFEA] rounded-full transition"
              aria-label="Toggle Navigation Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </header>
      </motion.div>

      {/* MOBILE DROPDOWN MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-4 top-20 z-40 lg:hidden p-5 rounded-3xl bg-white/95 backdrop-blur-2xl border border-[#E8DFD1] shadow-2xl space-y-3 font-medium text-sm text-[#1C1613]">
          <a onClick={(e) => { scrollToSection(e, 'connected-system'); setMobileMenuOpen(false); }} className="block px-4 py-2.5 rounded-2xl hover:bg-[#F4EFEA] transition" href="#connected-system">Overview</a>
          <a onClick={(e) => { scrollToSection(e, 'core-platform'); setMobileMenuOpen(false); }} className="block px-4 py-2.5 rounded-2xl hover:bg-[#F4EFEA] transition" href="#core-platform">Platform</a>
          <a onClick={(e) => { scrollToSection(e, 'payroll-engine'); setMobileMenuOpen(false); }} className="block px-4 py-2.5 rounded-2xl hover:bg-[#F4EFEA] transition" href="#payroll-engine">Payroll Engine</a>
          <a onClick={(e) => { scrollToSection(e, 'role-based'); setMobileMenuOpen(false); }} className="block px-4 py-2.5 rounded-2xl hover:bg-[#F4EFEA] transition" href="#role-based">Roles</a>
          <a onClick={(e) => { scrollToSection(e, 'workflow'); setMobileMenuOpen(false); }} className="block px-4 py-2.5 rounded-2xl hover:bg-[#F4EFEA] transition" href="#workflow">Workflow</a>
        </div>
      )}

      {/* =========================================================================
          01 — HERO SECTION
          ========================================================================= */}
      <section className="relative pt-36 pb-20 md:pt-44 md:pb-28 overflow-hidden subtle-dots">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[750px] h-[380px] bg-gradient-to-tr from-[#F3E5D4]/40 to-[#EAD8C3]/30 blur-[130px] rounded-full pointer-events-none -z-10 animate-pulse-glow" />

        {/* DYNAMIC ANIMATED MOVING BEAM LINES (Full Screen Edge-to-Edge Width) */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
          <svg className="w-full h-full max-w-none" viewBox="0 0 1920 600" fill="none" preserveAspectRatio="none">
            <defs>
              <linearGradient id="beamGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1C1613" stopOpacity="0" />
                <stop offset="50%" stopColor="#B86B30" stopOpacity="1" />
                <stop offset="100%" stopColor="#E4A068" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="beamGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#B86B30" stopOpacity="0" />
                <stop offset="50%" stopColor="#8A4B1F" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1C1613" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="beamGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E4A068" stopOpacity="0" />
                <stop offset="50%" stopColor="#B86B30" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#8A4B1F" stopOpacity="0" />
              </linearGradient>
              <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Path 1: Top full-width sweep */}
            <path 
              d="M -100 80 Q 960 10 2020 140" 
              stroke="#E8DFD1" 
              strokeWidth="2" 
              strokeOpacity="0.4" 
              strokeDasharray="6 6"
            />
            <path 
              d="M -100 80 Q 960 10 2020 140" 
              stroke="url(#beamGrad1)" 
              strokeWidth="4" 
              strokeLinecap="round"
              className="animate-moving-line"
              filter="url(#glowFilter)"
            />

            {/* Path 2: Hero title center full-width sweep */}
            <path 
              d="M -100 280 Q 960 520 2020 240" 
              stroke="#E8DFD1" 
              strokeWidth="2" 
              strokeOpacity="0.4" 
              strokeDasharray="8 8"
            />
            <path 
              d="M -100 280 Q 960 520 2020 240" 
              stroke="url(#beamGrad2)" 
              strokeWidth="4.5" 
              strokeLinecap="round"
              className="animate-moving-line"
              style={{ animationDuration: '7s' }}
              filter="url(#glowFilter)"
            />

            {/* Path 3: Bottom full-width sweep leading into cards */}
            <path 
              d="M -100 480 Q 960 150 2020 460" 
              stroke="#E8DFD1" 
              strokeWidth="1.5" 
              strokeOpacity="0.3" 
              strokeDasharray="10 10"
            />
            <path 
              d="M -100 480 Q 960 150 2020 460" 
              stroke="url(#beamGrad3)" 
              strokeWidth="3.5" 
              strokeLinecap="round"
              className="animate-moving-line"
              style={{ animationDuration: '9s' }}
              filter="url(#glowFilter)"
            />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="text-center max-w-5xl lg:max-w-6xl mx-auto flex flex-col items-center"
          >

            {/* Main Heading — Line 1: Unified HR & Automated, Line 2: Payroll. */}
            <motion.h1 variants={fadeUp} className="font-inter text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[80px] font-extrabold tracking-tight text-[#1A1513] leading-[1.1] mb-4 relative">
              <span className="inline-block whitespace-normal sm:whitespace-nowrap text-stroke-animate">Unified HR & Automated</span>
              <br />
              <span className="inline-block text-stroke-animate">Payroll.</span>
            </motion.h1>

            {/* Highlighted Line — Serif Italic Typography (Matching Reference Image) */}
            <motion.div 
              variants={clarifyAnimation}
              initial="hidden"
              animate="show"
              className="relative mb-8"
            >
              <p className="font-serif-garamond italic text-3xl sm:text-5xl md:text-6xl text-[#B86B30] font-normal tracking-tight relative z-10">
                Built for Operations.
              </p>
              {/* Creative Moving Accent Line beneath sub-heading */}
              <svg className="w-72 h-4 mx-auto mt-2" viewBox="0 0 280 16" fill="none">
                <path d="M5 8 Q 140 15 275 8" stroke="#E8DFD1" strokeWidth="2" strokeLinecap="round" />
                <path 
                  d="M5 8 Q 140 15 275 8" 
                  stroke="url(#beamGrad1)" 
                  strokeWidth="3.5" 
                  strokeLinecap="round"
                  className="animate-moving-line"
                  style={{ animationDuration: '3.5s' }}
                />
              </svg>
            </motion.div>

            {/* Description */}
            <motion.p variants={fadeUp} className="text-base sm:text-lg text-[#655951] max-w-2xl mx-auto leading-relaxed mb-10">
              Manage your entire employee lifecycle in one connected platform — from employee records and contracts to attendance, time off, payroll, payslips, and workforce insights.
            </motion.p>

            {/* Buttons */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4 mb-12 w-full sm:w-auto">
              <a 
                href="#workflow"
                onClick={(e) => scrollToSection(e, 'workflow')}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#1C1613] text-white font-semibold text-base shadow-lg hover:bg-[#B86B30] transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group cursor-pointer"
              >
                Explore PeoplePay360
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
              <a 
                href="#connected-system"
                onClick={(e) => scrollToSection(e, 'connected-system')}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-[#1C1613] font-semibold text-base border border-[#E8DFD1] shadow-sm hover:bg-[#F4EFEA] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                See How It Works
              </a>
            </motion.div>

          </motion.div>

          {/* HERO VISUAL — Floating Overview Cards with Scroll Expand */}
          <div ref={heroShowcaseRef} className="mt-16 max-w-5xl mx-auto perspective-1000">
            <motion.div
              style={{
                scale: heroCardScale,
                rotateX: heroCardRotateX,
                opacity: heroCardOpacity
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 sm:p-8 rounded-[3rem] bg-gradient-to-b from-white/90 to-[#F5EFE8]/90 border border-[#E8DFD1] shadow-2xl backdrop-blur-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-72 h-72 bg-[#B86B30]/5 rounded-full blur-3xl pointer-events-none" />
              
              {/* Employee Overview Card */}
              <div className="p-6 rounded-2xl bg-white border border-[#EADFD2] shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-4 border-b border-[#F4EFEA] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F3E5D4] text-[#8A4B1F] flex items-center justify-center font-bold text-sm">
                      <svg className="w-5 h-5 text-[#8A4B1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#1C1613]">Employee Overview</h4>
                      <p className="text-xs text-[#8C7E74]">Live HR Record</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-[#8C7E74]">Employee:</span>
                    <span className="font-semibold text-[#1C1613]">Alex Morgan</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-[#8C7E74]">Department:</span>
                    <span className="font-medium text-[#1C1613]">Engineering</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-[#8C7E74]">Schedule:</span>
                    <span className="font-medium text-[#1C1613]">Full Time (40h/wk)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-[#8C7E74]">Contract:</span>
                    <span className="font-medium text-emerald-600">Active (Updated Sep 2025)</span>
                  </div>
                  <div className="flex justify-between py-1 pt-1">
                    <span className="text-[#8C7E74]">Attendance:</span>
                    <span className="font-bold text-[#B86B30]">21 / 22 days (95.4%)</span>
                  </div>
                </div>
              </div>

              {/* Payroll Overview Card */}
              <div className="p-6 rounded-2xl bg-[#1C1613] text-white border border-white/10 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#B86B30]/20 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-white">Payroll Overview</h4>
                    <p className="text-xs text-white/60">Payrun: September 2026</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#B86B30]/30 text-[#F3E5D4] border border-[#B86B30]/40">
                    Ready to Pay
                  </span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/60">Total Employees:</span>
                    <span className="font-mono font-semibold text-white">124</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/60">Gross Salary:</span>
                    <span className="font-mono font-semibold text-white">₹72,50,000</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/60">Deductions:</span>
                    <span className="font-mono text-rose-400">− ₹8,10,000</span>
                  </div>
                  <div className="flex justify-between py-1 pt-1 text-sm">
                    <span className="font-semibold text-white/90">Net Salary:</span>
                    <span className="font-mono font-extrabold text-[#F3E5D4]">₹64,40,000</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          02 — THE PROBLEM / VALUE SECTION
          ========================================================================= */}
      <section id="connected-system" className="py-20 md:py-32 bg-white border-y border-[#E8DFD1]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B86B30]">ONE CONNECTED SYSTEM</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1C1613] tracking-tight mt-3 mb-6">
              Stop managing people operations across disconnected workflows.
            </h2>
            <p className="text-base sm:text-lg text-[#655951] leading-relaxed">
              Employee information, contracts, attendance, leave, salary configuration, and payroll all depend on each other. PeoplePay360 brings these operational records together so every payroll decision is connected to the right employee, contract, schedule, and period.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5EFE8] text-[#8A4B1F] font-semibold text-sm border border-[#E8DFD1]">
              <svg className="w-4 h-4 text-[#B86B30]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              One source of truth. From employee data to final payslip.
            </div>
          </div>

          {/* 3 Points Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="p-8 rounded-3xl bg-[#FAF7F2] border border-[#E8DFD1] hover:border-[#B86B30]/40 transition group">
              <div className="w-12 h-12 rounded-2xl bg-[#F3E5D4] text-[#8A4B1F] flex items-center justify-center font-bold text-xl mb-6 group-hover:scale-110 transition-transform">
                01
              </div>
              <h3 className="text-xl font-bold text-[#1C1613] mb-3">Centralized Employee Data</h3>
              <p className="text-sm text-[#655951] leading-relaxed">
                Keep employee information and related operational records connected under a single authoritative record.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#FAF7F2] border border-[#E8DFD1] hover:border-[#B86B30]/40 transition group">
              <div className="w-12 h-12 rounded-2xl bg-[#F3E5D4] text-[#8A4B1F] flex items-center justify-center font-bold text-xl mb-6 group-hover:scale-110 transition-transform">
                02
              </div>
              <h3 className="text-xl font-bold text-[#1C1613] mb-3">Period-Aware Contracts</h3>
              <p className="text-sm text-[#655951] leading-relaxed">
                Maintain contract history and identify the exact contract terms applicable to each specific payroll period.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#FAF7F2] border border-[#E8DFD1] hover:border-[#B86B30]/40 transition group">
              <div className="w-12 h-12 rounded-2xl bg-[#F3E5D4] text-[#8A4B1F] flex items-center justify-center font-bold text-xl mb-6 group-hover:scale-110 transition-transform">
                03
              </div>
              <h3 className="text-xl font-bold text-[#1C1613] mb-3">Connected Payroll</h3>
              <p className="text-sm text-[#655951] leading-relaxed">
                Seamlessly feed attendance, time off, contracts, and salary rules straight into automated payroll workflows.
              </p>
            </div>
          </div>

          {/* Horizontal Animated Flow Visual */}
          <div ref={problemRef} className="max-w-5xl mx-auto">
            <motion.div 
              style={{ scale: problemScale, opacity: problemOpacity }}
              className="p-8 sm:p-10 rounded-[3rem] bg-[#1C1613] text-white border border-white/10 shadow-2xl relative overflow-hidden"
            >
              <div className="text-center mb-8">
                <span className="text-xs font-mono uppercase tracking-widest text-[#F3E5D4]">End-to-End Operational Pipeline</span>
                <h4 className="text-lg sm:text-xl font-bold text-white mt-1">The Connected PeoplePay360 Flow</h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 relative z-10">
                {[
                  { label: 'Employee', sub: 'Identity & Info' },
                  { label: 'Contract', sub: 'Period Active' },
                  { label: 'Attendance', sub: 'Worked Days' },
                  { label: 'Time Off', sub: 'Leave Balances' },
                  { label: 'Payroll', sub: 'Rule Engine' },
                  { label: 'Payslip', sub: 'Paid & Delivered' }
                ].map((step, idx) => (
                  <div key={step.label} className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition group">
                    <span className="w-6 h-6 rounded-full bg-[#B86B30] text-white font-mono text-xs flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-sm text-white mb-0.5">{step.label}</span>
                    <span className="text-[10px] text-white/60">{step.sub}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          03 — CORE PLATFORM SECTION (Replaced Emojis with Professional SVG Icons)
          ========================================================================= */}
      <section id="core-platform" className="py-20 md:py-32 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B86B30]">ENGINEERED FOR COMPLETE OPERATIONS</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1C1613] tracking-tight mt-3 mb-6">
              Everything your HR team needs. Connected.
            </h2>
            <p className="text-base sm:text-lg text-[#655951] leading-relaxed">
              PeoplePay360 brings core HR and payroll workflows into one operational platform, so teams can manage employee data, working schedules, attendance, time off, and payroll without breaking workflow between systems.
            </p>
          </div>

          {/* 6 Feature Cards Grid with Professional SVG Icons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-8 rounded-3xl bg-white border border-[#E8DFD1] shadow-sm hover:shadow-xl transition flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#F3E5D4] text-[#8A4B1F] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-[#8A4B1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1C1613] mb-3">Centralized Employee Hub</h3>
                <p className="text-sm text-[#655951] leading-relaxed mb-6">
                  Manage employee identity, department, manager, job position, working schedule, and employment status from one unified record.
                </p>
              </div>
              <div className="pt-4 border-t border-[#F4EFEA]">
                <span className="text-[11px] font-semibold text-[#8C7E74] block mb-2">Connected to:</span>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-[#4A3E37]">
                  <span className="px-2 py-0.5 rounded bg-[#F4EFEA]">Contracts</span>
                  <span className="px-2 py-0.5 rounded bg-[#F4EFEA]">Attendance</span>
                  <span className="px-2 py-0.5 rounded bg-[#F4EFEA]">Time Off</span>
                  <span className="px-2 py-0.5 rounded bg-[#F4EFEA]">Allocations</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-3xl bg-white border border-[#E8DFD1] shadow-sm hover:shadow-xl transition flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#F3E5D4] text-[#8A4B1F] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-[#8A4B1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1C1613] mb-3">Historical Contracts</h3>
                <p className="text-sm text-[#655951] leading-relaxed mb-6">
                  Keep every employment contract instead of overwriting history. PeoplePay360 identifies the contract applicable to the selected payroll period.
                </p>
              </div>
              <div className="pt-4 border-t border-[#F4EFEA]">
                <span className="text-[11px] font-semibold text-[#8C7E74] block mb-2">Contract status:</span>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-[#4A3E37]">
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">Upcoming</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Active</span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700">Expired</span>
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700">Terminated</span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-3xl bg-white border border-[#E8DFD1] shadow-sm hover:shadow-xl transition flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#F3E5D4] text-[#8A4B1F] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-[#8A4B1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1C1613] mb-3">Automated Attendance</h3>
                <p className="text-sm text-[#655951] leading-relaxed mb-6">
                  Record check-ins and check-outs, calculate worked hours, surface missing check-outs, and allow authorized corrections.
                </p>
              </div>
              <div className="pt-4 border-t border-[#F4EFEA]">
                <span className="text-[11px] font-semibold text-[#8C7E74] block mb-2">Track:</span>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-[#4A3E37]">
                  <span className="px-2 py-0.5 rounded bg-[#F4EFEA]">Present</span>
                  <span className="px-2 py-0.5 rounded bg-[#F4EFEA]">Late</span>
                  <span className="px-2 py-0.5 rounded bg-[#F4EFEA]">Absent</span>
                  <span className="px-2 py-0.5 rounded bg-[#F4EFEA]">Overtime</span>
                  <span className="px-2 py-0.5 rounded bg-[#F4EFEA]">Exceptions</span>
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="p-8 rounded-3xl bg-white border border-[#E8DFD1] shadow-sm hover:shadow-xl transition flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#F3E5D4] text-[#8A4B1F] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-[#8A4B1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1C1613] mb-3">Time Off Management</h3>
                <p className="text-sm text-[#655951] leading-relaxed mb-6">
                  Configure time-off types, allocations, requests, approvals, and balances — with approved requests automatically consuming the appropriate allocation.
                </p>
              </div>
              <div className="pt-4 border-t border-[#F4EFEA]">
                <span className="text-[11px] font-semibold text-[#8C7E74] block mb-2">Workflow:</span>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-[#4A3E37]">
                  <span className="px-2 py-0.5 rounded bg-[#F4EFEA]">Types</span>
                  <span className="px-2 py-0.5 rounded bg-[#F4EFEA]">Allocations</span>
                  <span className="px-2 py-0.5 rounded bg-[#F4EFEA]">Requests</span>
                  <span className="px-2 py-0.5 rounded bg-[#F4EFEA]">Approvals</span>
                  <span className="px-2 py-0.5 rounded bg-[#F4EFEA]">Balances</span>
                </div>
              </div>
            </div>

            {/* Card 5 */}
            <div className="p-8 rounded-3xl bg-white border border-[#E8DFD1] shadow-sm hover:shadow-xl transition flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#F3E5D4] text-[#8A4B1F] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-[#8A4B1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1C1613] mb-3">Configurable Payroll</h3>
                <p className="text-sm text-[#655951] leading-relaxed mb-6">
                  Build salary structures and execute salary rules in sequence using fixed amounts, percentages, or custom formulas.
                </p>
              </div>
              <div className="pt-4 border-t border-[#F4EFEA]">
                <span className="text-[11px] font-semibold text-[#8C7E74] block mb-2">Rule execution:</span>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-[#4A3E37]">
                  <span className="px-2 py-0.5 rounded bg-[#F4EFEA]">Fixed Amounts</span>
                  <span className="px-2 py-0.5 rounded bg-[#F4EFEA]">Percentages</span>
                  <span className="px-2 py-0.5 rounded bg-[#F4EFEA]">Formulas</span>
                </div>
              </div>
            </div>

            {/* Card 6 */}
            <div className="p-8 rounded-3xl bg-white border border-[#E8DFD1] shadow-sm hover:shadow-xl transition flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#F3E5D4] text-[#8A4B1F] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-[#8A4B1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1C1613] mb-3">Payslips & Delivery</h3>
                <p className="text-sm text-[#655951] leading-relaxed mb-6">
                  Generate detailed payslips, create PDFs, and send payslips in bulk while recording exact delivery status.
                </p>
              </div>
              <div className="pt-4 border-t border-[#F4EFEA]">
                <span className="text-[11px] font-semibold text-[#8C7E74] block mb-2">Outputs:</span>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-[#4A3E37]">
                  <span className="px-2 py-0.5 rounded bg-[#F4EFEA]">Breakdowns</span>
                  <span className="px-2 py-0.5 rounded bg-[#F4EFEA]">PDF Generation</span>
                  <span className="px-2 py-0.5 rounded bg-[#F4EFEA]">Bulk Delivery</span>
                  <span className="px-2 py-0.5 rounded bg-[#F4EFEA]">Status Logs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          04 — PAYROLL ENGINE SECTION
          ========================================================================= */}
      <section id="payroll-engine" className="py-20 md:py-32 bg-white border-y border-[#E8DFD1]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B86B30]">TRANSPARENT PAYROLL COMPUTATION</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1C1613] tracking-tight mt-3 mb-4">
              See exactly how every salary is calculated.
            </h2>
            <p className="text-xl font-semibold text-[#B86B30] mb-4">No black-box payroll.</p>
            <p className="text-base sm:text-lg text-[#655951] leading-relaxed">
              PeoplePay360 uses configurable Salary Structures and ordered Salary Rules to calculate payroll. Every rule contributes to a transparent payslip breakdown — from Basic and Allowances to Gross, Deductions, and Net Pay.
            </p>
          </div>

          {/* Visual Rule-Sequence Execution Pipeline */}
          <div ref={pipelineRef} className="max-w-4xl mx-auto">
            <motion.div style={{ scale: pipelineScale }} className="p-8 sm:p-12 rounded-[3.5rem] bg-[#FAF7F2] border border-[#E8DFD1] shadow-xl">
              <h3 className="text-center text-lg font-bold text-[#1C1613] mb-8 uppercase tracking-wide">
                Visual Rule-Sequence Execution
              </h3>

              <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
                {/* Rule 1 */}
                <div className="w-full md:w-1/5 p-4 rounded-2xl bg-white border border-[#E8DFD1] text-center shadow-xs">
                  <span className="text-[10px] font-sans font-bold text-[#8C7E74] block mb-1">01 BASE</span>
                  <h4 className="font-bold text-sm text-[#1C1613]">Basic Salary</h4>
                  <p className="text-lg font-extrabold text-[#1C1613] mt-2">₹50,000</p>
                </div>

                <div className="text-[#B86B30] font-bold text-xl hidden md:block">↓</div>

                {/* Rule 2 */}
                <div className="w-full md:w-1/5 p-4 rounded-2xl bg-white border border-[#E8DFD1] text-center shadow-xs">
                  <span className="text-[10px] font-sans font-bold text-[#8C7E74] block mb-1">02 ALLOWANCE</span>
                  <h4 className="font-bold text-sm text-[#1C1613]">Housing Allow.</h4>
                  <p className="text-lg font-extrabold text-emerald-600 mt-2">+ ₹8,500</p>
                </div>

                <div className="text-[#B86B30] font-bold text-xl hidden md:block">↓</div>

                {/* Rule 3 */}
                <div className="w-full md:w-1/5 p-4 rounded-2xl bg-white border border-[#E8DFD1] text-center shadow-xs">
                  <span className="text-[10px] font-sans font-bold text-[#8C7E74] block mb-1">03 TOTAL</span>
                  <h4 className="font-bold text-sm text-[#1C1613]">Gross Salary</h4>
                  <p className="text-lg font-extrabold text-[#1C1613] mt-2">₹58,500</p>
                </div>

                <div className="text-[#B86B30] font-bold text-xl hidden md:block">↓</div>

                {/* Rule 4 */}
                <div className="w-full md:w-1/5 p-4 rounded-2xl bg-white border border-[#E8DFD1] text-center shadow-xs">
                  <span className="text-[10px] font-sans font-bold text-[#8C7E74] block mb-1">04 DEDUCTION</span>
                  <h4 className="font-bold text-sm text-[#1C1613]">Tax / Deduct.</h4>
                  <p className="text-lg font-extrabold text-rose-500 mt-2">− ₹6,500</p>
                </div>

                <div className="text-[#B86B30] font-bold text-xl hidden md:block">↓</div>

                {/* Final Net */}
                <div className="w-full md:w-1/5 p-4 rounded-2xl bg-[#1C1613] text-white text-center shadow-md">
                  <span className="text-[10px] font-sans font-bold text-[#F3E5D4] block mb-1">05 NET PAY</span>
                  <h4 className="font-bold text-sm text-white">Net Salary</h4>
                  <p className="text-xl font-extrabold text-[#F3E5D4] mt-2">₹52,000</p>
                </div>
              </div>

              <p className="text-center text-xs text-[#8C7E74] mt-8 max-w-xl mx-auto">
                Each calculation is stored with its rule, category, sequence, and result — making the final payslip fully reproducible from underlying configuration and inputs.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          05 — ROLE-BASED EXPERIENCE SECTION (Replaced Emojis with SVG Icons)
          ========================================================================= */}
      <section id="role-based" className="py-20 md:py-32 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B86B30]">DESIGNED AROUND YOUR WORK</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1C1613] tracking-tight mt-3 mb-6">
              The right perspective for every stakeholder.
            </h2>
            <p className="text-base sm:text-lg text-[#655951] leading-relaxed">
              PeoplePay360 adapts the experience around the responsibilities of each user — giving employees self-service access while giving HR and payroll teams the controls they need.
            </p>
          </div>

          {/* 3 Large Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Employee Role Card */}
            <div 
              onClick={() => setActiveRole('employee')}
              className={`p-8 rounded-[2.5rem] bg-white border transition-all cursor-pointer flex flex-col justify-between ${
                activeRole === 'employee' 
                  ? 'border-[#B86B30] shadow-xl ring-2 ring-[#B86B30]/20 scale-[1.02]' 
                  : 'border-[#E8DFD1] shadow-sm hover:border-[#B86B30]/50'
              }`}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#F3E5D4] text-[#8A4B1F] flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-[#8A4B1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-xs font-sans font-bold uppercase text-[#B86B30] tracking-wider block mb-1">ROLE LEVEL 01</span>
                <h3 className="text-2xl font-bold text-[#1C1613] mb-2">Employee</h3>
                <p className="text-xs font-semibold text-[#8A4B1F] mb-4">"Your information. Your time. Your payslip."</p>
                <p className="text-sm text-[#655951] leading-relaxed mb-6">
                  View your employee details, attendance, and leave balances. Submit time-off requests and manage your own attendance records cleanly.
                </p>
              </div>
              <div className="pt-4 border-t border-[#F4EFEA]">
                <span className="text-xs font-semibold text-[#8C7E74] block mb-2">Self-Service Access:</span>
                <div className="flex flex-wrap gap-2 text-xs font-medium text-[#4A3E37]">
                  <span className="px-3 py-1 rounded-full bg-[#F4EFEA]">My Profile</span>
                  <span className="px-3 py-1 rounded-full bg-[#F4EFEA]">Attendance</span>
                  <span className="px-3 py-1 rounded-full bg-[#F4EFEA]">Time Off</span>
                </div>
              </div>
            </div>

            {/* HR Manager Role Card */}
            <div 
              onClick={() => setActiveRole('hr')}
              className={`p-8 rounded-[2.5rem] bg-white border transition-all cursor-pointer flex flex-col justify-between ${
                activeRole === 'hr' 
                  ? 'border-[#B86B30] shadow-xl ring-2 ring-[#B86B30]/20 scale-[1.02]' 
                  : 'border-[#E8DFD1] shadow-sm hover:border-[#B86B30]/50'
              }`}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#F3E5D4] text-[#8A4B1F] flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-[#8A4B1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-sans font-bold uppercase text-[#B86B30] tracking-wider block mb-1">ROLE LEVEL 02</span>
                <h3 className="text-2xl font-bold text-[#1C1613] mb-2">HR Manager</h3>
                <p className="text-xs font-semibold text-[#8A4B1F] mb-4">"Keep your workforce running smoothly."</p>
                <p className="text-sm text-[#655951] leading-relaxed mb-6">
                  Manage employees, contracts, working schedules, attendance, and time off — with approval and correction workflows built right in.
                </p>
              </div>
              <div className="pt-4 border-t border-[#F4EFEA]">
                <span className="text-xs font-semibold text-[#8C7E74] block mb-2">Management Controls:</span>
                <div className="flex flex-wrap gap-2 text-xs font-medium text-[#4A3E37]">
                  <span className="px-3 py-1 rounded-full bg-[#F4EFEA]">Employees</span>
                  <span className="px-3 py-1 rounded-full bg-[#F4EFEA]">Contracts</span>
                  <span className="px-3 py-1 rounded-full bg-[#F4EFEA]">Attendance</span>
                  <span className="px-3 py-1 rounded-full bg-[#F4EFEA]">Time Off</span>
                </div>
              </div>
            </div>

            {/* Payroll Team Role Card */}
            <div 
              onClick={() => setActiveRole('payroll')}
              className={`p-8 rounded-[2.5rem] bg-white border transition-all cursor-pointer flex flex-col justify-between ${
                activeRole === 'payroll' 
                  ? 'border-[#B86B30] shadow-xl ring-2 ring-[#B86B30]/20 scale-[1.02]' 
                  : 'border-[#E8DFD1] shadow-sm hover:border-[#B86B30]/50'
              }`}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#1C1613] text-[#F3E5D4] flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-[#F3E5D4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-sans font-bold uppercase text-[#B86B30] tracking-wider block mb-1">ROLE LEVEL 03</span>
                <h3 className="text-2xl font-bold text-[#1C1613] mb-2">Payroll Team</h3>
                <p className="text-xs font-semibold text-[#8A4B1F] mb-4">"Run payroll with control and confidence."</p>
                <p className="text-sm text-[#655951] leading-relaxed mb-6">
                  Create payruns, compute payslips, review warnings, validate payroll, mark runs as paid, and deliver payslips in bulk.
                </p>
              </div>
              <div className="pt-4 border-t border-[#F4EFEA]">
                <span className="text-xs font-semibold text-[#8C7E74] block mb-2">Payroll Permissions:</span>
                <div className="flex flex-wrap gap-2 text-xs font-medium text-[#4A3E37]">
                  <span className="px-3 py-1 rounded-full bg-[#F4EFEA]">Payruns</span>
                  <span className="px-3 py-1 rounded-full bg-[#F4EFEA]">Payslips</span>
                  <span className="px-3 py-1 rounded-full bg-[#F4EFEA]">Structures</span>
                  <span className="px-3 py-1 rounded-full bg-[#F4EFEA]">Rules</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          06 — PAYROLL WORKFLOW / SIMULATOR SECTION
          ========================================================================= */}
      <section id="workflow" className="py-20 md:py-32 bg-white border-y border-[#E8DFD1]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B86B30]">PAYROLL, WITHOUT THE GUESSWORK</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1C1613] tracking-tight mt-3 mb-6">
              Build. Compute. Validate. Pay.
            </h2>
            <p className="text-base sm:text-lg text-[#655951] leading-relaxed">
              Create a payroll run in a guided two-step workflow. Select the salary structure and payroll period, choose eligible employees, then compute payslips and resolve critical warnings before finalizing.
            </p>
          </div>

          {/* Interactive Guided Workflow Simulator */}
          <div ref={simulatorRef} className="max-w-5xl mx-auto">
            <motion.div style={{ scale: simulatorScale }} className="p-8 sm:p-12 rounded-[3.5rem] bg-[#1C1613] text-white border border-white/10 shadow-2xl relative overflow-hidden">
              
              {/* Step Navigation Pill Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-6 mb-8">
                {[
                  { num: '01', title: 'Define', desc: 'Structure & Period' },
                  { num: '02', title: 'Select', desc: 'Eligible Staff' },
                  { num: '03', title: 'Compute', desc: 'Rules & Days' },
                  { num: '04', title: 'Validate', desc: 'Warnings & Info' },
                  { num: '05', title: 'Pay', desc: 'Mark Paid & Send' }
                ].map((step, idx) => (
                  <button
                    key={step.num}
                    onClick={() => setSimulatorStep(idx)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-left transition ${
                      simulatorStep === idx
                        ? 'bg-[#FF7A00] text-white shadow-md'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      simulatorStep === idx ? 'bg-white text-[#FF7A00]' : 'bg-[#FF7A00] text-white'
                    }`}>
                      {step.num}
                    </span>
                    <div>
                      <div className="font-bold text-xs">{step.title}</div>
                      <div className="text-[10px] opacity-70 hidden lg:block">{step.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Active Step Visual Display */}
              <div className="bg-white/5 p-6 sm:p-8 rounded-3xl border border-white/10 relative">
                {simulatorStep === 0 && (
                  <div className="space-y-4">
                    <span className="text-xs font-sans font-bold text-[#F3E5D4]">STEP 01 — DEFINE RUN</span>
                    <h4 className="text-xl font-bold text-white">Configure Payroll Period & Structure</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-white/60 block">Selected Period:</span>
                        <span className="font-bold text-white text-base">September 1, 2026 – September 30, 2026</span>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-white/60 block">Salary Structure:</span>
                        <span className="font-bold text-white text-base">Standard Corporate Full-Time Structure</span>
                      </div>
                    </div>
                  </div>
                )}

                {simulatorStep === 1 && (
                  <div className="space-y-4">
                    <span className="text-xs font-sans font-bold text-[#F3E5D4]">STEP 02 — SELECT EMPLOYEES</span>
                    <h4 className="text-xl font-bold text-white">Filter & Choose Eligible Personnel</h4>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white text-sm">Engineering & Operations Filter</span>
                        <p className="text-white/60">124 active-contract employees included</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">124 Selected</span>
                    </div>
                  </div>
                )}

                {simulatorStep === 2 && (
                  <div className="space-y-4">
                    <span className="text-xs font-sans font-bold text-[#F3E5D4]">STEP 03 — COMPUTE PAYSLIPS</span>
                    <h4 className="text-xl font-bold text-white">Rule Execution & Attendance Compilation</h4>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
                      <div className="flex justify-between text-white/80">
                        <span>Rule Sequence Executed:</span>
                        <span className="font-sans font-bold text-[#FF7A00]">100% Complete</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div className="bg-[#FF7A00] h-full w-[85%]" />
                      </div>
                      <p className="text-[11px] text-white/50 pt-1">Computed 124 payslips in 1.4 seconds with attendance inputs.</p>
                    </div>
                  </div>
                )}

                {simulatorStep === 3 && (
                  <div className="space-y-4">
                    <span className="text-xs font-sans font-bold text-[#F3E5D4]">STEP 04 — VALIDATE & AUDIT</span>
                    <h4 className="text-xl font-bold text-white">Review System Warnings & Resolving Issues</h4>
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <span className="font-bold">1 Validation Warning Pending</span>
                          <p className="text-amber-200/80 text-[11px]">Employee #104 has unapproved overtime request.</p>
                        </div>
                      </div>
                      <button className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition">
                        Resolve Warning
                      </button>
                    </div>
                  </div>
                )}

                {simulatorStep === 4 && (
                  <div className="space-y-4">
                    <span className="text-xs font-sans font-bold text-[#F3E5D4]">STEP 05 — FINALIZE & PAY</span>
                    <h4 className="text-xl font-bold text-white">Mark Paid, Generate PDFs & Dispatch Payslips</h4>
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm">Payrun Approved & Finalized</span>
                        <p className="text-emerald-200/80">124 Payslips generated and ready for bulk dispatch.</p>
                      </div>
                      <span className="px-4 py-2 rounded-full bg-emerald-500 text-black font-bold">STATUS: PAID</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom CTA */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
                <span className="text-xs text-white/60">Controlled Compute → Validate → Mark Paid → Send Payslips workflow.</span>
                <a 
                  href="#dashboard" 
                  className="px-6 py-3 rounded-full bg-[#FF7A00] hover:bg-[#e66e00] text-white font-semibold text-xs transition flex items-center gap-2"
                >
                  Try the Payroll Flow →
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          07 — GOVERNANCE / TRUST SECTION (Replaced Emojis with SVG Icons)
          ========================================================================= */}
      <section id="governance" className="py-20 md:py-32 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Curved Outer Container with Side-View Building Image & 3D Shadow */}
          <div ref={governanceRef} className="max-w-6xl mx-auto">
            <motion.div 
              style={{ scale: governanceScale }}
              className="p-8 sm:p-14 rounded-[3.5rem] bg-white border border-[#E8DFD1] shadow-2xl relative overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                
                {/* Left Content Column */}
                <div className="lg:col-span-7">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#B86B30]">BUILT FOR CONTROL</span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1C1613] tracking-tight mt-2 mb-4">
                    Payroll operations you can trust.
                  </h2>
                  <p className="text-sm sm:text-base text-[#655951] leading-relaxed mb-8">
                    PeoplePay360 doesn't just calculate payroll. It checks the data behind it, surfaces issues before finalization, and preserves historical records for reliable operations.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Governance Card 1 */}
                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD1]">
                      <div className="w-8 h-8 rounded-lg bg-[#F3E5D4] text-[#8A4B1F] flex items-center justify-center mb-3">
                        <svg className="w-4 h-4 text-[#8A4B1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-sm text-[#1C1613] mb-1">Server-Side RBAC</h4>
                      <p className="text-xs text-[#655951]">Permissions are strictly enforced on the backend per role.</p>
                    </div>

                    {/* Governance Card 2 */}
                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD1]">
                      <div className="w-8 h-8 rounded-lg bg-[#F3E5D4] text-[#8A4B1F] flex items-center justify-center mb-3">
                        <svg className="w-4 h-4 text-[#8A4B1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-sm text-[#1C1613] mb-1">Validation First</h4>
                      <p className="text-xs text-[#655951]">Critical warnings must be resolved before finalization.</p>
                    </div>

                    {/* Governance Card 3 */}
                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD1]">
                      <div className="w-8 h-8 rounded-lg bg-[#F3E5D4] text-[#8A4B1F] flex items-center justify-center mb-3">
                        <svg className="w-4 h-4 text-[#8A4B1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-sm text-[#1C1613] mb-1">Traceable Changes</h4>
                      <p className="text-xs text-[#655951]">Contract and salary-rule modifications are logged.</p>
                    </div>

                    {/* Governance Card 4 */}
                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD1]">
                      <div className="w-8 h-8 rounded-lg bg-[#F3E5D4] text-[#8A4B1F] flex items-center justify-center mb-3">
                        <svg className="w-4 h-4 text-[#8A4B1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-sm text-[#1C1613] mb-1">Historical Audit</h4>
                      <p className="text-xs text-[#655951]">Paid payroll and past contracts remain available forever.</p>
                    </div>
                  </div>
                </div>

                {/* Right Image Column with 3D Drop Shadow */}
                <div className="lg:col-span-5 flex justify-center">
                  <div className="relative rounded-[2.5rem] overflow-hidden border border-[#E8DFD1] shadow-2xl shadow-black/20 group hover:scale-[1.02] transition-transform">
                    <img 
                      src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80" 
                      alt="PeoplePay360 Headquarters" 
                      className="w-full h-80 lg:h-96 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                      <span className="text-xs font-semibold text-white/90">
                        Enterprise-Grade Security & Governance
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          08 — DASHBOARD SECTION
          ========================================================================= */}
      <section id="dashboard" className="py-20 md:py-32 bg-white border-y border-[#E8DFD1]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B86B30]">LIVE WORKFORCE INTELLIGENCE</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1C1613] tracking-tight mt-3 mb-6">
              Your entire workforce. At a glance.
            </h2>
            <p className="text-base sm:text-lg text-[#655951] leading-relaxed">
              Turn your HR and payroll records into actionable insights. PeoplePay360's dashboard aggregates live employee, attendance, time-off, and payroll data so your teams always have the latest operational picture.
            </p>
          </div>

          {/* Dashboard KPI Grid */}
          <div ref={dashboardRef} className="max-w-6xl mx-auto">
            <motion.div style={{ scale: dashboardScale }} className="space-y-8">
              
              {/* 5 KPI Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD1]">
                  <span className="text-[11px] font-semibold text-[#8C7E74] block mb-1">Total Net Paid</span>
                  <p className="text-lg font-extrabold text-[#1C1613]">₹ 64,40,000</p>
                </div>
                <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD1]">
                  <span className="text-[11px] font-semibold text-[#8C7E74] block mb-1">Payslips Generated</span>
                  <p className="text-lg font-extrabold text-[#1C1613]">124</p>
                </div>
                <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD1]">
                  <span className="text-[11px] font-semibold text-[#8C7E74] block mb-1">Average Salary</span>
                  <p className="text-lg font-extrabold text-[#1C1613]">₹ 58,500</p>
                </div>
                <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD1]">
                  <span className="text-[11px] font-semibold text-[#8C7E74] block mb-1">Approved Time Off</span>
                  <p className="text-lg font-extrabold text-[#1C1613]">86 Days</p>
                </div>
                <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD1] col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-semibold text-[#8C7E74] block mb-1">Attendance Health</span>
                  <p className="text-lg font-extrabold text-emerald-600">94.8%</p>
                </div>
              </div>

              {/* Charts & Alerts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Department Salary Cost Bar Chart */}
                <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-[#FAF7F2] border border-[#E8DFD1]">
                  <h4 className="font-bold text-sm text-[#1C1613] mb-6">Salary Cost by Department</h4>
                  <div className="space-y-4 text-xs">
                    <div>
                      <div className="flex justify-between mb-1 font-semibold">
                        <span>Engineering</span>
                        <span>₹ 36,00,000</span>
                      </div>
                      <div className="w-full bg-[#E8DFD1] rounded-full h-3 overflow-hidden">
                        <div className="bg-[#1C1613] h-full w-[75%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1 font-semibold">
                        <span>Marketing</span>
                        <span>₹ 18,20,000</span>
                      </div>
                      <div className="w-full bg-[#E8DFD1] rounded-full h-3 overflow-hidden">
                        <div className="bg-[#B86B30] h-full w-[45%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1 font-semibold">
                        <span>Operations</span>
                        <span>₹ 12,50,000</span>
                      </div>
                      <div className="w-full bg-[#E8DFD1] rounded-full h-3 overflow-hidden">
                        <div className="bg-[#8A4B1F] h-full w-[30%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1 font-semibold">
                        <span>HR & Compliance</span>
                        <span>₹ 5,80,000</span>
                      </div>
                      <div className="w-full bg-[#E8DFD1] rounded-full h-3 overflow-hidden">
                        <div className="bg-[#C5B8AB] h-full w-[15%]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Alerts Feed with SVG Warning Icon */}
                <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-[#1C1613] text-white border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 mb-4 text-amber-400">
                      <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <h4 className="font-bold text-sm text-white">3 items need attention</h4>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <span className="text-white/80">Missing bank information</span>
                        <span className="text-[10px] font-mono text-amber-300">Action Req.</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <span className="text-white/80">Duplicate payslip detected</span>
                        <span className="text-[10px] font-mono text-rose-300">Flagged</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <span className="text-white/80">Contract requires review</span>
                        <span className="text-[10px] font-mono text-blue-300">Pending</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-white/50 pt-4 mt-4 border-t border-white/10">
                    Live system notifications updated in real time.
                  </p>
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          09 — FINAL CTA SECTION (+ FOOTER)
          ========================================================================= */}
      <section ref={finalCtaRef} className="py-12 sm:py-16 md:py-24 bg-[#FAF7F2] px-3 sm:px-6 lg:px-8 overflow-hidden">
        <motion.div 
          style={{ scale: finalCtaScale, opacity: finalCtaOpacity }}
          className="w-full max-w-full rounded-[2.2rem] sm:rounded-[3.5rem] bg-[#181311] text-white p-6 sm:p-12 md:p-16 lg:p-20 border border-white/10 shadow-2xl relative overflow-hidden animate-breathe-glow"
        >
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#B86B30]/15 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#8A4B1F]/20 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            {/* Small Badge */}
            <span className="inline-block px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#F3E5D4] bg-white/10 border border-white/15 mb-4 sm:mb-6">
              READY TO SIMPLIFY YOUR HR OPERATIONS?
            </span>

            {/* Main Title */}
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight mb-3 sm:mb-4">
              Modernize your HR & payroll operations.
            </h2>

            {/* Highlight */}
            <p className="text-base sm:text-xl md:text-2xl font-bold text-[#F3E5D4] mb-4 sm:mb-6">
              From employee data to paid payslip — everything connected.
            </p>

            {/* Description */}
            <p className="text-xs sm:text-base md:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed mb-6 sm:mb-10">
              Bring employees, contracts, attendance, time off, salary rules, payroll, payslips, and workforce insights together in one operational platform.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="/login"
                className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-[#FF7A00] hover:bg-[#e66e00] text-white font-bold text-sm sm:text-base shadow-xl transition-all hover:scale-105"
              >
                Explore PeoplePay →
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#000000] text-white/70 py-8 md:py-12 border-t border-white/10 text-xs overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Scroll Revealed Animated Letter-Fall Logo Container */}
          <div className="py-4 flex flex-col items-center justify-center select-none">
            <div className="relative flex items-center justify-center tracking-tight leading-none py-2 my-1">
              {/* "People" - Clean elegant white serif matching image */}
              <div className="flex font-logo-serif text-white text-[clamp(36px,7vw,85px)] font-normal tracking-tight">
                {['P', 'e', 'o', 'p', 'l', 'e'].map((char, index) => (
                  <span
                    key={`people-${index}`}
                    className="letter-fall"
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    {char}
                  </span>
                ))}
              </div>

              {/* "Pay" - Stylized script P in orange + serif ay in white matching image */}
              <div className="flex items-baseline -ml-1 sm:-ml-2">
                {/* Large Stylized Orange Cursive Script P */}
                <span
                  key="pay-P"
                  className="letter-fall font-logo-script text-[#FF7A00] text-[clamp(65px,13vw,150px)] leading-none -mt-4 sm:-mt-7 inline-block select-none font-normal"
                  style={{ animationDelay: `0.48s` }}
                >
                  P
                </span>

                {/* "ay" in clean white serif matching People */}
                <div className="flex font-logo-serif text-white text-[clamp(36px,7vw,85px)] font-normal tracking-tight -ml-2 sm:-ml-4">
                  {['a', 'y'].map((char, index) => (
                    <span
                      key={`pay-rest-${index}`}
                      className="letter-fall"
                      style={{ animationDelay: `${(index + 7) * 0.08}s` }}
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-white/40 font-mono text-[10px] sm:text-xs mt-4 tracking-widest uppercase">
              Connected Operational HR & Payroll Platform
            </p>
          </div>

          {/* Footer Copyright Bar */}
          <div className="pt-6 border-t border-white/10 text-center text-white/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© 2026 PeoplePay Inc. All rights reserved.</p>
            <p className="font-mono text-[11px]">All-in-One HR & Payroll Ecosystem</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
