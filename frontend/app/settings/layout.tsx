'use client';

import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/');
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex h-full flex-col md:flex-row">
          {/* Settings Sidebar */}
          <nav className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-gray-200 bg-white">
            <div className="p-6">
              <h2 className="mb-6 text-xl font-semibold text-gray-900">Settings</h2>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/settings/eco-stages"
                    className="block rounded-md px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>ECO Stages</span>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings/approval-rules"
                    className="block rounded-md px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Approval Rules</span>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings/users"
                    className="block rounded-md px-4 py-2.5 text-sm font-medium text-gray-400 transition-colors cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span>User Management</span>
                      <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        Soon
                      </span>
                    </div>
                  </Link>
                </li>
              </ul>
            </div>
          </nav>

          {/* Settings Content */}
          <div className="flex-1 overflow-auto bg-gray-50">
            {children}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
