'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import { MainPanel } from '@/components/MainPanel';
import { Sidebar } from '@/components/Sidebar';
import { ToastProvider } from '@/components/ui/Toast';
import { WorkspaceProvider, useWorkspace } from '@/context/WorkspaceContext';

const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 460;
const DEFAULT_SIDEBAR_WIDTH = 280;
const RESIZE_STEP = 16;

export default function Page(): ReactNode {
  return (
    <ToastProvider>
      <WorkspaceProvider>
        <ExplorerShell />
      </WorkspaceProvider>
    </ToastProvider>
  );
}

function ExplorerShell(): ReactNode {
  const { isHydrated } = useWorkspace();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const isResizingRef = useRef(false);

  const closeDrawer = useCallback((): void => setDrawerOpen(false), []);
  const openDrawer = useCallback((): void => setDrawerOpen(true), []);

  useEffect(() => {
    if (!drawerOpen) return;

    const handler = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [drawerOpen]);

  useEffect(() => {
    const handleMove = (event: globalThis.MouseEvent): void => {
      if (!isResizingRef.current) return;
      event.preventDefault();
      setSidebarWidth(Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, event.clientX)));
    };

    const handleUp = (): void => {
      if (!isResizingRef.current) return;
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, []);

  const startResize = useCallback((): void => {
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleResizeKey = useCallback((event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();

    const delta = event.key === 'ArrowLeft' ? -RESIZE_STEP : RESIZE_STEP;
    setSidebarWidth(width => Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width + delta)));
  }, []);

  if (!isHydrated) return <WorkspaceSkeleton />;

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-canvas">
      <aside style={{ width: `${sidebarWidth}px` }} className="hidden shrink-0 border-r border-line md:block">
        <Sidebar />
      </aside>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        aria-valuenow={sidebarWidth}
        aria-valuemin={MIN_SIDEBAR_WIDTH}
        aria-valuemax={MAX_SIDEBAR_WIDTH}
        tabIndex={0}
        onMouseDown={startResize}
        onKeyDown={handleResizeKey}
        className="hidden w-1 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-accent-soft focus-ring md:block"
      />

      <main className="flex min-w-0 flex-1 flex-col bg-surface">
        <MainPanel onOpenSidebar={openDrawer} />
      </main>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-ink/30 motion-safe:animate-[fade-in_120ms_ease-out]"
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-[min(84vw,320px)] border-r border-line bg-surface shadow-panel motion-safe:animate-[slide-in-left_180ms_cubic-bezier(0.22,1,0.36,1)]">
            <Sidebar onNavigate={closeDrawer} onClose={closeDrawer} />
          </div>
        </div>
      )}
    </div>
  );
}

function WorkspaceSkeleton(): ReactNode {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-canvas" aria-busy="true">
      <div className="hidden w-70 shrink-0 border-r border-line bg-surface md:block">
        <div className="h-14 border-b border-line" />
        <div className="space-y-2 p-4">
          {[...Array<number>(6)].map((_, index) => (
            <div
              key={index}
              style={{ width: `${70 - index * 6}%` }}
              className="h-4 animate-pulse rounded bg-elevated"
            />
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col bg-surface">
        <div className="h-14 border-b border-line" />
        <div className="h-14.25 border-b border-line" />
        <div className="space-y-2 p-4 sm:p-6">
          {[...Array<number>(5)].map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-lg bg-elevated" />
          ))}
        </div>
      </div>

      <span className="sr-only">Loading workspace…</span>
    </div>
  );
}
