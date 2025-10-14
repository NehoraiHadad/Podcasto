import { FieldValues } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { BaseFieldProps } from './types';

interface FormTextFieldProps<TFieldValues extends FieldValues>
  extends BaseFieldProps<TFieldValues> {
  type?: 'text' | 'email' | 'url' | 'tel' | 'password';
  maxLength?: number;
  minLength?: number;
}

export function FormTextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  disabled = false,
  required = false,
  className,
  type = 'text',
  maxLength,
  minLength,
}: FormTextFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              type={type}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={maxLength}
              minLength={minLength}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
