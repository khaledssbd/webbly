'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, actions }: EmptyStateProps): ReactNode {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="grid size-11 place-items-center rounded-xl border border-line bg-surface text-subtle">
        <Icon className="size-5" aria-hidden="true" />
      </div>

      <p className="mt-4 text-[14px] font-medium text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>

      {actions !== undefined && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{actions}</div>
      )}
    </div>
  );
}
