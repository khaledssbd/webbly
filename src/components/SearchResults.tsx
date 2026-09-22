'use client';

import { ChevronRight, FileText, Folder, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SearchResult } from '@/types';
import { EmptyState } from './EmptyState';

function highlight(name: string, query: string): ReactNode {
  const needle = query.trim();
  if (needle.length === 0) return name;

  const haystack = name.toLocaleLowerCase();
  const target = needle.toLocaleLowerCase();
  const parts: ReactNode[] = [];

  let cursor = 0;
  let index = haystack.indexOf(target);

  while (index !== -1) {
    if (index > cursor) parts.push(name.slice(cursor, index));
    parts.push(
      <mark key={`${index}-${cursor}`} className="rounded-[3px] bg-highlight px-0.5 text-ink">
        {name.slice(index, index + target.length)}
      </mark>,
    );
    cursor = index + target.length;
    index = haystack.indexOf(target, cursor);
  }

  if (cursor < name.length) parts.push(name.slice(cursor));
  return parts;
}

export interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  onSelect: (result: SearchResult) => void;
}

export function SearchResults({ query, results, onSelect }: SearchResultsProps): ReactNode {
  if (results.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={`No results for "${query.trim()}"`}
        description="Try a shorter word, or check the spelling. Search matches folder and file names anywhere in the workspace."
      />
    );
  }

  return (
    <div className="px-2 py-2 sm:px-4">
      <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wide text-subtle">
        {results.length} {results.length === 1 ? 'result' : 'results'}
      </p>

      <ul className="flex flex-col gap-0.5">
        {results.map(({ node, path }) => (
          <li key={node.id}>
            <button
              type="button"
              onClick={() => onSelect({ node, path })}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-elevated focus-ring"
            >
              {node.type === 'folder' ? (
                <Folder className="size-4.5 shrink-0 text-accent" aria-hidden="true" />
              ) : (
                <FileText className="size-4.5 shrink-0 text-subtle" aria-hidden="true" />
              )}

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-ink">
                  {highlight(node.name, query)}
                </span>
                <span className="mt-0.5 flex min-w-0 items-center gap-0.5 text-[11px] text-subtle">
                  {path.map((ancestor, index) => (
                    <span key={ancestor.id} className="flex min-w-0 items-center gap-0.5">
                      {index > 0 && <ChevronRight className="size-2.5 shrink-0" aria-hidden="true" />}
                      <span className="truncate">{ancestor.name}</span>
                    </span>
                  ))}
                </span>
              </span>

              <ChevronRight className="size-4 shrink-0 text-subtle" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
