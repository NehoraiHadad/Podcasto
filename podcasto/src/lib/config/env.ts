import { z } from 'zod';

const supabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({ required_error: 'NEXT_PUBLIC_SUPABASE_URL is required' })
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string({ required_error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required' })
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY cannot be empty')
    .optional(),
});

type SupabaseEnv = z.infer<typeof supabaseEnvSchema>;

let cachedSupabaseEnv: SupabaseEnv | null = null;

export function getSupabaseEnv(): SupabaseEnv {
  if (cachedSupabaseEnv) {
    return cachedSupabaseEnv;
  }

  const parsed = supabaseEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.SUPABASE_SERVICE_ROLE ??
      process.env.SUPABASE_SERVICE_ROLE_SECRET,
  });

  if (!parsed.success) {
    const errorDetails = parsed.error.errors
      .map((error) => `${error.path.join('.') || 'value'}: ${error.message}`)
      .join('; ');

    throw new Error(
      `Missing or invalid Supabase environment configuration: ${errorDetails}`
    );
  }

  cachedSupabaseEnv = parsed.data;
  return cachedSupabaseEnv;
}

export function clearSupabaseEnvCache() {
  cachedSupabaseEnv = null;
}
