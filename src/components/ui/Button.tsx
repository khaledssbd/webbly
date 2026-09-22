'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-on-accent shadow-sm hover:bg-accent-hover active:bg-accent-hover disabled:bg-accent/45',
  secondary: 'border border-line bg-surface text-ink hover:border-line-strong hover:bg-elevated',
  danger: 'bg-danger text-on-accent hover:bg-danger-hover disabled:bg-danger/45',
  ghost: 'text-muted hover:bg-elevated hover:text-ink',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-2.5 text-[13px]',
  md: 'h-9 gap-2 px-3.5 text-[13px]',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', className = '', type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors focus-ring disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    />
  );
});
