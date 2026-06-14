import React, { useState } from 'react';
import { X, User as UserIcon, Mail, Lock, Sparkles } from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  initialMode: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onLoginSuccess,
  initialMode,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password || (mode === 'signup' && !name)) {
      setErrorMsg('Please complete all fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password should contain at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login' 
        ? { email, password }
        : { name, email, password, isAdmin: false };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Connecting server failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="authPortalOverlay" className="fixed inset-0 bg-neutral-900/35 backdrop-blur-[6px] flex items-center justify-center z-50 p-4">
      <div 
        id="authPortalCard" 
        className="bg-white border border-zinc-200 p-8 md:p-10 w-full max-w-md shadow-[0_45px_90px_rgba(0,0,0,0.12)] relative animate-fade-in"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-1.5 hover:bg-neutral-50 rounded-full transition-colors cursor-pointer"
          aria-label="Close authentication form"
        >
          <X className="w-5 h-5 text-neutral-800" />
        </button>

        <h2 className="text-2xl font-serif font-bold text-neutral-900 text-center uppercase tracking-[2px] mb-1.5">
          {mode === 'login' ? 'Customer Sign In' : 'Join The Registry'}
        </h2>
        <p className="text-[12px] text-neutral-400 font-sans italic text-center mb-8">
          {mode === 'login' ? 'Please enter your login credentials' : 'Register your premium ownership today'}
        </p>

        {errorMsg && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-750 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-sans font-bold tracking-[1.5px] uppercase text-neutral-700 block gap-1">
                Your Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 border border-zinc-250 bg-zinc-50 font-sans text-sm focus:bg-white focus:outline-none focus:border-black transition-all"
                  placeholder="e.g. Richard Mille"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-sans font-bold tracking-[1.5px] uppercase text-neutral-700 block">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 border border-zinc-250 bg-zinc-50 font-sans text-sm focus:bg-white focus:outline-none focus:border-black transition-all"
                placeholder="you@boutique.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-sans font-bold tracking-[1.5px] uppercase text-neutral-700 block">
              Safe Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 border border-zinc-250 bg-zinc-50 font-sans text-sm focus:bg-white focus:outline-none focus:border-black transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 border border-neutral-900 text-white hover:bg-neutral-850 font-bold text-xs tracking-[2px] uppercase py-4 transition-all duration-300 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Processing Registry...' : mode === 'login' ? 'Establish Session' : 'Register Profile'}
          </button>
        </form>

        <div className="mt-8 border-t border-zinc-100 pt-6 text-center">
          {mode === 'login' ? (
            <p className="text-xs text-neutral-400 font-sans">
              First time visiting us?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-neutral-900 font-sans font-bold underline cursor-pointer hover:text-black"
              >
                Create Account
              </button>
            </p>
          ) : (
            <p className="text-xs text-neutral-400 font-sans">
              Already have an registered account?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-neutral-900 font-sans font-bold underline cursor-pointer hover:text-black"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
