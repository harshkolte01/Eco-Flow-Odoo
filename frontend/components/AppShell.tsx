'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Footer } from '@/components/Footer';

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const handleChange = () => setIsDesktop(media.matches);
    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const handleSidebarToggle = () => {
    if (isDesktop) {
      setIsSidebarExpanded((prev) => !prev);
      return;
    }
    setIsSidebarOpen((prev) => !prev);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const isSidebarActive = isDesktop ? isSidebarExpanded : isSidebarOpen;
  const sidebarId = isDesktop ? 'ecoflow-sidebar-desktop' : 'ecoflow-sidebar-mobile';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        isExpanded={isSidebarExpanded}
        isMobileOpen={isSidebarOpen}
        onClose={handleSidebarClose}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onToggleSidebar={handleSidebarToggle} isSidebarOpen={isSidebarActive} sidebarId={sidebarId} />
        <div className="flex-1 overflow-y-auto">
          {children}
          <Footer />
        </div>
      </div>
    </div>
  );
}
