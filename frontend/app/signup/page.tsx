'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';

export default function SignupPage() {
  const [loginId, setLoginId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [backendErrors, setBackendErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    loginId?: string;
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const { signup, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const validateFields = (): boolean => {
    const errors: {
      loginId?: string;
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    // Login ID validation
    if (!loginId) {
      errors.loginId = 'Login ID is required';
    } else if (loginId.length < 6 || loginId.length > 12) {
      errors.loginId = 'Login ID must be 6-12 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(loginId)) {
      errors.loginId = 'Login ID can only contain letters, numbers, - and _';
    }

    // Name validation
    if (!name) {
      errors.name = 'Name is required';
    } else if (name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (name.length > 100) {
      errors.name = 'Name must be less than 100 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Invalid email format';
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Client-side validation
    if (!validateFields()) {
      return;
    }

    setLoading(true);

    try {
      await signup(loginId, name, email, password);
      // Navigation is handled by the signup function
    } catch (err) {
      if (err instanceof ApiError && err.errors && err.errors.length > 0) {
        setBackendErrors(err.errors);
        setError('Validation failed');
      } else {
        setError(err instanceof Error ? err.message : 'Signup failed');
        setBackendErrors([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading during auth hydration
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex items-center justify-center bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 p-4 relative">
        {/* Decorative background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-200/30 blur-3xl" />
        </div>

        <div className="w-full max-w-[480px] relative">
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" x2="20" y1="8" y2="14" /><line x1="23" x2="17" y1="11" y2="11" /></svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create account</h1>
              <p className="mt-2 text-sm text-gray-500">
                Join EcoFlow to get started
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-lg bg-red-50/50 p-4 text-sm text-red-600 border border-red-100">
                <div className="flex items-center gap-3 mb-1">
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-bold">{error}</span>
                </div>
                {backendErrors.length > 0 && (
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-8">
                    {backendErrors.map((err, index) => (
                      <li key={index} className="leading-relaxed">{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="loginId" className="block text-sm font-semibold text-gray-700 ml-1">
                  Login ID
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-200">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="loginId"
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className={`block w-full rounded-xl border pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-4 ${fieldErrors.loginId
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10 bg-red-50/30'
                      : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10 hover:border-emerald-300 bg-gray-50/50 focus:bg-white'
                      }`}
                    placeholder="Choose a login ID"
                    disabled={loading}
                  />
                </div>
                {fieldErrors.loginId && (
                  <p className="text-sm text-red-500 ml-1 font-medium">{fieldErrors.loginId}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 ml-1">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-200">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`block w-full rounded-xl border pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-4 ${fieldErrors.name
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10 bg-red-50/30'
                      : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10 hover:border-emerald-300 bg-gray-50/50 focus:bg-white'
                      }`}
                    placeholder="John Doe"
                    disabled={loading}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-sm text-red-500 ml-1 font-medium">{fieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-200">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full rounded-xl border pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-4 ${fieldErrors.email
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10 bg-red-50/30'
                      : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10 hover:border-emerald-300 bg-gray-50/50 focus:bg-white'
                      }`}
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-sm text-red-500 ml-1 font-medium">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-200">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`block w-full rounded-xl border pl-11 pr-12 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-4 ${fieldErrors.password
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10 bg-red-50/30'
                      : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10 hover:border-emerald-300 bg-gray-50/50 focus:bg-white'
                      }`}
                    placeholder="Min. 8 characters"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? (
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
                {fieldErrors.password && (
                  <p className="text-sm text-red-500 ml-1 font-medium">{fieldErrors.password}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 ml-1">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-200">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`block w-full rounded-xl border pl-11 pr-12 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-4 ${fieldErrors.confirmPassword
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10 bg-red-50/30'
                      : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10 hover:border-emerald-300 bg-gray-50/50 focus:bg-white'
                      }`}
                    placeholder="Re-enter your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  >
                    {showConfirmPassword ? (
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
                    Creating account...
                  </span>
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
