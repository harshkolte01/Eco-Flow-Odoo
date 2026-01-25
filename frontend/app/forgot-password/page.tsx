'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'token' | 'password'>('email');
  const [resetToken, setResetToken] = useState('');
  const [displayToken, setDisplayToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<any>({});

  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErrors({ email: 'Valid email is required' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      // Check if email service is configured (production mode)
      if (data.resetToken && data.email) {
        // MVP Mode: Token returned in response (email service not configured)
        setDisplayToken(data.resetToken);
        setSuccess('Reset token generated! Copy the token below.');
        setStep('token');
      } else {
        // Production Mode: Email sent successfully
        setDisplayToken('');
        setSuccess('Password reset instructions have been sent to your email. Please check your inbox.');
        setStep('token');
      }
    } catch (err) {
      // Generic success message (don't reveal if email exists)
      setDisplayToken('');
      setSuccess('If your email is registered, you will receive a password reset link shortly.');
      setStep('token');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const errors: any = {};
    if (!resetToken) errors.resetToken = 'Reset token is required';
    if (!newPassword || newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/[a-zA-Z]/.test(newPassword)) {
      errors.newPassword = 'Must contain letters';
    } else if (!/[0-9]/.test(newPassword)) {
      errors.newPassword = 'Must contain numbers';
    }
    if (confirmPassword !== newPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token: resetToken,
          newPassword,
          confirmPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => (window.location.href = '/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex items-center justify-center bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 p-4 relative">
        {/* Decorative background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-200/30 blur-3xl" />
        </div>

        <div className="w-full max-w-[440px] relative">
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reset Password</h1>
              <p className="mt-2 text-sm text-gray-500">
                {step === 'email' && 'Enter your email address to get started'}
                {step === 'token' && 'Enter the reset token'}
                {step === 'password' && 'Create your new password'}
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-lg bg-red-50/50 p-4 text-sm text-red-600 border border-red-100">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-lg bg-green-50/50 p-4 text-sm text-green-600 border border-green-100">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{success}</span>
                </div>
              </div>
            )}

            {/* Step 1: Email Input */}
            {step === 'email' && (
              <form onSubmit={handleRequestReset} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 ml-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full rounded-xl border px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-4 ${
                      fieldErrors.email
                        ? 'border-red-300 focus:ring-red-500/10 bg-red-50/30'
                        : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10 hover:border-emerald-300 bg-gray-50/50 focus:bg-white'
                    }`}
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                  {fieldErrors.email && (
                    <p className="text-sm text-red-500 ml-1 font-medium">{fieldErrors.email}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:bg-emerald-700 hover:shadow-emerald-500/40 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Token'
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Token Display & Input */}
            {step === 'token' && (
              <div className="space-y-5">
                {displayToken ? (
                  // MVP Mode: Display token directly
                  <>
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-4">
                      <p className="text-xs font-semibold text-amber-900 mb-1">⚠️ Development Mode</p>
                      <p className="text-xs text-amber-700">Email service is not configured. In production, this token will be sent to your email.</p>
                    </div>
                    
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                      <p className="text-xs font-semibold text-blue-900 mb-2">Your Reset Token:</p>
                      <div className="bg-white rounded border border-blue-300 p-3 font-mono text-sm break-all">
                        {displayToken}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(displayToken);
                          setSuccess('Token copied to clipboard!');
                        }}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                  </>
                ) : (
                  // Production Mode: Email sent
                  <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <svg className="h-5 w-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-green-900 mb-1">Check Your Email</p>
                        <p className="text-xs text-green-700">We've sent a password reset link and token to <strong>{email}</strong>. Please check your inbox and spam folder.</p>
                      </div>
                    </div>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!resetToken) {
                      setFieldErrors({ resetToken: 'Please enter the reset token' });
                      return;
                    }
                    setStep('password');
                  }}
                  className="space-y-5"
                >
                  <div className="space-y-1.5">
                    <label htmlFor="resetToken" className="block text-sm font-semibold text-gray-700 ml-1">
                      Reset Token
                    </label>
                    <textarea
                      id="resetToken"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Paste your reset token here"
                      rows={3}
                      className={`w-full rounded-xl border px-4 py-3 font-mono text-sm transition-all duration-200 focus:outline-none focus:ring-4 ${
                        fieldErrors.resetToken
                          ? 'border-red-300 focus:ring-red-500/10 bg-red-50/30'
                          : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10 hover:border-emerald-300 bg-gray-50/50 focus:bg-white'
                      }`}
                    />
                    {fieldErrors.resetToken && (
                      <p className="text-sm text-red-500 ml-1 font-medium">{fieldErrors.resetToken}</p>
                    )}
                    <p className="text-xs text-gray-500 ml-1 mt-1">
                      {displayToken ? 'Copy the token from above' : 'Enter the token from your email'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={!resetToken}
                    className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:bg-emerald-700 hover:shadow-emerald-500/40 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                  >
                    Continue
                  </button>
                </form>
              </div>
            )}

            {/* Step 3: New Password Input */}
            {step === 'password' && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 ml-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`w-full rounded-xl border px-4 py-3 pr-12 transition-all duration-200 focus:outline-none focus:ring-4 ${
                        fieldErrors.newPassword
                          ? 'border-red-300 focus:ring-red-500/10 bg-red-50/30'
                          : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10 hover:border-emerald-300 bg-gray-50/50 focus:bg-white'
                      }`}
                      placeholder="Enter new password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPasswords.new ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {fieldErrors.newPassword && (
                    <p className="text-sm text-red-500 ml-1 font-medium">{fieldErrors.newPassword}</p>
                  )}
                  <p className="text-xs text-gray-500 ml-1 mt-1">Min 8 chars, must include letters and numbers</p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 ml-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full rounded-xl border px-4 py-3 pr-12 transition-all duration-200 focus:outline-none focus:ring-4 ${
                        fieldErrors.confirmPassword
                          ? 'border-red-300 focus:ring-red-500/10 bg-red-50/30'
                          : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10 hover:border-emerald-300 bg-gray-50/50 focus:bg-white'
                      }`}
                      placeholder="Confirm new password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPasswords.confirm ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-sm text-red-500 ml-1 font-medium">{fieldErrors.confirmPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:bg-emerald-700 hover:shadow-emerald-500/40 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                      Resetting...
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <Link
                href="/login"
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                &larr; Back to Login
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
