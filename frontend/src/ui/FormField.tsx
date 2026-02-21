import React from 'react';

interface FormFieldProps {
  label:        string;
  htmlFor:      string;
  description?: string;
  error?:       string;
  children:     React.ReactNode;
  className?:   string;
}

export function FormField({
  label,
  htmlFor,
  description,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={['flex flex-col space-y-1', className].filter(Boolean).join(' ')}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-gray-700"
      >
        {label}
      </label>

      {children}

      {/* Fixed-height slot prevents layout shift when error appears */}
      <div className="min-h-[1.25rem]">
        {error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : description ? (
          <p className="text-xs text-gray-500">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
