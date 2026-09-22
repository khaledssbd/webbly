'use client';

import type { ReactNode } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmTone?: 'primary' | 'danger';
  secondaryLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onSecondary?: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  confirmTone = 'primary',
  secondaryLabel,
  onConfirm,
  onCancel,
  onSecondary,
}: ConfirmDialogProps): ReactNode {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
      hideCloseButton
      closeOnBackdropClick={false}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={confirmTone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          {secondaryLabel !== undefined && onSecondary !== undefined && (
            <Button variant="primary" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
        </>
      }
    />
  );
}
