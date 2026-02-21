import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** When true, renders a red border to signal validation failure */
  error?: boolean;
}

// State-independent base classes
const BASE =
  'w-full rounded-md border px-3 py-2 text-sm bg-white text-gray-800 ' +
  'placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 ' +
  'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500';

// State-dependent classes kept separate to avoid Tailwind class-order conflicts
const STATE = {
  default: 'border-gray-300 focus:ring-gray-900 focus:border-gray-900',
  error:   'border-red-500 focus:ring-red-500 focus:border-red-500',
};

export function Input({ error = false, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={error || undefined}
      className={[BASE, error ? STATE.error : STATE.default, className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}
