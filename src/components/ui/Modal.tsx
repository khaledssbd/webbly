'use client';

import { X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

const subscribeToNothing = (): (() => void) => () => {};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  hideCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
}

export function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  hideCloseButton = false,
  closeOnBackdropClick = true,
}: ModalProps): ReactNode {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const isClient = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (first ?? panel)?.focus();

    return () => {
      triggerRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>): void => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (panel === null) return;

      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)];
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (first === undefined || last === undefined) return;

      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  if (!isClient || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
      onKeyDown={handleKeyDown}
    >
      <div
        className="absolute inset-0 bg-ink/25 backdrop-blur-[2px] motion-safe:animate-[fade-in_120ms_ease-out]"
        onClick={closeOnBackdropClick ? onClose : undefined}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description === undefined ? undefined : descriptionId}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-t-2xl border border-line bg-surface shadow-panel outline-none motion-safe:animate-[slide-up_160ms_cubic-bezier(0.22,1,0.36,1)] sm:rounded-2xl"
      >
        <div className="flex items-start gap-3 px-5 pt-5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
              {title}
            </h2>
            {description !== undefined && (
              <p id={descriptionId} className="mt-1.5 text-[13px] leading-relaxed text-muted">
                {description}
              </p>
            )}
          </div>

          {!hideCloseButton && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="-mr-1 -mt-1 grid size-7 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-ink focus-ring"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {children !== undefined && <div className="px-5 pt-4">{children}</div>}

        {footer !== undefined && (
          <div className="flex flex-col-reverse gap-2 px-5 pb-5 pt-5 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
