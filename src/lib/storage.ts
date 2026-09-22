import type { FsNode, NodeMap, PersistedWorkspace, WorkspaceState } from '@/types';

export const STORAGE_KEY = 'mini-workspace:v1';
export const STORAGE_VERSION = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFsNode(value: unknown): value is FsNode {
  if (!isRecord(value)) return false;

  const { id, name, type, parentId, content, createdAt, updatedAt } = value;

  if (typeof id !== 'string' || id.length === 0) return false;
  if (typeof name !== 'string') return false;
  if (type !== 'folder' && type !== 'file') return false;
  if (parentId !== null && typeof parentId !== 'string') return false;
  if (content !== undefined && typeof content !== 'string') return false;
  if (typeof createdAt !== 'number' || typeof updatedAt !== 'number') return false;

  return true;
}

export function parseWorkspace(raw: string | null): WorkspaceState | null {
  if (raw === null || raw.length === 0) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) return null;
  if (parsed.version !== STORAGE_VERSION) return null;

  const { nodes, rootId, selectedFolderId, openFileId, expandedIds } = parsed;

  if (!isRecord(nodes)) return null;
  if (typeof rootId !== 'string') return null;

  const validated: NodeMap = {};
  for (const [key, candidate] of Object.entries(nodes)) {
    if (!isFsNode(candidate)) return null;
    if (candidate.id !== key) return null;
    validated[key] = candidate;
  }

  const root = validated[rootId];
  if (root === undefined || root.type !== 'folder' || root.parentId !== null) {
    return null;
  }

  for (const node of Object.values(validated)) {
    if (node.id === rootId) continue;
    if (node.parentId === null) return null;
    if (validated[node.parentId] === undefined) return null;
  }

  const selected =
    typeof selectedFolderId === 'string' && validated[selectedFolderId]?.type === 'folder'
      ? selectedFolderId
      : rootId;

  const open = typeof openFileId === 'string' && validated[openFileId]?.type === 'file' ? openFileId : null;

  const expanded = new Set<string>(
    Array.isArray(expandedIds)
      ? expandedIds.filter((id): id is string => typeof id === 'string' && validated[id]?.type === 'folder')
      : [],
  );
  expanded.add(rootId);

  return {
    nodes: validated,
    rootId,
    selectedFolderId: selected,
    openFileId: open,
    expandedIds: expanded,
  };
}

export function serializeWorkspace(state: WorkspaceState): string {
  const payload: PersistedWorkspace = {
    version: STORAGE_VERSION,
    nodes: state.nodes,
    rootId: state.rootId,
    selectedFolderId: state.selectedFolderId,
    openFileId: state.openFileId,
    expandedIds: [...state.expandedIds],
  };

  return JSON.stringify(payload);
}

export function loadWorkspace(): WorkspaceState | null {
  if (typeof window === 'undefined') return null;

  try {
    return parseWorkspace(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveWorkspace(state: WorkspaceState): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, serializeWorkspace(state));
  } catch {}
}

export function clearWorkspace(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
