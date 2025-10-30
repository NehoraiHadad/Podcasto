'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActionResult } from './types';
import {
  runAuthAction as runAuthActionImpl,
  type RunAuthActionOptions,
} from './auth-runner';
import {
  revalidatePodcast as revalidatePodcastImpl,
  revalidateEpisode as revalidateEpisodeImpl,
  revalidateSubscriptions as revalidateSubscriptionsImpl,
  revalidateAdmin as revalidateAdminImpl,
  revalidateAll as revalidateAllImpl,
} from './revalidation';

export async function runAuthAction<TResult>(
  callback: (supabase: SupabaseClient) => Promise<TResult>,
  options: RunAuthActionOptions = {}
): Promise<ActionResult<TResult>> {
  return runAuthActionImpl(callback, options);
}

export async function revalidatePodcast(
  ...args: Parameters<typeof revalidatePodcastImpl>
) {
  return revalidatePodcastImpl(...args);
}

export async function revalidateEpisode(
  ...args: Parameters<typeof revalidateEpisodeImpl>
) {
  return revalidateEpisodeImpl(...args);
}

export async function revalidateSubscriptions(
  ...args: Parameters<typeof revalidateSubscriptionsImpl>
) {
  return revalidateSubscriptionsImpl(...args);
}

export async function revalidateAdmin(
  ...args: Parameters<typeof revalidateAdminImpl>
) {
  return revalidateAdminImpl(...args);
}

export async function revalidateAll(
  ...args: Parameters<typeof revalidateAllImpl>
) {
  return revalidateAllImpl(...args);
}
