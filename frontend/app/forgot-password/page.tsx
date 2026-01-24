'use client';

import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 px-4 relative">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900">Forgot Password</h1>
              <p className="mt-2 text-sm text-gray-600">
                Password reset functionality coming soon
              </p>
            </div>
            <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                This feature is not yet implemented. Please contact your
                administrator to reset your password.
              </p>
            </div>
            <div className="text-center">
              <Link
                href="/login"
                className="font-medium text-emerald-600 hover:text-emerald-700"
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
