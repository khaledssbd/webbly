'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode, type SubmitEvent } from 'react';
import type { NameValidation } from '@/types';
import { Button } from './Button';
import { Modal } from './Modal';

export interface PromptDialogProps {
  open: boolean;
  title: string;
  description?: string;
  label: string;
  submitLabel: string;
  initialValue?: string;
  placeholder?: string;
  initialSelection?: [start: number, end: number];
  validate: (value: string) => NameValidation;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export function PromptDialog(props: PromptDialogProps): ReactNode {
  if (!props.open) return null;
  return <PromptDialogBody key={props.initialValue ?? ''} {...props} />;
}

function PromptDialogBody({
  title,
  description,
  label,
  submitLabel,
  initialValue = '',
  placeholder,
  initialSelection,
  validate,
  onSubmit,
  onCancel,
}: PromptDialogProps): ReactNode {
  const [value, setValue] = useState(initialValue);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const errorId = useId();

  const selectionStart = initialSelection?.[0];
  const selectionEnd = initialSelection?.[1];

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const input = inputRef.current;
      if (input === null) return;

      input.focus();
      if (selectionStart !== undefined && selectionEnd !== undefined) {
        input.setSelectionRange(selectionStart, selectionEnd);
      } else {
        input.select();
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [selectionStart, selectionEnd]);

  const validation = validate(value);
  const canSubmit = validation.valid;
  const showError = touched && !validation.valid && value.trim().length > 0;

  const handleSubmit = useCallback(
    (event: SubmitEvent<HTMLFormElement>): void => {
      event.preventDefault();
      if (!canSubmit) {
        setTouched(true);
        return;
      }
      onSubmit(value.trim());
    },
    [canSubmit, onSubmit, value],
  );

  return (
    <Modal open title={title} description={description} onClose={onCancel}>
      <form onSubmit={handleSubmit}>
        <label htmlFor={`${errorId}-input`} className="block text-[12px] font-medium text-muted">
          {label}
        </label>

        <input
          id={`${errorId}-input`}
          ref={inputRef}
          value={value}
          onChange={event => {
            setValue(event.target.value);
            setTouched(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={showError}
          aria-describedby={showError ? errorId : undefined}
          className={`mt-1.5 h-9 w-full rounded-lg border bg-canvas px-3 text-[13px] text-ink outline-none transition-colors placeholder:text-subtle focus-ring ${
            showError ? 'border-danger' : 'border-line focus:border-line-strong'
          }`}
        />

        <p
          id={errorId}
          role="alert"
          className={`mt-1.5 min-h-4 text-[12px] leading-4 ${showError ? 'text-danger' : 'text-transparent'}`}
        >
          {showError ? validation.error : 'placeholder'}
        </p>

        <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!canSubmit}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
