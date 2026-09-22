import type { FsNode, NameValidation, NodeMap, NodeType, SearchResult } from '@/types';

const ILLEGAL_NAME_CHARS = /[/\\:*?"<>|]/;
const MAX_NAME_LENGTH = 255;

export function getNode(nodes: NodeMap, id: string | null): FsNode | undefined {
  return id === null ? undefined : nodes[id];
}

export function getPath(nodes: NodeMap, id: string): FsNode[] {
  const chain: FsNode[] = [];
  const seen = new Set<string>();
  let current: FsNode | undefined = nodes[id];

  while (current !== undefined && !seen.has(current.id)) {
    seen.add(current.id);
    chain.push(current);
    current = current.parentId === null ? undefined : nodes[current.parentId];
  }

  return chain.reverse();
}

export function getAncestors(nodes: NodeMap, id: string): FsNode[] {
  return getPath(nodes, id).slice(0, -1);
}

export function buildChildrenIndex(nodes: NodeMap): Map<string, FsNode[]> {
  const index = new Map<string, FsNode[]>();

  for (const node of Object.values(nodes)) {
    if (node.parentId === null) continue;
    const bucket = index.get(node.parentId);
    if (bucket === undefined) {
      index.set(node.parentId, [node]);
    } else {
      bucket.push(node);
    }
  }

  return index;
}

export function getDescendantIds(nodes: NodeMap, id: string): string[] {
  const index = buildChildrenIndex(nodes);
  const out: string[] = [];
  const stack: string[] = [id];
  const visited = new Set<string>([id]);

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (currentId === undefined) break;

    for (const child of index.get(currentId) ?? []) {
      if (visited.has(child.id)) continue;
      visited.add(child.id);
      out.push(child.id);
      stack.push(child.id);
    }
  }

  return out;
}

export function sortNodes(list: readonly FsNode[]): FsNode[] {
  return [...list].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, {
      sensitivity: 'base',
      numeric: true,
    });
  });
}

export function childrenOf(nodes: NodeMap, parentId: string): FsNode[] {
  return sortNodes(buildChildrenIndex(nodes).get(parentId) ?? []);
}

export function isNameTaken(nodes: NodeMap, parentId: string, name: string, ignoreId?: string): boolean {
  const candidate = name.trim().toLocaleLowerCase();

  return Object.values(nodes).some(
    node =>
      node.parentId === parentId &&
      node.id !== ignoreId &&
      node.name.trim().toLocaleLowerCase() === candidate,
  );
}

export function validateName(name: string): NameValidation {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: "Name can't be empty." };
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return {
      valid: false,
      error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.`,
    };
  }
  if (ILLEGAL_NAME_CHARS.test(trimmed)) {
    return { valid: false, error: 'A name cannot contain / \\ : * ? " < > |' };
  }
  if (trimmed === '.' || trimmed === '..') {
    return { valid: false, error: 'That name is reserved.' };
  }

  return { valid: true, error: null };
}

export function validateNameInParent(
  nodes: NodeMap,
  parentId: string,
  name: string,
  ignoreId?: string,
): NameValidation {
  const shape = validateName(name);
  if (!shape.valid) return shape;

  if (isNameTaken(nodes, parentId, name, ignoreId)) {
    return {
      valid: false,
      error: `"${name.trim()}" already exists in this folder.`,
    };
  }

  return { valid: true, error: null };
}

export function search(nodes: NodeMap, query: string): SearchResult[] {
  const needle = query.trim().toLocaleLowerCase();
  if (needle.length === 0) return [];

  const hits: SearchResult[] = [];

  for (const node of Object.values(nodes)) {
    if (node.parentId === null) continue;
    if (!node.name.toLocaleLowerCase().includes(needle)) continue;
    hits.push({ node, path: getAncestors(nodes, node.id) });
  }

  return hits.sort((a, b) => {
    if (a.node.type !== b.node.type) return a.node.type === 'folder' ? -1 : 1;
    return a.node.name.localeCompare(b.node.name, undefined, {
      sensitivity: 'base',
      numeric: true,
    });
  });
}

export function nearestSurvivingAncestor(nodes: NodeMap, id: string | null, rootId: string): string {
  const seen = new Set<string>();
  let cursor = id;

  while (cursor !== null && !seen.has(cursor)) {
    seen.add(cursor);
    const node = nodes[cursor];

    if (node === undefined) break;
    if (node.type === 'folder') return node.id;
    cursor = node.parentId;
  }

  return rootId;
}

export function ensureFileExtension(name: string): string {
  const trimmed = name.trim();
  const lastDot = trimmed.lastIndexOf('.');
  const hasExtension = lastDot > 0 && lastDot < trimmed.length - 1;
  return hasExtension ? trimmed : `${trimmed}.txt`;
}

export function splitExtension(name: string): [stem: string, extension: string] {
  const lastDot = name.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === name.length - 1) return [name, ''];
  return [name.slice(0, lastDot), name.slice(lastDot)];
}

export function byteSize(content: string | undefined): number {
  if (content === undefined || content.length === 0) return 0;
  return new TextEncoder().encode(content).length;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatItemCount(count: number): string {
  if (count === 0) return 'Empty';
  return count === 1 ? '1 item' : `${count} items`;
}

export function describeNodeType(type: NodeType): string {
  return type === 'folder' ? 'Folder' : 'Text file';
}

export interface TreeRow {
  node: FsNode;
  depth: number;
}

export function flattenVisibleTree(
  nodes: NodeMap,
  rootId: string,
  expandedIds: ReadonlySet<string>,
): TreeRow[] {
  const root = nodes[rootId];
  if (root === undefined) return [];

  const index = buildChildrenIndex(nodes);
  const rows: TreeRow[] = [];

  const walk = (node: FsNode, depth: number): void => {
    rows.push({ node, depth });
    if (node.type !== 'folder' || !expandedIds.has(node.id)) return;
    for (const child of sortNodes(index.get(node.id) ?? [])) {
      walk(child, depth + 1);
    }
  };

  walk(root, 0);
  return rows;
}
