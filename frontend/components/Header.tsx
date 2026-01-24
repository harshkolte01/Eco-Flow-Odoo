'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="flex h-12 items-center justify-between px-4">
        <div className="flex items-center">
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="flex-1 text-center">
          <h1 className="text-sm md:text-lg font-bold text-emerald-700 uppercase tracking-widest px-4">
            Engineering Change Orders (ECO&apos;s)
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="group relative">
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 hover:border-emerald-500 transition-all focus:outline-none">
              <span className="text-sm font-bold text-emerald-700">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </button>
            <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-1 z-50">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b border-gray-50 mb-1">
                {user?.name || 'Account'}
              </div>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
