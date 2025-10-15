/**
 * Authentication Validation Schemas
 *
 * Comprehensive Zod validation schemas for all authentication operations.
 * Follows Zod v3 best practices with detailed error messages and type-safe
 * validation helpers.
 *
 * @module lib/auth/validation
 */

import { z } from 'zod';
import { ROLES, isValidRole, type Role } from './permissions';

// ============================================================================
// Base Validation Schemas
// ============================================================================

/**
 * Email validation schema
 *
 * - Valid email format (RFC 5322 compliant)
 * - Trimmed whitespace
 * - Case-insensitive (normalized to lowercase)
 * - Maximum 255 characters (database limit)
 */
export const emailSchema = z
  .string({
    required_error: 'Email is required',
    invalid_type_error: 'Email must be a string',
  })
  .trim()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase()
  .transform((email) => email.trim());

/**
 * Password validation schema
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (@$!%*?&#)
 */
export const passwordSchema = z
  .string({
    required_error: 'Password is required',
    invalid_type_error: 'Password must be a string',
  })
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be less than 128 characters')
  .refine(
    (password) => /[A-Z]/.test(password),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (password) => /[a-z]/.test(password),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (password) => /[0-9]/.test(password),
    'Password must contain at least one number'
  )
  .refine(
    (password) => /[@$!%*?&#]/.test(password),
    'Password must contain at least one special character (@$!%*?&#)'
  );

/**
 * User ID validation schema (UUID format)
 */
export const userIdSchema = z
  .string({
    required_error: 'User ID is required',
    invalid_type_error: 'User ID must be a string',
  })
  .uuid('User ID must be a valid UUID');

/**
 * Role validation schema
 *
 * Validates against defined roles in permissions system
 */
export const roleSchema = z
  .string({
    required_error: 'Role is required',
    invalid_type_error: 'Role must be a string',
  })
  .refine(
    (role): role is Role => isValidRole(role),
    (role) =>
      ({
        message: `Invalid role: ${role}. Must be one of: ${Object.values(ROLES).join(', ')}`,
      })
  );

// ============================================================================
// Authentication Operation Schemas
// ============================================================================

/**
 * Login validation schema
 *
 * Used for email/password authentication
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({
      required_error: 'Password is required',
      invalid_type_error: 'Password must be a string',
    })
    .min(1, 'Password is required'),
});

/**
 * Registration validation schema
 *
 * Validates new user signup with password confirmation
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string({
      required_error: 'Password confirmation is required',
      invalid_type_error: 'Password confirmation must be a string',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Password reset request schema
 *
 * Used for initiating password reset flow
 */
export const passwordResetSchema = z.object({
  email: emailSchema,
});

/**
 * Password update schema
 *
 * Used for changing password (requires current password verification)
 */
export const passwordUpdateSchema = z
  .object({
    currentPassword: z
      .string({
        required_error: 'Current password is required',
        invalid_type_error: 'Current password must be a string',
      })
      .min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string({
      required_error: 'Password confirmation is required',
      invalid_type_error: 'Password confirmation must be a string',
    }),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

/**
 * Role assignment validation schema
 *
 * Used for assigning roles to users (admin operation)
 */
export const roleAssignmentSchema = z.object({
  userId: userIdSchema,
  role: roleSchema,
});

// ============================================================================
// Inferred TypeScript Types
// ============================================================================

/**
 * Login input type inferred from loginSchema
 */
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Registration input type inferred from registerSchema
 */
export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Password reset input type inferred from passwordResetSchema
 */
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

/**
 * Password update input type inferred from passwordUpdateSchema
 */
export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>;

/**
 * Role assignment input type inferred from roleAssignmentSchema
 */
export type RoleAssignmentInput = z.infer<typeof roleAssignmentSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validation result type
 *
 * Standardized return type for all validation helper functions
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    issues?: Array<{ path: string[]; message: string }>;
  };
}

/**
 * Validate login credentials
 *
 * @param input - Login credentials to validate
 * @returns Validation result with parsed data or error details
 *
 * @example
 * ```typescript
 * const result = validateLogin({ email: 'user@example.com', password: 'Pass123!' });
 * if (result.success) {
 *   const { email, password } = result.data;
 *   // Proceed with authentication
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export function validateLogin(
  input: unknown
): ValidationResult<LoginInput> {
  const result = loginSchema.safeParse(input);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: {
      message: 'Invalid login credentials',
      issues: result.error.errors.map((err) => ({
        path: err.path.map(String),
        message: err.message,
      })),
    },
  };
}

/**
 * Validate registration data
 *
 * @param input - Registration data to validate
 * @returns Validation result with parsed data or error details
 *
 * @example
 * ```typescript
 * const result = validateRegistration({
 *   email: 'user@example.com',
 *   password: 'SecurePass123!',
 *   confirmPassword: 'SecurePass123!'
 * });
 * if (result.success) {
 *   const { email, password } = result.data;
 *   // Proceed with user creation
 * }
 * ```
 */
export function validateRegistration(
  input: unknown
): ValidationResult<RegisterInput> {
  const result = registerSchema.safeParse(input);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: {
      message: 'Invalid registration data',
      issues: result.error.errors.map((err) => ({
        path: err.path.map(String),
        message: err.message,
      })),
    },
  };
}

