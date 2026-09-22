'use client';

import { FilePlus2, FolderPlus, Menu, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useWorkspace } from '@/context/WorkspaceContext';
import { ensureFileExtension, formatItemCount, splitExtension } from '@/lib/fsUtils';
import type { FsNode, NameValidation, NodeType, SearchResult } from '@/types';

import { Breadcrumb } from './Breadcrumb';
import { EmptyState } from './EmptyState';
import { FileEditor } from './FileEditor';
import { ItemRow } from './ItemRow';
import { SearchResults } from './SearchResults';
import { Toolbar } from './Toolbar';
import { Button } from './ui/Button';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { PromptDialog } from './ui/PromptDialog';
import { useToast } from './ui/Toast';

const SEARCH_DEBOUNCE_MS = 200;

export interface MainPanelProps {
  onOpenSidebar: () => void;
}

export function MainPanel({ onOpenSidebar }: MainPanelProps): ReactNode {
  const {
    state,
    childrenOf,
    pathOf,
    descendantCount,
    runSearch,
    validateChildName,
    createNode,
    renameNode,
    deleteNode,
    selectFolder,
    openFile,
    closeFile,
    revealNode,
    guard,
  } = useWorkspace();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [createType, setCreateType] = useState<NodeType | null>(null);
  const [renameTarget, setRenameTarget] = useState<FsNode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FsNode | null>(null);

  const [activeRow, setActiveRow] = useState<{
    folderId: string;
    nodeId: string;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const selectedFolderId = state.selectedFolderId;
  const currentFolder = state.nodes[selectedFolderId];
  const openedFile = state.openFileId === null ? undefined : state.nodes[state.openFileId];

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const isSearching = debouncedQuery.trim().length > 0;
  const results = useMemo(
    () => (isSearching ? runSearch(debouncedQuery) : []),
    [isSearching, debouncedQuery, runSearch],
  );

  const clearSearch = useCallback((): void => {
    setQuery('');
    setDebouncedQuery('');
    searchInputRef.current?.focus();
  }, []);

  const children = useMemo(() => childrenOf(selectedFolderId), [childrenOf, selectedFolderId]);
  const path = useMemo(() => pathOf(selectedFolderId), [pathOf, selectedFolderId]);

  const activeRowId = activeRow !== null && activeRow.folderId === selectedFolderId ? activeRow.nodeId : null;

  const navigateToFolder = useCallback(
    (id: string): void => {
      guard(() => {
        selectFolder(id);
        revealNode(id);
        closeFile();
        setQuery('');
        setDebouncedQuery('');
      });
    },
    [guard, selectFolder, revealNode, closeFile],
  );

  const openFileById = useCallback(
    (id: string): void => {
      guard(() => {
        const parentId = state.nodes[id]?.parentId;
        if (parentId !== undefined && parentId !== null) selectFolder(parentId);
        revealNode(id);
        openFile(id);
        setQuery('');
        setDebouncedQuery('');
      });
    },
    [guard, state.nodes, selectFolder, revealNode, openFile],
  );

  const handleSearchSelect = useCallback(
    (result: SearchResult): void => {
      if (result.node.type === 'folder') {
        navigateToFolder(result.node.id);
      } else {
        openFileById(result.node.id);
      }
    },
    [navigateToFolder, openFileById],
  );

  const validateNewName = useCallback(
    (value: string): NameValidation => {
      const trimmed = value.trim();

      if (trimmed.length === 0) return { valid: false, error: "Name can't be empty." };

      const candidate = createType === 'file' ? ensureFileExtension(trimmed) : trimmed;
      return validateChildName(selectedFolderId, candidate);
    },
    [createType, selectedFolderId, validateChildName],
  );

  const handleCreate = useCallback(
    (value: string): void => {
      if (createType === null) return;

      const name = createType === 'file' ? ensureFileExtension(value) : value;
      const id = createNode(selectedFolderId, name, createType);
      setCreateType(null);

      if (id !== null) {
        setActiveRow({ folderId: selectedFolderId, nodeId: id });
        showToast(`Created ${name}`);
      }
    },
    [createType, createNode, selectedFolderId, showToast],
  );

  const validateRenamedName = useCallback(
    (value: string): NameValidation => {
      if (renameTarget === null || renameTarget.parentId === null) {
        return { valid: false, error: null };
      }
      return validateChildName(renameTarget.parentId, value, renameTarget.id);
    },
    [renameTarget, validateChildName],
  );

  const handleRename = useCallback(
    (value: string): void => {
      if (renameTarget === null) return;

      if (value !== renameTarget.name) {
        renameNode(renameTarget.id, value);
        showToast(`Renamed to ${value}`);
      }
      setRenameTarget(null);
    },
    [renameTarget, renameNode, showToast],
  );

  const deleteDescription = useMemo((): string => {
    if (deleteTarget === null) return '';

    if (deleteTarget.type === 'file') {
      return `This will permanently delete "${deleteTarget.name}".`;
    }

    const inside = descendantCount(deleteTarget.id);
    if (inside === 0) {
      return `This will permanently delete the empty folder "${deleteTarget.name}".`;
    }
    return `This will permanently delete "${deleteTarget.name}" and ${inside} ${
      inside === 1 ? 'item' : 'items'
    } inside it.`;
  }, [deleteTarget, descendantCount]);

  const handleDelete = useCallback((): void => {
    if (deleteTarget === null) return;

    const target = deleteTarget;
    setDeleteTarget(null);

    const openFileId = state.openFileId;
    const hitsOpenFile = openFileId !== null && pathOf(openFileId).some(node => node.id === target.id);

    const run = (): void => {
      deleteNode(target.id);
      showToast(`Deleted ${target.name}`);
    };

    if (hitsOpenFile) {
      guard(run);
    } else {
      run();
    }
  }, [deleteTarget, state.openFileId, pathOf, deleteNode, showToast, guard]);

  if (openedFile !== undefined) {
    return (
      <FileEditor
        key={openedFile.id}
        file={openedFile}
        onOpenSidebar={onOpenSidebar}
        onBack={() => guard(() => closeFile())}
      />
    );
  }

  if (currentFolder === undefined) return null;

  const isRoot = currentFolder.id === state.rootId;
  const isWorkspaceEmpty = isRoot && children.length === 0;

  const renameStem =
    renameTarget === null
      ? ''
      : renameTarget.type === 'file'
        ? splitExtension(renameTarget.name)[0]
        : renameTarget.name;

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      onKeyDown={event => {
        if (event.key === 'Escape' && query.length > 0) {
          event.preventDefault();
          clearSearch();
        }
      }}
    >
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          className="-ml-1 grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-ink focus-ring md:hidden"
        >
          <Menu className="size-4" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <Breadcrumb path={path} onNavigate={navigateToFolder} />
        </div>

        <span className="hidden shrink-0 text-[12px] text-subtle sm:block">
          {formatItemCount(children.length)}
        </span>
      </div>

      <Toolbar
        query={query}
        onQueryChange={setQuery}
        onClearSearch={clearSearch}
        onNewFolder={() => setCreateType('folder')}
        onNewFile={() => setCreateType('file')}
        searchInputRef={searchInputRef}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isSearching ? (
          <SearchResults query={debouncedQuery} results={results} onSelect={handleSearchSelect} />
        ) : isWorkspaceEmpty ? (
          <EmptyState
            icon={Sparkles}
            title="Your workspace is empty"
            description="Nothing here yet. Create your first folder to organise things, or start a text file and write straight away."
            actions={
              <>
                <Button variant="primary" size="sm" onClick={() => setCreateType('folder')}>
                  <FolderPlus className="size-3.5" aria-hidden="true" />
                  New Folder
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setCreateType('file')}>
                  <FilePlus2 className="size-3.5" aria-hidden="true" />
                  New File
                </Button>
              </>
            }
          />
        ) : children.length === 0 ? (
          <EmptyState
            icon={FolderPlus}
            title="This folder is empty"
            description={`Add something to "${currentFolder.name}" to get started.`}
            actions={
              <>
                <Button variant="secondary" size="sm" onClick={() => setCreateType('folder')}>
                  <FolderPlus className="size-3.5" aria-hidden="true" />
                  New Folder
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setCreateType('file')}>
                  <FilePlus2 className="size-3.5" aria-hidden="true" />
                  New File
                </Button>
              </>
            }
          />
        ) : (
          <div className="px-2 py-2 sm:px-4">
            <div className="hidden items-center gap-3 px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-subtle sm:flex">
              <span className="flex-1">Name</span>
              <span className="w-28">Type</span>
              <span className="w-20 text-right">Size</span>
              <span className="w-17" aria-hidden="true" />
            </div>

            <ul className="flex flex-col gap-0.5">
              {children.map(child => (
                <ItemRow
                  key={child.id}
                  node={child}
                  childCount={child.type === 'folder' ? childrenOf(child.id).length : 0}
                  isActive={activeRowId === child.id}
                  onClick={() => {
                    setActiveRow({ folderId: selectedFolderId, nodeId: child.id });
                    if (child.type === 'file') openFileById(child.id);
                  }}
                  onOpen={() => navigateToFolder(child.id)}
                  onRename={() => setRenameTarget(child)}
                  onDelete={() => setDeleteTarget(child)}
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      <PromptDialog
        open={createType !== null}
        title={createType === 'folder' ? 'New folder' : 'New file'}
        description={
          createType === 'file'
            ? `Created in "${currentFolder.name}". Without an extension, .txt is added for you.`
            : `Created in "${currentFolder.name}".`
        }
        label="Name"
        placeholder={createType === 'folder' ? 'Designs' : 'notes.txt'}
        submitLabel="Create"
        validate={validateNewName}
        onSubmit={handleCreate}
        onCancel={() => setCreateType(null)}
      />

      <PromptDialog
        open={renameTarget !== null}
        title={renameTarget?.type === 'folder' ? 'Rename folder' : 'Rename file'}
        label="Name"
        submitLabel="Rename"
        initialValue={renameTarget?.name ?? ''}
        initialSelection={[0, renameStem.length]}
        validate={validateRenamedName}
        onSubmit={handleRename}
        onCancel={() => setRenameTarget(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget?.type === 'folder' ? 'Delete folder?' : 'Delete file?'}
        description={deleteDescription}
        confirmLabel="Delete"
        confirmTone="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
