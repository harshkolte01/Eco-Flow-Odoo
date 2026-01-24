import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200/70 bg-gradient-to-b from-white to-slate-50/70">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500/30">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">ECOFlow</p>
              <p className="text-xs text-slate-500">Precision workflow automation.</p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
            <Link href="/" className="transition-colors hover:text-emerald-600">
              Overview
            </Link>
            <a href="#" className="transition-colors hover:text-emerald-600">
              Documentation
            </a>
            <a href="#" className="transition-colors hover:text-emerald-600">
              Support
            </a>
          </nav>
        </div>
        <div className="mt-5 flex flex-col gap-2 border-t border-slate-200/60 pt-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© {currentYear} ECOFlow. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <a href="#" className="transition-colors hover:text-emerald-600">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-emerald-600">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
