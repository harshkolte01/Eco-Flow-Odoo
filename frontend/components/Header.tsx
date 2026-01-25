'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

type HeaderProps = {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  sidebarId?: string;
};

export function Header({ onToggleSidebar, isSidebarOpen, sidebarId }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isHomePage = pathname === '/';


  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            aria-expanded={isSidebarOpen}
            aria-controls={sidebarId}
            className={`p-2 rounded-xl transition-all duration-200 ${
              isSidebarOpen
                ? 'bg-emerald-50 text-emerald-600 shadow-sm'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <nav className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => router.push('/')}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                isHomePage
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              ECOs
            </button>

          </nav>
        </div>

        <div className="flex-1 text-center hidden md:block">
          <h1 className="text-base font-bold text-gray-900 tracking-tight">
            Engineering Change Orders
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-sm font-semibold text-gray-900 leading-none mb-1">{user?.name}</span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {user?.role}
            </span>
          </div>
          
          <div className="group relative">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-2 ring-white shadow-md hover:shadow-lg transition-all duration-200">
              <span className="text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </button>
            <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-white shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right py-2 z-50">
              <div className="px-5 py-3 border-b border-gray-50 mb-1">
                <p className="text-sm font-semibold text-gray-900">{user?.name || 'Account'}</p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="w-full text-left px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
