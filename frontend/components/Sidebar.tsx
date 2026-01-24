'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type SidebarProps = {
  isExpanded: boolean;
  isMobileOpen: boolean;
  onClose: () => void;
};

type NavItem = {
  label: string;
  href?: string;
  disabled?: boolean;
  badge?: string;
  icon: React.ReactNode;
};

const primaryItems: NavItem[] = [
  {
    label: 'Engineering Change Orders',
    href: '/',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M5 8h14M5 16h4" />
      </svg>
    )
  },
  {
    label: 'Reporting',
    href: '/reports',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19h16M7 16V9m5 7V5m5 11v-4" />
      </svg>
    )
  }
];

const masterDataItems: NavItem[] = [
  {
    label: 'Bills of Materials',
    href: '/boms',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h8" />
      </svg>
    )
  },
  {
    label: 'Products',
    href: '/products',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
      </svg>
    )
  }
];

const getSettingsItems = (isAdmin: boolean): NavItem[] => {
  if (!isAdmin) {
    return [];
  }
  
  return [
    {
      label: 'ECO Stages',
      href: '/settings/eco-stages',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      label: 'Approval Rules',
      disabled: true,
      badge: 'Soon',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];
};

function SidebarItem({
  item,
  isExpanded,
  isActive,
  onNavigate
}: {
  item: NavItem;
  isExpanded: boolean;
  isActive: boolean;
  onNavigate: () => void;
}) {
  const layoutClass = isExpanded ? 'gap-3 px-3' : 'gap-0 px-2 justify-center';
  const baseClass = `group relative flex items-center rounded-md py-2 text-sm font-medium transition-colors ${layoutClass}`;
  const activeClass = 'bg-emerald-50 text-emerald-700';
  const inactiveClass = 'text-gray-700 hover:bg-gray-100';
  const disabledClass = 'cursor-not-allowed text-gray-400 hover:bg-transparent';

  const content = (
    <>
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
          isActive
            ? 'bg-emerald-100 text-emerald-700'
            : 'text-gray-500 group-hover:text-gray-700'
        } ${item.disabled ? 'text-gray-300' : ''}`}
      >
        {item.icon}
      </span>
      <span className={isExpanded ? 'flex-1' : 'sr-only'}>{item.label}</span>
      {item.badge && isExpanded && (
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
          {item.badge}
        </span>
      )}
      
      {!isExpanded && (
        <div className="absolute left-16 z-50 rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
          {item.label}
        </div>
      )}
    </>
  );

  const className = `${baseClass} ${isActive ? activeClass : inactiveClass} ${
    item.disabled ? disabledClass : ''
  }`;

  if (item.href && !item.disabled) {
    return (
      <Link
        href={item.href}
        className={className}
        onClick={onNavigate}
        title={item.label}
        aria-current={isActive ? 'page' : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      disabled={item.disabled}
      aria-disabled={item.disabled}
      onClick={item.disabled ? undefined : onNavigate}
      title={item.label}
    >
      {content}
    </button>
  );
}

function SidebarContent({
  isExpanded,
  onNavigate
}: {
  isExpanded: boolean;
  onNavigate: () => void;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const settingsItems = getSettingsItems(isAdmin);
  
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString();
  const currentLocation = queryString ? `${pathname}?${queryString}` : pathname;
  const isItemActive = (href?: string) => {
    if (!href) {
      return false;
    }
    const [path, query] = href.split('?');
    if (query) {
      return currentLocation === href;
    }
    return pathname === path;
  };

  return (
    <div className="flex h-full flex-col">
      <div className={`${isExpanded ? 'px-4' : 'px-3'} pt-4`}>
        <div
          className={`flex items-center rounded-lg border border-gray-200 bg-white px-3 py-3 shadow-sm ${
            isExpanded ? 'gap-3' : 'justify-center px-2'
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className={isExpanded ? 'flex flex-col' : 'sr-only'}>
            <span className="text-sm font-semibold text-gray-900">ECOFlow</span>
            <span className="text-xs text-gray-500">
              Control Grid
            </span>
          </div>
        </div>
      </div>

      <div className={`px-4 ${isExpanded ? 'block' : 'hidden'} pt-3 text-xs text-gray-500`}>
        Engineering change control for products and BoMs.
      </div>

      <nav className="mt-6 flex-1 space-y-6 px-3">
        <div className="space-y-2">
          <div className={`flex items-center gap-3 px-3 ${isExpanded ? '' : 'sr-only'}`}>
            <span className="text-xs uppercase tracking-wide text-gray-400">ECO</span>
            <span className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="space-y-2">
            {primaryItems.map((item) => (
              <SidebarItem
                key={item.label}
                item={item}
                isExpanded={isExpanded}
                isActive={isItemActive(item.href)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <details className="group" open>
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-2 py-1 text-gray-500 transition-colors hover:bg-gray-100">
              <span className={`flex items-center ${isExpanded ? 'gap-2' : 'justify-center w-full'}`}>
                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h5l2 2h9v10H4V6z" />
                  </svg>
                </span>
                <span className={`text-xs uppercase ${isExpanded ? '' : 'sr-only'}`}>
                  Master Data
                </span>
              </span>
              <span className={`text-gray-600 transition group-open:rotate-180 ${isExpanded ? '' : 'sr-only'}`}>
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.19l3.71-3.96a.75.75 0 011.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </span>
            </summary>
            <div className={`mt-2 space-y-2 ${isExpanded ? '' : 'hidden'}`}>
              {masterDataItems.map((item) => (
                <SidebarItem
                  key={item.label}
                  item={item}
                  isExpanded={isExpanded}
                  isActive={isItemActive(item.href)}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </details>
        </div>

        {isAdmin && settingsItems.length > 0 && (
          <div className="space-y-2">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-2 py-1 text-gray-500 transition-colors hover:bg-gray-100">
                <span className={`flex items-center ${isExpanded ? 'gap-2' : 'justify-center w-full'}`}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 6h3m-4 4h5m-6 4h6m-7 4h7M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
                    </svg>
                  </span>
                  <span className={`text-xs uppercase ${isExpanded ? '' : 'sr-only'}`}>
                    Settings
                  </span>
                </span>
                <span className={`text-gray-600 transition group-open:rotate-180 ${isExpanded ? '' : 'sr-only'}`}>
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.19l3.71-3.96a.75.75 0 011.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </span>
              </summary>
              <div className={`mt-2 space-y-2 ${isExpanded ? '' : 'hidden'}`}>
                {settingsItems.map((item) => (
                  <SidebarItem
                    key={item.label}
                    item={item}
                    isExpanded={isExpanded}
                    isActive={isItemActive(item.href)}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </details>
          </div>
        )}
      </nav>

      <div className={`mt-auto px-4 pb-5 ${isExpanded ? 'block' : 'hidden'}`}>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs text-gray-600 shadow-sm">
          <div className="flex items-center justify-between">
            <span>Plant Node</span>
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500">Line A-07 - Revision control active.</p>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ isExpanded, isMobileOpen, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-gray-900/40 transition-opacity md:hidden ${
          isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        id="ecoflow-sidebar-mobile"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-200 bg-white shadow-xl transition-transform md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent isExpanded onNavigate={onClose} />
      </aside>

      <aside
        id="ecoflow-sidebar-desktop"
        className={`relative hidden h-screen flex-col border-r border-gray-200 bg-white transition-[width] md:flex ${
          isExpanded ? 'w-72' : 'w-20'
        }`}
      >
        <SidebarContent isExpanded={isExpanded} onNavigate={() => {}} />
      </aside>
    </>
  );
}
