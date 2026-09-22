'use client';

import { ArrowLeft, Menu, Save } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { byteSize, formatBytes } from '@/lib/fsUtils';
import type { FsNode } from '@/types';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';

export interface FileEditorProps {
  file: FsNode;
  onBack: () => void;
  onOpenSidebar: () => void;
}

export function FileEditor({ file, onBack, onOpenSidebar }: FileEditorProps): ReactNode {
  const { saveFileContent, setDirty, registerSaveHandler } = useWorkspace();
  const { showToast } = useToast();

  const saved = file.content ?? '';
  const [draft, setDraft] = useState(saved);
  const isDirty = draft !== saved;

  const save = useCallback((): void => {
    saveFileContent(file.id, draft);
    setDirty(false);
    showToast('Saved');
  }, [file.id, draft, saveFileContent, setDirty, showToast]);

  useEffect(() => {
    setDirty(isDirty);
  }, [isDirty, setDirty]);

  useEffect(() => {
    registerSaveHandler(save);
    return () => registerSaveHandler(null);
  }, [registerSaveHandler, save]);

  useEffect(
    () => () => {
      setDirty(false);
    },
    [setDirty],
  );

  useEffect(() => {
    const handler = (event: globalThis.KeyboardEvent): void => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 's') return;
      event.preventDefault();
      if (isDirty) save();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isDirty, save]);

  useEffect(() => {
    if (!isDirty) return;

    const handler = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const lineCount = draft.length === 0 ? 1 : draft.split('\n').length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-ink focus-ring md:hidden"
        >
          <Menu className="size-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onBack}
          aria-label="Back to folder"
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-line-strong hover:text-ink focus-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[14px] font-semibold tracking-[-0.01em] text-ink">{file.name}</h1>
            {isDirty && (
              <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted">
                <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
                Unsaved
              </span>
            )}
          </div>
          <p className="truncate text-[11px] text-subtle">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'} · {formatBytes(byteSize(draft))}
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={save} disabled={!isDirty}>
          <Save className="size-3.5" aria-hidden="true" />
          Save
        </Button>
      </div>

      <div className="min-h-0 flex-1 bg-canvas p-3 sm:p-4">
        <textarea
          value={draft}
          onChange={event => setDraft(event.target.value)}
          spellCheck={false}
          aria-label={`Contents of ${file.name}`}
          placeholder="Start typing…"
          className="h-full w-full resize-none rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-[1.7] text-ink outline-none transition-colors placeholder:text-subtle focus:border-line-strong focus-ring"
        />
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-4 py-2 text-[11px] text-subtle sm:px-6">
        <span>Press {'⌘'}/Ctrl + S to save</span>
        <span>
          Last saved{' '}
          {new Date(file.updatedAt).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </span>
      </div>
    </div>
  );
}
