'use client';

import { FieldErrors } from 'react-hook-form';

interface FormValidationErrorsProps<T extends Record<string, unknown>> {
  errors: FieldErrors<T>;
}

export function FormValidationErrors<T extends Record<string, unknown>>({ errors }: FormValidationErrorsProps<T>) {
  if (Object.keys(errors).length === 0) {
    return null;
  }
  
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Validation errors:</strong>
      <ul className="mt-2 list-disc list-inside">
        {Object.entries(errors).map(([field, error]) => (
          <li key={field}>
            {field}: {error?.message?.toString()}
          </li>
        ))}
      </ul>
    </div>
  );
} 