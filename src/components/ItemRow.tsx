'use client';

import { FileText, Folder, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
import { byteSize, describeNodeType, formatBytes, formatItemCount } from '@/lib/fsUtils';
import type { FsNode } from '@/types';

export interface ItemRowProps {
  node: FsNode;
  childCount: number;
  isActive: boolean;
  onClick: () => void;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function ItemRowImpl({
  node,
  childCount,
  isActive,
  onClick,
  onOpen,
  onRename,
  onDelete,
}: ItemRowProps): ReactNode {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isFolder = node.type === 'folder';
  const meta = isFolder ? formatItemCount(childCount) : formatBytes(byteSize(node.content));

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointer = (event: globalThis.MouseEvent): void => {
      if (menuRef.current?.contains(event.target as Node) === true) return;
      setMenuOpen(false);
    };
    const handleEscape = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  return (
    <li
      className={`group relative flex items-center rounded-lg border border-transparent transition-colors ${
        isActive ? 'border-line bg-elevated' : 'hover:bg-elevated'
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        onDoubleClick={isFolder ? onOpen : undefined}
        onKeyDown={event => {
          if (isFolder && event.key === 'Enter') {
            event.preventDefault();
            onOpen();
          }
        }}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-left focus-ring"
      >
        {isFolder ? (
          <Folder className="size-4.5 shrink-0 text-accent" aria-hidden="true" />
        ) : (
          <FileText className="size-4.5 shrink-0 text-subtle" aria-hidden="true" />
        )}

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-ink">{node.name}</span>
          <span className="mt-0.5 block truncate text-[11px] text-subtle sm:hidden">
            {describeNodeType(node.type)} · {meta}
          </span>
        </span>

        <span className="hidden w-28 shrink-0 text-[12px] text-muted sm:block">
          {describeNodeType(node.type)}
        </span>
        <span className="hidden w-20 shrink-0 text-right text-[12px] tabular-nums text-muted sm:block">
          {meta}
        </span>
      </button>

      <div className="hidden shrink-0 items-center gap-0.5 pr-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 sm:flex">
        <button
          type="button"
          onClick={onRename}
          aria-label={`Rename ${node.name}`}
          className="grid size-7 place-items-center rounded-md text-muted transition-colors hover:bg-line hover:text-ink focus-ring"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${node.name}`}
          className="grid size-7 place-items-center rounded-md text-muted transition-colors hover:bg-danger-soft hover:text-danger focus-ring"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      <div ref={menuRef} className="relative shrink-0 pr-2 sm:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(open => !open)}
          aria-label={`Actions for ${node.name}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-line hover:text-ink focus-ring"
        >
          <MoreVertical className="size-4" aria-hidden="true" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-9 z-30 w-40 overflow-hidden rounded-lg border border-line bg-surface p-1 shadow-panel"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onRename();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] text-ink transition-colors hover:bg-elevated focus-ring"
            >
              <Pencil className="size-3.5 text-muted" aria-hidden="true" />
              Rename
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] text-danger transition-colors hover:bg-danger-soft focus-ring"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Delete
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

export const ItemRow = memo(ItemRowImpl);
