import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, Sparkles, QrCode } from 'lucide-react';
import { loginCoordinator, getCoordinatorSession } from '../../services/db';
import { showToast } from '../common/Toast';

interface LoginViewProps {
  onLoginSuccess: () => void;
  onOpenStudentPortal: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onOpenStudentPortal,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await loginCoordinator(email.trim(), password);
      showToast(`Welcome back, ${user.name || 'Coordinator'}!`, 'success');
      onLoginSuccess();
    } catch (err: any) {
      showToast(err.message || 'Invalid email or password.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-between p-4 sm:p-6 text-[#222222]">
      {/* Top Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Creativa Logo"
            className="h-10 w-auto object-contain shrink-0"
          />
          <div>
            <span className="font-extrabold text-base text-[#222222] tracking-tight">Creativa</span>
            <span className="text-[11px] font-bold text-[#b45309] bg-[#fef3e2] border border-[#f8af43]/30 px-2 py-0.5 rounded-full ml-2">
              Aswan Hub
            </span>
          </div>
        </div>

        {/* Shortcut to Student Portal demo */}
        <button
          onClick={onOpenStudentPortal}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-[#e6eff8] hover:text-[#004e9e] text-xs font-bold text-[#222222] border border-[#e5e5e5] transition-all shadow-xs"
        >
          <QrCode className="w-3.5 h-3.5 text-[#004e9e]" />
          <span>Student Portal Entry</span>
        </button>
      </div>

      {/* Center Auth Card */}
      <div className="max-w-md w-full mx-auto my-12 bg-white rounded-3xl border border-[#e5e5e5] p-8 sm:p-10 text-[#222222]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white border border-[#e5e5e5] p-2 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <img
              src="/logo.png"
              alt="Creativa Innovation Hub"
              className="h-12 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-extrabold text-[#222222] tracking-tight">Coordinator Portal</h1>
          <p className="text-xs text-[#616161] mt-1.5 leading-relaxed">
            Sign in to manage training cohorts, configure Pre/Post tests, and publish assessment results.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full pl-11 pr-4 py-3 bg-[#fafafa] border border-[#e5e5e5] rounded-full text-sm font-medium text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#004e9e] focus:bg-white transition-all"
              />
              <Mail className="w-4 h-4 text-[#9e9e9e] absolute left-4 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-[#fafafa] border border-[#e5e5e5] rounded-full text-sm font-medium text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#004e9e] focus:bg-white transition-all"
              />
              <Lock className="w-4 h-4 text-[#9e9e9e] absolute left-4 top-3.5 pointer-events-none" />
            </div>
          </div>


          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-pill-primary py-3.5 px-5 font-bold text-sm shadow-xs mt-2 disabled:opacity-50"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In to Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Minimal Footer */}
      <footer className="text-center text-[11px] font-medium text-slate-400 py-4">
        Creativa Aswan Team
      </footer>
    </div>
  );
};
