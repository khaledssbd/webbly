'use client';

import { Check } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

const TOAST_DURATION_MS = 1800;

interface ToastState {
  id: number;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }): ReactNode {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string): void => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);

    setToast({ id: Date.now(), message });
    timerRef.current = window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-60 flex justify-center px-4"
      >
        {toast !== null && (
          <div
            key={toast.id}
            className="flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink shadow-panel motion-safe:animate-[slide-up_180ms_cubic-bezier(0.22,1,0.36,1)]"
          >
            <Check className="size-3.5 text-accent" aria-hidden="true" />
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === null) {
    throw new Error('useToast must be used inside a <ToastProvider>.');
  }
  return context;
}
