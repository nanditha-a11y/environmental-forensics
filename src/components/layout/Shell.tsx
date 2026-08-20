import { useState, type ReactNode } from 'react';
import { SearchProvider } from '../../context/SearchContext';
import { usePersistentState } from '../../hooks/usePersistentState';
import { BackgroundFX } from './BackgroundFX';
import { MobileSidebar, Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [collapsed, setCollapsed] = usePersistentState('efif_sidebar_collapsed', false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <SearchProvider>
      <div className="relative flex h-screen flex-col overflow-hidden">
        <BackgroundFX />
        <TopBar
          onToggleSidebar={() => setCollapsed((c) => !c)}
          onOpenMobileSidebar={() => setMobileOpen(true)}
        />
        <div className="flex min-h-0 flex-1">
          <Sidebar collapsed={collapsed} />
          <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
          <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto w-full max-w-[1700px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
          </main>
        </div>
      </div>
    </SearchProvider>
  );
}