/**
 * Validate password reset request
 *
 * @param input - Password reset request data to validate
 * @returns Validation result with parsed data or error details
 *
 * @example
 * ```typescript
 * const result = validatePasswordReset({ email: 'user@example.com' });
 * if (result.success) {
 *   const { email } = result.data;
 *   // Send reset email
 * }
 * ```
 */
export function validatePasswordReset(
  input: unknown
): ValidationResult<PasswordResetInput> {
  const result = passwordResetSchema.safeParse(input);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: {
      message: 'Invalid password reset request',
      issues: result.error.errors.map((err) => ({
        path: err.path.map(String),
        message: err.message,
      })),
    },
  };
}

/**
 * Validate password update request
 *
 * @param input - Password update data to validate
 * @returns Validation result with parsed data or error details
 *
 * @example
 * ```typescript
 * const result = validatePasswordUpdate({
 *   currentPassword: 'OldPass123!',
 *   newPassword: 'NewPass456!',
 *   confirmNewPassword: 'NewPass456!'
 * });
 * if (result.success) {
 *   const { currentPassword, newPassword } = result.data;
 *   // Update password
 * }
 * ```
 */
export function validatePasswordUpdate(
  input: unknown
): ValidationResult<PasswordUpdateInput> {
  const result = passwordUpdateSchema.safeParse(input);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: {
      message: 'Invalid password update data',
      issues: result.error.errors.map((err) => ({
        path: err.path.map(String),
        message: err.message,
      })),
    },
  };
}

/**
 * Validate role assignment request
 *
 * @param input - Role assignment data to validate
 * @returns Validation result with parsed data or error details
 *
 * @example
 * ```typescript
 * const result = validateRoleAssignment({
 *   userId: '123e4567-e89b-12d3-a456-426614174000',
 *   role: 'admin'
 * });
 * if (result.success) {
 *   const { userId, role } = result.data;
 *   // Assign role to user
 * }
 * ```
 */
export function validateRoleAssignment(
  input: unknown
): ValidationResult<RoleAssignmentInput> {
  const result = roleAssignmentSchema.safeParse(input);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: {
      message: 'Invalid role assignment data',
      issues: result.error.errors.map((err) => ({
        path: err.path.map(String),
        message: err.message,
      })),
    },
  };
}

/**
 * Validate email format (standalone helper)
 *
 * @param email - Email address to validate
 * @returns Validation result with normalized email or error
 *
 * @example
 * ```typescript
 * const result = validateEmail(' User@Example.com ');
 * if (result.success) {
 *   console.log(result.data); // 'user@example.com'
 * }
 * ```
 */
export function validateEmail(email: unknown): ValidationResult<string> {
  const result = emailSchema.safeParse(email);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: {
      message: result.error.errors[0]?.message || 'Invalid email',
    },
  };
}

/**
 * Validate password strength (standalone helper)
 *
 * @param password - Password to validate
 * @returns Validation result with error details if invalid
 *
 * @example
 * ```typescript
 * const result = validatePassword('weak');
 * if (!result.success) {
 *   console.error(result.error.message);
 * }
 * ```
 */
export function validatePassword(password: unknown): ValidationResult<string> {
  const result = passwordSchema.safeParse(password);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: {
      message: 'Password does not meet security requirements',
      issues: result.error.errors.map((err) => ({
        path: [],
        message: err.message,
      })),
    },
  };
}

/**
 * Validate role name (standalone helper)
 *
 * @param role - Role name to validate
 * @returns Validation result with validated role or error
 *
 * @example
 * ```typescript
 * const result = validateRole('admin');
 * if (result.success) {
 *   console.log(result.data); // 'admin' (type: Role)
 * }
 * ```
 */
export function validateRole(role: unknown): ValidationResult<Role> {
  const result = roleSchema.safeParse(role);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: {
      message: result.error.errors[0]?.message || 'Invalid role',
    },
  };
}
