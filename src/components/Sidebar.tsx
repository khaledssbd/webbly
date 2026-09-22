'use client';

import { MoreHorizontal, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { flattenVisibleTree } from '@/lib/fsUtils';
import { TreeContext, TreeNode, type TreeContextValue } from './TreeNode';
import { ConfirmDialog } from './ui/ConfirmDialog';

export interface SidebarProps {
  onNavigate?: () => void;
  onClose?: () => void;
}

export function Sidebar({ onNavigate, onClose }: SidebarProps): ReactNode {
  const { state, selectFolder, openFile, closeFile, toggleExpand, guard, resetWorkspace } = useWorkspace();

  const [requestedFocusId, setFocusedId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const rowsRef = useRef(new Map<string, HTMLDivElement>());
  const menuRef = useRef<HTMLDivElement | null>(null);

  const registerRow = useCallback((id: string, element: HTMLDivElement | null): void => {
    if (element === null) {
      rowsRef.current.delete(id);
    } else {
      rowsRef.current.set(id, element);
    }
  }, []);

  const visibleRows = useMemo(
    () => flattenVisibleTree(state.nodes, state.rootId, state.expandedIds),
    [state.nodes, state.rootId, state.expandedIds],
  );

  const focusedId = useMemo((): string | null => {
    if (requestedFocusId !== null && visibleRows.some(row => row.node.id === requestedFocusId)) {
      return requestedFocusId;
    }

    return (
      visibleRows.find(row => row.node.id === state.selectedFolderId)?.node.id ??
      visibleRows[0]?.node.id ??
      null
    );
  }, [requestedFocusId, visibleRows, state.selectedFolderId]);

  const handleSelectFolder = useCallback(
    (id: string): void => {
      guard(() => {
        selectFolder(id);
        closeFile();
        onNavigate?.();
      });
    },
    [guard, selectFolder, closeFile, onNavigate],
  );

  const handleOpenFile = useCallback(
    (id: string): void => {
      guard(() => {
        const parentId = state.nodes[id]?.parentId;

        if (parentId !== undefined && parentId !== null) selectFolder(parentId);
        openFile(id);
        onNavigate?.();
      });
    },
    [guard, state.nodes, selectFolder, openFile, onNavigate],
  );

  const focusRow = useCallback((id: string): void => {
    setFocusedId(id);
    rowsRef.current.get(id)?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>): void => {
      if (focusedId === null) return;

      const index = visibleRows.findIndex(row => row.node.id === focusedId);
      if (index === -1) return;

      const current = visibleRows[index];
      if (current === undefined) return;

      const node = current.node;
      const isFolder = node.type === 'folder';
      const isExpanded = isFolder && state.expandedIds.has(node.id);

      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault();
          const next = visibleRows[index + 1];
          if (next !== undefined) focusRow(next.node.id);
          break;
        }
        case 'ArrowUp': {
          event.preventDefault();
          const previous = visibleRows[index - 1];
          if (previous !== undefined) focusRow(previous.node.id);
          break;
        }
        case 'ArrowRight': {
          event.preventDefault();
          if (!isFolder) break;
          if (!isExpanded) {
            toggleExpand(node.id);
          } else {
            const child = visibleRows[index + 1];
            if (child !== undefined && child.depth > current.depth) {
              focusRow(child.node.id);
            }
          }
          break;
        }
        case 'ArrowLeft': {
          event.preventDefault();
          if (isFolder && isExpanded) {
            toggleExpand(node.id);
          } else if (node.parentId !== null) {
            focusRow(node.parentId);
          }
          break;
        }
        case 'Home': {
          event.preventDefault();
          const first = visibleRows[0];
          if (first !== undefined) focusRow(first.node.id);
          break;
        }
        case 'End': {
          event.preventDefault();
          const last = visibleRows[visibleRows.length - 1];
          if (last !== undefined) focusRow(last.node.id);
          break;
        }
        case 'Enter':
        case ' ': {
          event.preventDefault();
          if (isFolder) {
            handleSelectFolder(node.id);
          } else {
            handleOpenFile(node.id);
          }
          break;
        }
        default:
          break;
      }
    },
    [focusedId, visibleRows, state.expandedIds, toggleExpand, focusRow, handleSelectFolder, handleOpenFile],
  );

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

  const treeContext = useMemo<TreeContextValue>(
    () => ({
      focusedId,
      setFocusedId,
      registerRow,
      onSelectFolder: handleSelectFolder,
      onOpenFile: handleOpenFile,
    }),
    [focusedId, registerRow, handleSelectFolder, handleOpenFile],
  );

  const totalItems = Object.keys(state.nodes).length - 1;

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold tracking-[-0.01em] text-ink">Mini Workspace</p>
          <p className="truncate text-[11px] text-subtle">
            {totalItems} {totalItems === 1 ? 'item' : 'items'} · saved locally
          </p>
        </div>

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen(open => !open)}
            aria-label="Workspace settings"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="grid size-7 place-items-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-ink focus-ring"
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-8 z-30 w-48 overflow-hidden rounded-lg border border-line bg-surface p-1 shadow-panel"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  guard(() => setResetOpen(true));
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] text-ink transition-colors hover:bg-elevated focus-ring"
              >
                <RotateCcw className="size-3.5 text-muted" aria-hidden="true" />
                Reset workspace
              </button>
            </div>
          )}
        </div>

        {onClose !== undefined && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="grid size-7 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-ink focus-ring md:hidden"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <TreeContext.Provider value={treeContext}>
        <div
          role="tree"
          aria-label="Workspace tree"
          onKeyDown={handleKeyDown}
          className="min-h-0 flex-1 overflow-y-auto px-2 py-2"
        >
          <TreeNode nodeId={state.rootId} depth={0} />
        </div>
      </TreeContext.Provider>

      <ConfirmDialog
        open={resetOpen}
        title="Reset workspace?"
        description="Every folder and file you created will be deleted and the starter workspace restored. This cannot be undone."
        confirmLabel="Reset"
        confirmTone="danger"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          setResetOpen(false);
          resetWorkspace();
        }}
      />
    </div>
  );
}
