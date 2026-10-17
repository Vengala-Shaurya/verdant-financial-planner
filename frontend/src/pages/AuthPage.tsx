import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Target,
  Sparkles,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { UserProfile } from '../types';

interface AuthPageProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  
  // Sign-in state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleDemoAccess = async () => {
    setErrorMsg(null);
    setDemoLoading(true);
    try {
      const res = await api.demoLogin();
      onAuthSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize demo account.');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.login({ email: loginEmail, password: loginPassword });
      onAuthSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.register({
        name: regName,
        email: regEmail,
        password: regPassword,
        password_confirm: regConfirm
      });
      setSuccessMsg('Account created successfully! Entering onboarding...');
      setTimeout(() => {
        onAuthSuccess(res.user);
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F3EB] text-[#202822] flex flex-col justify-between selection:bg-[#D5EE75] selection:text-[#183D32]">
      {/* Top Ledger Header */}
      <header className="border-b border-[#D8DCD1] px-6 lg:px-16 py-5 flex items-center justify-between bg-[#FFFEFA]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 bg-[#183D32] text-[#D5EE75] flex items-center justify-center font-editorial font-bold text-xl rounded-sm">
            V
          </div>
          <span className="font-editorial text-2xl tracking-tight text-[#183D32] font-semibold">
            VERDANT
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="hidden sm:inline-block text-xs font-mono-num uppercase tracking-wider text-[#202822]/60">
            Professional Training I Project
          </span>
          <button
            onClick={handleDemoAccess}
            disabled={demoLoading}
            className="px-3.5 py-1.5 border border-[#183D32] text-[#183D32] hover:bg-[#D5EE75]/20 rounded-sm text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {demoLoading ? 'Loading Demo...' : 'Explore as Arjun Verma'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 lg:px-12 py-12 flex-1 flex flex-col justify-center w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          {/* Section A: Academic Demo Spotlight (Left 5 cols) */}
          <div className="lg:col-span-5 bg-[#FFFEFA] p-8 border border-[#D8DCD1] subtle-paper-shadow flex flex-col justify-between rounded-sm">
            <div>
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-[11px] font-mono-num text-[#183D32] mb-6">
                <span className="w-2 h-2 rounded-full bg-[#183D32]" />
                <span>Section A · Academic PT1 Evaluation</span>
              </div>

              <h2 className="text-3xl font-editorial font-normal text-[#183D32] leading-tight mb-3">
                Experience VERDANT with Demo Data
              </h2>

              <p className="text-sm text-[#202822]/80 font-light leading-relaxed mb-6">
                Inspect the deterministic calculation engine and AI features using the calibrated demo persona: <strong>Arjun Verma</strong>.
              </p>

              {/* Persona Specification Card */}
              <div className="bg-[#F6F3EB] border border-[#D8DCD1] p-4 rounded-xs mb-6 space-y-2.5 text-xs font-mono-num">
                <div className="flex justify-between items-center pb-2 border-b border-[#D8DCD1]">
                  <span className="font-semibold text-[#183D32]">Arjun Verma</span>
                  <span className="text-[10px] bg-[#D5EE75] text-[#183D32] px-2 py-0.5 rounded font-bold uppercase">
                    Fictional Profile
                  </span>
                </div>
                <div className="flex justify-between text-[#202822]/80">
                  <span>Monthly Take-Home:</span>
                  <span className="font-semibold text-[#183D32]">₹50,000</span>
                </div>
                <div className="flex justify-between text-[#202822]/80">
                  <span>Fixed & Variable Outflows:</span>
                  <span>₹25,000 (₹15k + ₹10k)</span>
                </div>
                <div className="flex justify-between text-[#202822]/80">
                  <span>Separate Debt Service:</span>
                  <span>₹3,000</span>
                </div>
                <div className="flex justify-between text-[#202822]/80">
                  <span>Existing Liquid Savings:</span>
                  <span>₹40,000 (1.4 mo runway)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#D8DCD1] items-baseline">
                  <span className="font-semibold text-[#183D32]">Monthly Surplus:</span>
                  <span className="text-sm font-bold text-[#183D32]">₹22,000</span>
                </div>
              </div>

              <div className="text-xs text-[#202822]/70 space-y-1.5 mb-6">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#183D32]" />
                  <span>Strict data isolation: changes to Arjun never affect personal accounts.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[#183D32]" />
                  <span>Full AI & deterministic fallbacks operational out-of-the-box.</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleDemoAccess}
              disabled={demoLoading}
              className="w-full py-3.5 bg-[#183D32] text-[#D5EE75] hover:bg-[#183D32]/90 rounded-sm font-semibold text-sm transition-all flex items-center justify-center space-x-2 shadow-xs disabled:opacity-60"
            >
              <span>{demoLoading ? 'Preparing Demo...' : 'Continue as Arjun Verma'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Section B & C: Personal Authentication (Right 7 cols) */}
          <div className="lg:col-span-7 bg-[#FFFEFA] p-8 lg:p-10 border border-[#D8DCD1] subtle-paper-shadow rounded-sm flex flex-col justify-between">
            <div>
              {/* Tab Selector: Sign In vs Register */}
              <div className="flex border-b border-[#D8DCD1] mb-8">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setErrorMsg(null); }}
                  className={`pb-3 px-4 text-sm font-editorial tracking-wide transition-all border-b-2 font-medium ${
                    mode === 'signin'
                      ? 'border-[#183D32] text-[#183D32]'
                      : 'border-transparent text-[#202822]/50 hover:text-[#202822]'
                  }`}
                >
                  Personal Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setErrorMsg(null); }}
                  className={`pb-3 px-4 text-sm font-editorial tracking-wide transition-all border-b-2 font-medium ${
                    mode === 'register'
                      ? 'border-[#183D32] text-[#183D32]'
                      : 'border-transparent text-[#202822]/50 hover:text-[#202822]'
                  }`}
                >
                  Create Personal Account
                </button>
              </div>

              {/* Notifications */}
              {errorMsg && (
                <div className="mb-6 p-3.5 bg-[#FDF3F0] border border-[#C66D51]/30 rounded-xs flex items-start space-x-2.5 text-xs text-[#C66D51]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-6 p-3.5 bg-[#EAF5D6] border border-[#183D32]/20 rounded-xs flex items-start space-x-2.5 text-xs text-[#183D32]">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Form B: Personal Sign In */}
              {mode === 'signin' && (
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1.5 font-medium">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#202822]/40 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-xs text-[#202822] focus:outline-hidden focus:border-[#183D32] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1.5 font-medium">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#202822]/40 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-xs text-[#202822] focus:outline-hidden focus:border-[#183D32] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-[#183D32] text-[#FFFEFA] hover:bg-[#183D32]/90 rounded-sm font-semibold text-xs tracking-wider uppercase transition-all shadow-xs disabled:opacity-60 flex items-center justify-center space-x-2"
                    >
                      <span>{isLoading ? 'Verifying Session...' : 'Sign In to My Ledger'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="pt-4 border-t border-[#D8DCD1] text-center">
                    <p className="text-xs text-[#202822]/70">
                      New to VERDANT?{' '}
                      <button
                        type="button"
                        onClick={() => { setMode('register'); setErrorMsg(null); }}
                        className="text-[#183D32] font-semibold hover:underline"
                      >
                        Create an account
                      </button>{' '}
                      to build your personal financial roadmap.
                    </p>
                  </div>
                </form>
              )}

              {/* Form C: Registration */}
              {mode === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1 font-medium">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#202822]/40 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Priyanjali Roy"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-xs text-[#202822] focus:outline-hidden focus:border-[#183D32] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1 font-medium">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#202822]/40 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="priya@example.com"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-xs text-[#202822] focus:outline-hidden focus:border-[#183D32] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1 font-medium">
                        Password (min 6 chars)
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#202822]/40 absolute left-3 top-3" />
                        <input
                          type="password"
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-xs text-[#202822] focus:outline-hidden focus:border-[#183D32] transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono-num uppercase tracking-wider text-[#202822]/70 mb-1 font-medium">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#202822]/40 absolute left-3 top-3" />
                        <input
                          type="password"
                          required
                          value={regConfirm}
                          onChange={(e) => setRegConfirm(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-xs text-[#202822] focus:outline-hidden focus:border-[#183D32] transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F6F3EB] border border-[#D8DCD1] rounded-xs text-[11px] text-[#202822]/70">
                    <p className="font-semibold text-[#183D32] mb-0.5">Privacy & Isolation Guarantee:</p>
                    <p>Your account will start completely clean. Arjun Verma's demo data will never be seeded into your personal account.</p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-[#183D32] text-[#D5EE75] hover:bg-[#183D32]/90 rounded-sm font-semibold text-xs tracking-wider uppercase transition-all shadow-xs disabled:opacity-60 flex items-center justify-center space-x-2"
                    >
                      <span>{isLoading ? 'Creating Account...' : 'Register & Begin Onboarding'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="pt-3 border-t border-[#D8DCD1] text-center">
                    <p className="text-xs text-[#202822]/70">
                      Already registered?{' '}
                      <button
                        type="button"
                        onClick={() => { setMode('signin'); setErrorMsg(null); }}
                        className="text-[#183D32] font-semibold hover:underline"
                      >
                        Sign in to your account
                      </button>
                    </p>
                  </div>
                </form>
              )}
            </div>

            {/* Security Notice */}
            <div className="mt-8 pt-4 border-t border-[#D8DCD1] flex items-center justify-between text-[11px] font-mono-num text-[#202822]/50">
              <span>PBKDF2 Password Hashing</span>
              <span>Scoped User-ID Session JWT</span>
              <span>Deterministic Python Math</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#D8DCD1] bg-[#FFFEFA] px-6 lg:px-16 py-4 text-xs text-[#202822]/60 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>VERDANT Financial Planning System · Professional Training I Project</span>
        <span className="font-mono-num">Living Ledger Interface · Academic Review Edition</span>
      </footer>
    </div>
  );
};
