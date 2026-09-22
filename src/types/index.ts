export type NodeType = 'folder' | 'file';

export interface FsNode {
  id: string;
  name: string;
  type: NodeType;
  parentId: string | null;
  content?: string;
  createdAt: number;
  updatedAt: number;
}

export type NodeMap = Record<string, FsNode>;

export interface WorkspaceState {
  nodes: NodeMap;
  rootId: string;
  selectedFolderId: string;
  openFileId: string | null;
  expandedIds: Set<string>;
}

export interface SearchResult {
  node: FsNode;
  path: FsNode[];
}

export interface NameValidation {
  valid: boolean;
  error: string | null;
}

export type WorkspaceAction =
  | {
      type: 'CREATE_NODE';
      payload: {
        id: string;
        parentId: string;
        name: string;
        nodeType: NodeType;
        content?: string;
        now: number;
      };
    }
  | { type: 'RENAME_NODE'; payload: { id: string; name: string; now: number } }
  | { type: 'DELETE_NODE'; payload: { id: string } }
  | { type: 'UPDATE_FILE_CONTENT'; payload: { id: string; content: string; now: number } }
  | { type: 'SELECT_FOLDER'; payload: { id: string } }
  | { type: 'OPEN_FILE'; payload: { id: string } }
  | { type: 'CLOSE_FILE' }
  | { type: 'TOGGLE_EXPAND'; payload: { id: string } }
  | { type: 'EXPAND_ANCESTORS'; payload: { id: string } }
  | { type: 'HYDRATE'; payload: { state: WorkspaceState } }
  | { type: 'RESET_WORKSPACE'; payload: { state: WorkspaceState } };

export interface PersistedWorkspace {
  version: 1;
  nodes: NodeMap;
  rootId: string;
  selectedFolderId: string;
  openFileId: string | null;
  expandedIds: string[];
}
