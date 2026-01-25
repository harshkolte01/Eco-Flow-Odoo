'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const validateFields = (): boolean => {
    const errors: any = {};

    if (!oldPassword) {
      errors.oldPassword = 'Current password is required';
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Must be at least 8 characters';
    } else if (!/[a-zA-Z]/.test(newPassword)) {
      errors.newPassword = 'Must contain at least one letter';
    } else if (!/[0-9]/.test(newPassword)) {
      errors.newPassword = 'Must contain at least one number';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (confirmPassword !== newPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    if (!validateFields()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
          confirmPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      setSuccess('Password changed successfully! Redirecting...');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => router.push('/'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

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
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Change Password</h1>
              <p className="mt-2 text-sm text-gray-500">
                Update your account password securely
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

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label htmlFor="oldPassword" className="block text-sm font-semibold text-gray-700 ml-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="oldPassword"
                    type={showPasswords.old ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className={`w-full rounded-xl border px-4 py-3 pr-12 transition-all duration-200 focus:outline-none focus:ring-4 ${
                      fieldErrors.oldPassword
                        ? 'border-red-300 focus:ring-red-500/10 bg-red-50/30'
                        : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10 hover:border-emerald-300 bg-gray-50/50 focus:bg-white'
                    }`}
                    placeholder="Enter current password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPasswords.old ? (
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
                {fieldErrors.oldPassword && (
                  <p className="text-sm text-red-500 ml-1 font-medium">{fieldErrors.oldPassword}</p>
                )}
              </div>

              {/* New Password */}
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

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 ml-1">
                  Confirm New Password
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
                    Changing Password...
                  </span>
                ) : (
                  'Change Password'
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <Link
                href="/"
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                &larr; Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
