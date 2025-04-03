'use client';

import { UseFormReturn } from 'react-hook-form';

interface FormDebugInfoProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>;
  isSubmitting?: boolean;
}

export function FormDebugInfo<T extends Record<string, unknown>>({ form, isSubmitting = false }: FormDebugInfoProps<T>) {
  return (
    <div className="bg-gray-100 p-4 rounded mb-4 overflow-auto max-h-96">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div>
        <p><strong>Form Valid:</strong> {form.formState.isValid ? 'Yes' : 'No'}</p>
        <p><strong>Form Dirty:</strong> {form.formState.isDirty ? 'Yes' : 'No'}</p>
        <p><strong>Form Submitting:</strong> {isSubmitting ? 'Yes' : 'No'}</p>
        <p><strong>Form Errors:</strong></p>
        <pre className="bg-gray-200 p-2 rounded text-xs">
          {JSON.stringify(form.formState.errors, null, 2)}
        </pre>
        <p><strong>Form Values:</strong></p>
        <pre className="bg-gray-200 p-2 rounded text-xs">
          {JSON.stringify(form.getValues(), null, 2)}
        </pre>
      </div>
    </div>
  );
} 