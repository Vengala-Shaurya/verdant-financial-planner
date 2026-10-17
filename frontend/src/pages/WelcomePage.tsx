import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Target,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';

interface WelcomePageProps {
  onStartDemo: () => void;
  onNavigateToApp: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onStartDemo, onNavigateToApp }) => {
  return (
    <div className="min-h-screen bg-[#F6F3EB] text-[#202822] flex flex-col justify-between selection:bg-[#D5EE75] selection:text-[#183D32]">
      {/* Top Editorial Bar */}
      <header className="border-b border-[#D8DCD1] px-6 lg:px-16 py-5 flex items-center justify-between bg-[#FFFEFA]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 bg-[#183D32] text-[#D5EE75] flex items-center justify-center font-editorial font-bold text-xl rounded-sm">
            V
          </div>
          <span className="font-editorial text-2xl tracking-tight text-[#183D32] font-semibold">
            VERDANT
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onStartDemo}
            className="text-xs font-mono-num uppercase tracking-wider text-[#183D32] hover:underline font-semibold"
          >
            Launch Academic Review Demo
          </button>
          <button
            onClick={onStartDemo}
            className="px-4 py-2 bg-[#183D32] text-[#D5EE75] hover:bg-[#183D32]/90 rounded-sm text-xs font-semibold transition-colors shadow-xs"
          >
            Enter Ledger
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 lg:px-12 py-16 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Thesis & Action */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 bg-[#FFFEFA] border border-[#D8DCD1] rounded-xs text-xs font-mono-num text-[#183D32]">
              <span className="w-2 h-2 rounded-full bg-[#183D32]" />
              <span>PT1 Academic Project Presentation · 2026</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-editorial font-normal text-[#183D32] leading-[1.05] tracking-tight">
              Personal Finance, <br />
              <span className="italic font-normal">Intentionally Planned.</span>
            </h1>

            <p className="text-base text-[#202822]/80 max-w-xl font-light leading-relaxed">
              VERDANT is an AI-assisted financial planning instrument. It audits verified income, variable velocity, and debt commitments to mathematically allocate surplus capital across goals without hallucinations.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={onStartDemo}
                className="px-6 py-3.5 bg-[#183D32] text-[#D5EE75] hover:bg-[#183D32]/90 rounded-sm font-semibold text-sm transition-all flex items-center justify-center space-x-2 shadow-sm"
              >
                <span>Build My Savings Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onStartDemo}
                className="px-6 py-3.5 border border-[#183D32] bg-[#FFFEFA] text-[#183D32] hover:bg-[#D5EE75]/20 rounded-sm font-semibold text-sm transition-all text-center"
              >
                Inspect Arjun Verma Profile (₹50k/₹22k)
              </button>
            </div>

            <div className="pt-4 border-t border-[#D8DCD1] grid grid-cols-3 gap-4 text-xs font-mono-num text-[#202822]/70">
              <div>
                <span className="block font-bold text-[#183D32]">Deterministic</span>
                Zero financial hallucinations
              </div>
              <div>
                <span className="block font-bold text-[#183D32]">5 Modules</span>
                From academic PPT
              </div>
              <div>
                <span className="block font-bold text-[#183D32]">SQLite Core</span>
                Persistent transaction audit
              </div>
            </div>
          </div>

          {/* Right Column: Tactile Financial Visualisation */}
          <div className="lg:col-span-5 bg-[#FFFEFA] p-6 border border-[#D8DCD1] subtle-paper-shadow relative">
            <div className="flex items-center justify-between border-b border-[#D8DCD1] pb-3 mb-4">
              <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#202822]/60 font-semibold">
                Living Cash Flow Model
              </span>
              <span className="text-[10px] font-mono-num text-[#183D32] bg-[#D5EE75] px-1.5 py-0.5 rounded font-bold">
                VERIFIED SOLVENT
              </span>
            </div>

            <div className="space-y-4 font-mono-num text-xs">
              <div className="p-3 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs">
                <div className="flex justify-between text-[#202822]/70">
                  <span>Monthly Take-Home</span>
                  <span className="font-semibold text-[#183D32]">+₹50,000</span>
                </div>
                <div className="w-full bg-[#D8DCD1] h-1.5 mt-2 rounded-full overflow-hidden">
                  <div className="bg-[#183D32] h-full w-full" />
                </div>
              </div>

              <div className="p-3 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs space-y-1.5">
                <div className="flex justify-between text-[#202822]/70">
                  <span>Fixed & Variable Outflows</span>
                  <span>-₹25,000</span>
                </div>
                <div className="flex justify-between text-[#202822]/70">
                  <span>Debt Obligations</span>
                  <span>-₹3,000</span>
                </div>
                <div className="w-full bg-[#D8DCD1] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#C66D51] h-full w-[56%]" />
                </div>
              </div>

              <div className="p-3.5 bg-[#183D32] text-[#FFFEFA] rounded-xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs uppercase tracking-wider text-[#D5EE75] font-semibold">
                    Monthly Net Surplus
                  </span>
                  <span className="text-xl font-bold font-mono-num text-[#D5EE75]">
                    ₹22,000
                  </span>
                </div>
                <span className="text-[10px] text-[#FFFEFA]/70 block mt-1">
                  44% savings rate available for emergency cushion & education goals.
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#D8DCD1] flex justify-between items-center text-xs">
              <span className="text-[#202822]/70 font-mono-num">Academic PPT Demonstration</span>
              <button
                onClick={onStartDemo}
                className="text-[#183D32] font-semibold hover:underline flex items-center space-x-1"
              >
                <span>Launch</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#D8DCD1] bg-[#FFFEFA] px-6 lg:px-16 py-4 text-xs text-[#202822]/60 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>VERDANT Financial Planning System · Professional Training I Project</span>
        <span className="font-mono-num">Flask REST API · SQLite · React & Vite · Recharts</span>
      </footer>
    </div>
  );
};
