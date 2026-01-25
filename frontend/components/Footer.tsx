import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-gray-500 sm:flex-row sm:px-6 lg:px-8">
        <p>© {currentYear} ECOFlow. All rights reserved.</p>
        <nav className="flex gap-6">
          <Link href="/" className="transition-colors hover:text-gray-900">
            Overview
          </Link>
          <a href="#" className="transition-colors hover:text-gray-900">
            Documentation
          </a>
          <a href="#" className="transition-colors hover:text-gray-900">
            Support
          </a>
          <a href="#" className="transition-colors hover:text-gray-900">
            Privacy
          </a>
          <a href="#" className="transition-colors hover:text-gray-900">
            Terms
          </a>
        </nav>
      </div>
    </footer>
  );
}
