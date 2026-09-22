'use client';

import { ChevronRight, FileText, Folder, FolderOpen } from 'lucide-react';
import { createContext, memo, useContext, type MouseEvent, type ReactNode } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';

export interface TreeContextValue {
  focusedId: string | null;
  setFocusedId: (id: string) => void;
  registerRow: (id: string, element: HTMLDivElement | null) => void;
  onSelectFolder: (id: string) => void;
  onOpenFile: (id: string) => void;
}

export const TreeContext = createContext<TreeContextValue | null>(null);

function useTree(): TreeContextValue {
  const context = useContext(TreeContext);
  if (context === null) {
    throw new Error('<TreeNode> must be rendered inside a TreeContext provider.');
  }
  return context;
}

export interface TreeNodeProps {
  nodeId: string;
  depth: number;
}

function TreeNodeImpl({ nodeId, depth }: TreeNodeProps): ReactNode {
  const { state, childrenOf, toggleExpand } = useWorkspace();
  const { focusedId, setFocusedId, registerRow, onSelectFolder, onOpenFile } = useTree();

  const node = state.nodes[nodeId];
  if (node === undefined) return null;

  const isFolder = node.type === 'folder';
  const isExpanded = isFolder && state.expandedIds.has(nodeId);
  const children = isExpanded ? childrenOf(nodeId) : [];

  const isActive = isFolder
    ? state.selectedFolderId === nodeId && state.openFileId === null
    : state.openFileId === nodeId;

  const isContainingFolder = isFolder && state.selectedFolderId === nodeId && state.openFileId !== null;

  const handleActivate = (): void => {
    setFocusedId(nodeId);
    if (isFolder) {
      onSelectFolder(nodeId);
    } else {
      onOpenFile(nodeId);
    }
  };

  const handleChevron = (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    toggleExpand(nodeId);
  };

  return (
    <div
      ref={element => registerRow(nodeId, element)}
      role="treeitem"
      aria-expanded={isFolder ? isExpanded : undefined}
      aria-selected={isActive}
      aria-level={depth + 1}
      data-tree-id={nodeId}
      tabIndex={focusedId === nodeId ? 0 : -1}
      className="group/item block outline-none"
    >
      <div
        onClick={handleActivate}
        style={{ paddingLeft: `${6 + depth * 14}px` }}
        className={`flex h-7.5 cursor-pointer select-none items-center gap-1 rounded-md pr-2 text-[13px] transition-colors group-focus-visible/item:outline-2 group-focus-visible/item:-outline-offset-2 group-focus-visible/item:outline-accent ${
          isActive
            ? 'bg-accent-soft font-medium text-ink'
            : isContainingFolder
              ? 'bg-elevated font-medium text-ink'
              : 'text-muted hover:bg-elevated hover:text-ink'
        }`}
      >
        {isFolder ? (
          <button
            type="button"
            onClick={handleChevron}
            tabIndex={-1}
            aria-hidden="true"
            className="grid size-4.5 shrink-0 place-items-center rounded text-subtle transition-colors hover:bg-line hover:text-ink"
          >
            <ChevronRight
              className={`size-3.5 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
        ) : (
          <span className="size-4.5 shrink-0" aria-hidden="true" />
        )}

        {isFolder ? (
          isExpanded ? (
            <FolderOpen className="size-4 shrink-0 text-accent" aria-hidden="true" />
          ) : (
            <Folder className="size-4 shrink-0 text-accent" aria-hidden="true" />
          )
        ) : (
          <FileText className="size-4 shrink-0 text-subtle" aria-hidden="true" />
        )}

        <span className="truncate">{node.name}</span>
      </div>

      {isFolder && isExpanded && children.length > 0 && (
        <div role="group">
          {children.map(child => (
            <TreeNode key={child.id} nodeId={child.id} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export const TreeNode = memo(TreeNodeImpl);
