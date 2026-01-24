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

  const isReportsPage = pathname === '/reports';
  const isHomePage = pathname === '/';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            aria-expanded={isSidebarOpen}
            aria-controls={sidebarId}
            className={`p-2 rounded-md transition-colors ${
              isSidebarOpen
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <nav className="hidden items-center gap-1 sm:flex">
            <button
              type="button"
              onClick={() => router.push('/')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isHomePage
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              ECOs
            </button>
            <button
              type="button"
              onClick={() => router.push('/reports')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isReportsPage
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Reports
            </button>
          </nav>
        </div>

        <div className="flex-1 text-center">
          <h1 className="text-sm sm:text-base font-semibold text-gray-900">
            Engineering Change Orders
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-sm font-medium text-gray-900">{user?.name}</span>
            <span className="text-xs text-gray-500">
              {user?.role}
            </span>
          </div>
          
          <div className="group relative">
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 hover:border-emerald-500 transition-colors">
              <span className="text-sm font-semibold text-emerald-700">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </button>
            <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-1 z-50">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-100 mb-1">
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
