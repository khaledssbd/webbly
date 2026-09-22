'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  buildChildrenIndex,
  getDescendantIds,
  getPath,
  search as searchNodes,
  sortNodes,
  validateNameInParent,
} from '@/lib/fsUtils';
import { createId, createSeedState } from '@/lib/seed';
import { clearWorkspace, loadWorkspace, saveWorkspace } from '@/lib/storage';
import type { FsNode, NameValidation, NodeType, SearchResult, WorkspaceState } from '@/types';

import { workspaceReducer } from './workspaceReducer';

const PERSIST_DEBOUNCE_MS = 300;

const EMPTY_STATE: WorkspaceState = {
  nodes: {},
  rootId: '',
  selectedFolderId: '',
  openFileId: null,
  expandedIds: new Set<string>(),
};

export interface WorkspaceContextValue {
  state: WorkspaceState;
  isHydrated: boolean;

  childrenOf: (parentId: string) => FsNode[];
  pathOf: (id: string) => FsNode[];
  descendantCount: (id: string) => number;
  runSearch: (query: string) => SearchResult[];
  validateChildName: (parentId: string, name: string, ignoreId?: string) => NameValidation;

  createNode: (parentId: string, name: string, type: NodeType) => string | null;
  renameNode: (id: string, name: string) => void;
  deleteNode: (id: string) => void;
  saveFileContent: (id: string, content: string) => void;
  selectFolder: (id: string) => void;
  openFile: (id: string) => void;
  closeFile: () => void;
  toggleExpand: (id: string) => void;
  revealNode: (id: string) => void;
  resetWorkspace: () => void;

  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  registerSaveHandler: (handler: (() => void) | null) => void;
  guard: (action: () => void) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const NO_CHILDREN: readonly FsNode[] = [];

export function WorkspaceProvider({ children }: { children: ReactNode }): ReactNode {
  const [state, dispatch] = useReducer(workspaceReducer, EMPTY_STATE);

  const isHydrated = state.rootId !== '';

  useEffect(() => {
    const restored = loadWorkspace() ?? createSeedState();
    dispatch({ type: 'HYDRATE', payload: { state: restored } });
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const timer = window.setTimeout(() => {
      saveWorkspace(state);
    }, PERSIST_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [state, isHydrated]);

  const sortedChildren = useMemo(() => {
    const table = new Map<string, FsNode[]>();
    for (const [parentId, list] of buildChildrenIndex(state.nodes)) {
      table.set(parentId, sortNodes(list));
    }
    return table;
  }, [state.nodes]);

  const childrenOf = useCallback(
    (parentId: string): FsNode[] => sortedChildren.get(parentId) ?? (NO_CHILDREN as FsNode[]),
    [sortedChildren],
  );

  const pathOf = useCallback((id: string): FsNode[] => getPath(state.nodes, id), [state.nodes]);

  const descendantCount = useCallback(
    (id: string): number => getDescendantIds(state.nodes, id).length,
    [state.nodes],
  );

  const runSearch = useCallback(
    (query: string): SearchResult[] => searchNodes(state.nodes, query),
    [state.nodes],
  );

  const validateChildName = useCallback(
    (parentId: string, name: string, ignoreId?: string): NameValidation =>
      validateNameInParent(state.nodes, parentId, name, ignoreId),
    [state.nodes],
  );

  const [isDirty, setIsDirtyState] = useState(false);
  const [guardOpen, setGuardOpen] = useState(false);

  const dirtyRef = useRef(false);
  const saveHandlerRef = useRef<(() => void) | null>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const setDirty = useCallback((dirty: boolean): void => {
    dirtyRef.current = dirty;
    setIsDirtyState(dirty);
  }, []);

  const registerSaveHandler = useCallback((handler: (() => void) | null): void => {
    saveHandlerRef.current = handler;
  }, []);

  const guard = useCallback((action: () => void): void => {
    if (!dirtyRef.current) {
      action();
      return;
    }
    pendingActionRef.current = action;
    setGuardOpen(true);
  }, []);

  const runPending = useCallback((): void => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    setGuardOpen(false);
    action?.();
  }, []);

  const handleGuardCancel = useCallback((): void => {
    pendingActionRef.current = null;
    setGuardOpen(false);
  }, []);

  const handleGuardDiscard = useCallback((): void => {
    setDirty(false);
    runPending();
  }, [runPending, setDirty]);

  const handleGuardSave = useCallback((): void => {
    saveHandlerRef.current?.();
    setDirty(false);
    runPending();
  }, [runPending, setDirty]);

  const createNode = useCallback(
    (parentId: string, name: string, type: NodeType): string | null => {
      if (!validateNameInParent(state.nodes, parentId, name).valid) return null;

      const id = createId();
      dispatch({
        type: 'CREATE_NODE',
        payload: { id, parentId, name, nodeType: type, now: Date.now() },
      });
      return id;
    },
    [state.nodes],
  );

  const renameNode = useCallback((id: string, name: string): void => {
    dispatch({ type: 'RENAME_NODE', payload: { id, name, now: Date.now() } });
  }, []);

  const deleteNode = useCallback((id: string): void => {
    dispatch({ type: 'DELETE_NODE', payload: { id } });
  }, []);

  const saveFileContent = useCallback((id: string, content: string): void => {
    dispatch({
      type: 'UPDATE_FILE_CONTENT',
      payload: { id, content, now: Date.now() },
    });
  }, []);

  const selectFolder = useCallback((id: string): void => {
    dispatch({ type: 'SELECT_FOLDER', payload: { id } });
  }, []);

  const openFile = useCallback((id: string): void => {
    dispatch({ type: 'OPEN_FILE', payload: { id } });
  }, []);

  const closeFile = useCallback((): void => {
    dispatch({ type: 'CLOSE_FILE' });
  }, []);

  const toggleExpand = useCallback((id: string): void => {
    dispatch({ type: 'TOGGLE_EXPAND', payload: { id } });
  }, []);

  const revealNode = useCallback((id: string): void => {
    dispatch({ type: 'EXPAND_ANCESTORS', payload: { id } });
  }, []);

  const resetWorkspace = useCallback((): void => {
    clearWorkspace();
    setDirty(false);
    dispatch({ type: 'RESET_WORKSPACE', payload: { state: createSeedState() } });
  }, [setDirty]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      state,
      isHydrated,
      childrenOf,
      pathOf,
      descendantCount,
      runSearch,
      validateChildName,
      createNode,
      renameNode,
      deleteNode,
      saveFileContent,
      selectFolder,
      openFile,
      closeFile,
      toggleExpand,
      revealNode,
      resetWorkspace,
      isDirty,
      setDirty,
      registerSaveHandler,
      guard,
    }),
    [
      state,
      isHydrated,
      childrenOf,
      pathOf,
      descendantCount,
      runSearch,
      validateChildName,
      createNode,
      renameNode,
      deleteNode,
      saveFileContent,
      selectFolder,
      openFile,
      closeFile,
      toggleExpand,
      revealNode,
      resetWorkspace,
      isDirty,
      setDirty,
      registerSaveHandler,
      guard,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={guardOpen}
        title="Discard unsaved changes?"
        description="You have edits that haven't been saved yet. What would you like to do?"
        cancelLabel="Cancel"
        confirmLabel="Discard"
        confirmTone="danger"
        secondaryLabel="Save & Continue"
        onCancel={handleGuardCancel}
        onConfirm={handleGuardDiscard}
        onSecondary={handleGuardSave}
      />
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (context === null) {
    throw new Error('useWorkspace must be used inside a <WorkspaceProvider>.');
  }
  return context;
}
