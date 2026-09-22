import type { FsNode, NodeMap, NodeType, WorkspaceState } from '@/types';

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

export function makeNode(params: {
  id?: string;
  name: string;
  type: NodeType;
  parentId: string | null;
  content?: string;
  now?: number;
}): FsNode {
  const timestamp = params.now ?? Date.now();

  const node: FsNode = {
    id: params.id ?? createId(),
    name: params.name,
    type: params.type,
    parentId: params.parentId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (params.type === 'file') {
    node.content = params.content ?? '';
  }

  return node;
}

const README_CONTENT = `# Mini Workspace Explorer

Welcome to your workspace.
`;

const NOTES_CONTENT = `Webbly — working notes
======================

`;

/**
 *
 * Workspace
 * ├── Projects
 * │   ├── Webbly
 * │   │   ├── notes.txt
 * │   │   └── tasks.txt
 * │   └── Personal
 * ├── Documents
 * └── README.txt
 */
export function createSeedState(): WorkspaceState {
  const now = Date.now();
  const nodes: NodeMap = {};

  const add = (node: FsNode): FsNode => {
    nodes[node.id] = node;
    return node;
  };

  const root = add(makeNode({ name: 'Workspace', type: 'folder', parentId: null, now }));
  const projects = add(makeNode({ name: 'Projects', type: 'folder', parentId: root.id, now }));
  const webbly = add(makeNode({ name: 'Webbly', type: 'folder', parentId: projects.id, now }));

  add(makeNode({ name: 'Personal', type: 'folder', parentId: projects.id, now }));
  add(makeNode({ name: 'Documents', type: 'folder', parentId: root.id, now }));

  add(
    makeNode({
      name: 'notes.txt',
      type: 'file',
      parentId: webbly.id,
      content: NOTES_CONTENT,
      now,
    }),
  );
  add(
    makeNode({
      name: 'tasks.txt',
      type: 'file',
      parentId: webbly.id,
      content: '',
      now,
    }),
  );
  add(
    makeNode({
      name: 'README.txt',
      type: 'file',
      parentId: root.id,
      content: README_CONTENT,
      now,
    }),
  );

  return {
    nodes,
    rootId: root.id,
    selectedFolderId: root.id,
    openFileId: null,
    expandedIds: new Set<string>([root.id, projects.id]),
  };
}
