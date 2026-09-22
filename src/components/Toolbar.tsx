'use client';

import { FilePlus2, FolderPlus, Search, X } from 'lucide-react';
import type { ReactNode, RefObject } from 'react';
import { Button } from './ui/Button';

export interface ToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onClearSearch: () => void;
  onNewFolder: () => void;
  onNewFile: () => void;
  searchInputRef?: RefObject<HTMLInputElement | null>;
}

export function Toolbar({
  query,
  onQueryChange,
  onClearSearch,
  onNewFolder,
  onNewFile,
  searchInputRef,
}: ToolbarProps): ReactNode {
  return (
    <div className="flex flex-col gap-2 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6">
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onNewFolder}>
          <FolderPlus className="size-3.5" aria-hidden="true" />
          New Folder
        </Button>
        <Button variant="secondary" size="sm" onClick={onNewFile}>
          <FilePlus2 className="size-3.5" aria-hidden="true" />
          New File
        </Button>
      </div>

      <div className="relative min-w-0 flex-1 sm:max-w-sm sm:ml-auto">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle"
          aria-hidden="true"
        />
        <input
          ref={searchInputRef}
          type="search"
          value={query}
          onChange={event => onQueryChange(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              event.preventDefault();
              onClearSearch();
            }
          }}
          placeholder="Search this workspace"
          aria-label="Search the workspace"
          autoComplete="off"
          spellCheck={false}
          className="h-8 w-full rounded-lg border border-line bg-canvas pl-8 pr-8 text-[13px] text-ink outline-none transition-colors placeholder:text-subtle focus:border-line-strong focus-ring [&::-webkit-search-cancel-button]:appearance-none"
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={onClearSearch}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-subtle transition-colors hover:bg-elevated hover:text-ink focus-ring"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
