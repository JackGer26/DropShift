import React from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize    = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?:    ButtonSize;
  loading?: boolean;
}

// ─── Style maps ─────────────────────────────────────────────────────────────

const VARIANT: Record<ButtonVariant, string> = {
  primary:   'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-900',
  secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-400',
  ghost:     'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400',
  danger:    'bg-red-600 text-white hover:bg-red-500 focus:ring-red-600',
  success:   'bg-emerald-600 text-white hover:bg-emerald-500 focus:ring-emerald-600',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-8  text-sm  px-3 rounded-md',
  md: 'h-10 text-sm  px-4 rounded-md',
  lg: 'h-12 text-base px-6 rounded-md',
};

const BASE =
  'inline-flex items-center justify-center gap-2 font-medium transition-colors ' +
  'focus:outline-none focus:ring-2 focus:ring-offset-2 ' +
  'disabled:opacity-40 disabled:cursor-not-allowed';

// ─── Spinner ────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="animate-spin h-3.5 w-3.5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Button({
  variant  = 'secondary',
  size     = 'md',
  loading  = false,
  disabled,
  type     = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = [BASE, VARIANT[variant], SIZE[size], className].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
