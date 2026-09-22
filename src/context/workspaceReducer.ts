import { getDescendantIds, nearestSurvivingAncestor, validateNameInParent } from '@/lib/fsUtils';
import type { FsNode, NodeMap, WorkspaceAction, WorkspaceState } from '@/types';

export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'CREATE_NODE': {
      const { id, parentId, name, nodeType, content, now } = action.payload;

      const parent = state.nodes[parentId];
      if (parent === undefined || parent.type !== 'folder') return state;

      if (!validateNameInParent(state.nodes, parentId, name).valid) return state;

      const node: FsNode = {
        id,
        name: name.trim(),
        type: nodeType,
        parentId,
        createdAt: now,
        updatedAt: now,
        ...(nodeType === 'file' ? { content: content ?? '' } : {}),
      };

      const expandedIds = new Set(state.expandedIds);
      expandedIds.add(parentId);

      return {
        ...state,
        nodes: { ...state.nodes, [id]: node },
        expandedIds,
      };
    }

    case 'RENAME_NODE': {
      const { id, name, now } = action.payload;

      const node = state.nodes[id];
      if (node === undefined) return state;
      if (node.parentId === null) return state;

      const trimmed = name.trim();
      if (trimmed === node.name) return state;

      if (!validateNameInParent(state.nodes, node.parentId, trimmed, id).valid) {
        return state;
      }

      return {
        ...state,
        nodes: {
          ...state.nodes,
          [id]: { ...node, name: trimmed, updatedAt: now },
        },
      };
    }

    case 'DELETE_NODE': {
      const { id } = action.payload;

      const node = state.nodes[id];
      if (node === undefined) return state;
      if (node.id === state.rootId) return state;

      const doomed = new Set<string>([id, ...getDescendantIds(state.nodes, id)]);

      const nodes: NodeMap = {};
      for (const [key, value] of Object.entries(state.nodes)) {
        if (!doomed.has(key)) nodes[key] = value;
      }

      const expandedIds = new Set<string>();
      for (const expandedId of state.expandedIds) {
        if (!doomed.has(expandedId)) expandedIds.add(expandedId);
      }

      const selectedFolderId = doomed.has(state.selectedFolderId)
        ? nearestSurvivingAncestor(nodes, node.parentId, state.rootId)
        : state.selectedFolderId;

      const openFileId = state.openFileId !== null && doomed.has(state.openFileId) ? null : state.openFileId;

      return { ...state, nodes, selectedFolderId, openFileId, expandedIds };
    }

    case 'UPDATE_FILE_CONTENT': {
      const { id, content, now } = action.payload;

      const node = state.nodes[id];
      if (node === undefined || node.type !== 'file') return state;
      if (node.content === content) return state;

      return {
        ...state,
        nodes: {
          ...state.nodes,
          [id]: { ...node, content, updatedAt: now },
        },
      };
    }

    case 'SELECT_FOLDER': {
      const { id } = action.payload;

      const node = state.nodes[id];
      if (node === undefined || node.type !== 'folder') return state;
      if (state.selectedFolderId === id) return state;

      return { ...state, selectedFolderId: id };
    }

    case 'OPEN_FILE': {
      const { id } = action.payload;

      const node = state.nodes[id];
      if (node === undefined || node.type !== 'file') return state;
      if (state.openFileId === id) return state;

      return { ...state, openFileId: id };
    }

    case 'CLOSE_FILE': {
      if (state.openFileId === null) return state;
      return { ...state, openFileId: null };
    }

    case 'TOGGLE_EXPAND': {
      const { id } = action.payload;

      const node = state.nodes[id];
      if (node === undefined || node.type !== 'folder') return state;

      const expandedIds = new Set(state.expandedIds);
      if (expandedIds.has(id)) {
        expandedIds.delete(id);
      } else {
        expandedIds.add(id);
      }

      return { ...state, expandedIds };
    }

    case 'EXPAND_ANCESTORS': {
      const { id } = action.payload;

      const expandedIds = new Set(state.expandedIds);
      let cursor = state.nodes[id]?.parentId ?? null;
      const seen = new Set<string>();

      while (cursor !== null && !seen.has(cursor)) {
        seen.add(cursor);
        expandedIds.add(cursor);
        cursor = state.nodes[cursor]?.parentId ?? null;
      }

      if (expandedIds.size === state.expandedIds.size) return state;
      return { ...state, expandedIds };
    }

    case 'HYDRATE':
    case 'RESET_WORKSPACE':
      return action.payload.state;

    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}
