import React, { useState } from 'react';
import { Lock, Shield, ArrowRight, KeyRound, Sparkles, UserCheck, UserPlus, Database } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../hooks/useAuth';

export function LoginScreen({ isCryptoInitializing }) {
  const { login, signup, authError, setAuthError } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setAuthError('Please enter a username');
      return;
    }

    if (!password) {
      setAuthError('Please enter a password');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setAuthError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setAuthError('Passwords do not match');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(trimmedUser, password);
      } else {
        await signup(trimmedUser, password);
      }
    } catch (err) {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 bg-radial-gradient">
      {/* Top Bar */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-cyan-500 bg-cyan-500/10 border border-cyan-500/20 tracking-wider uppercase">
          <Database size={14} />
          <span>PostgreSQL & Zero-Knowledge E2EE</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md p-8 glass-card rounded-2xl flex flex-col gap-6 text-center shadow-2xl">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
            Cipher<span className="bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">Chat</span>
          </h1>
          <p className="text-sm text-[var(--text-sub)]">Authenticated End-to-End Encrypted Messaging</p>
        </div>

        {/* Login / Signup Tabs */}
        <div className="flex p-1 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setAuthError('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md'
                : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
            }`}
          >
            <UserCheck size={14} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setAuthError('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md'
                : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
            }`}
          >
            <UserPlus size={14} />
            <span>Register Account</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col items-start gap-1.5">
            <label htmlFor="username-input" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-sub)]">
              Username Handle
            </label>
            <input
              id="username-input"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (authError) setAuthError('');
              }}
              placeholder="e.g. Alice, Bob, Neo"
              maxLength={25}
              autoFocus
              disabled={isSubmitting || isCryptoInitializing}
              className="w-full px-4 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-main)] text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          <div className="flex flex-col items-start gap-1.5">
            <label htmlFor="password-input" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-sub)]">
              Password
            </label>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (authError) setAuthError('');
              }}
              placeholder="••••••••"
              disabled={isSubmitting || isCryptoInitializing}
              className="w-full px-4 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-main)] text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          {mode === 'signup' && (
            <div className="flex flex-col items-start gap-1.5">
              <label htmlFor="confirm-password-input" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-sub)]">
                Confirm Password
              </label>
              <input
                id="confirm-password-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (authError) setAuthError('');
                }}
                placeholder="••••••••"
                disabled={isSubmitting || isCryptoInitializing}
                className="w-full px-4 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-main)] text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              />
            </div>
          )}

          {authError && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-medium text-red-500 text-center">
              {authError}
            </div>
          )}

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--card-sub)] border border-dashed border-[var(--glass-border)] text-xs text-[var(--text-sub)] text-left">
            <KeyRound size={14} className="text-indigo-400 shrink-0" />
            <span>Passswords hashed with bcryptjs. ECDH P-256 keys generated locally.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isCryptoInitializing || !username.trim() || !password}
            className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isSubmitting || isCryptoInitializing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {mode === 'login' ? 'Authenticating & Generating Keys...' : 'Registering Account...'}
              </span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Secure Space' : 'Create Encrypted Account'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="flex justify-around pt-4 border-t border-[var(--glass-border)] text-xs text-[var(--text-sub)]">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-indigo-400" />
            <span>JWT Session Tokens</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield size={14} className="text-cyan-400" />
            <span>AES-GCM 256-Bit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
