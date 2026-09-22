'use client';

import { ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { FsNode } from '@/types';

const MAX_VISIBLE_SEGMENTS = 4;

export interface BreadcrumbProps {
  path: FsNode[];
  onNavigate: (id: string) => void;
}

export function Breadcrumb({ path, onNavigate }: BreadcrumbProps): ReactNode {
  if (path.length === 0) return null;

  const collapsed = path.length > MAX_VISIBLE_SEGMENTS;
  const head = collapsed ? path.slice(0, 1) : path;
  const hidden = collapsed ? path.slice(1, path.length - 2) : [];
  const tail = collapsed ? path.slice(path.length - 2) : [];

  const lastId = path[path.length - 1]?.id;
  const pathKey = path.map(node => node.id).join('/');

  const renderSegment = (node: FsNode): ReactNode => (
    <button
      key={node.id}
      type="button"
      onClick={() => onNavigate(node.id)}
      aria-current={node.id === lastId ? 'page' : undefined}
      className={`max-w-36 truncate rounded px-1 py-0.5 transition-colors focus-ring sm:max-w-56 ${
        node.id === lastId ? 'font-medium text-ink' : 'text-muted hover:bg-elevated hover:text-ink'
      }`}
    >
      {node.name}
    </button>
  );

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <div className="flex items-center gap-0.5 overflow-hidden text-[13px]">
        {head.map((node, index) => (
          <span key={node.id} className="flex min-w-0 items-center gap-0.5">
            {index > 0 && <Separator />}
            {renderSegment(node)}
          </span>
        ))}

        {collapsed && (
          <>
            <Separator />

            <CollapsedSegments key={pathKey} segments={hidden} onNavigate={onNavigate} />
          </>
        )}

        {tail.map(node => (
          <span key={node.id} className="flex min-w-0 items-center gap-0.5">
            <Separator />
            {renderSegment(node)}
          </span>
        ))}
      </div>
    </nav>
  );
}

function Separator(): ReactNode {
  return <ChevronRight className="size-3.5 shrink-0 text-subtle" aria-hidden="true" />;
}

function CollapsedSegments({
  segments,
  onNavigate,
}: {
  segments: FsNode[];
  onNavigate: (id: string) => void;
}): ReactNode {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointer = (event: globalThis.MouseEvent): void => {
      if (containerRef.current?.contains(event.target as Node) === true) return;
      setOpen(false);
    };
    const handleEscape = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <span ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-label={`Show ${segments.length} hidden folders`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded px-1.5 py-0.5 text-muted transition-colors hover:bg-elevated hover:text-ink focus-ring"
      >
        …
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-7 z-30 w-56 overflow-hidden rounded-lg border border-line bg-surface p-1 shadow-panel"
        >
          {segments.map(node => (
            <button
              key={node.id}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onNavigate(node.id);
              }}
              className="block w-full truncate rounded-md px-2 py-1.5 text-left text-[13px] text-ink transition-colors hover:bg-elevated focus-ring"
            >
              {node.name}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
