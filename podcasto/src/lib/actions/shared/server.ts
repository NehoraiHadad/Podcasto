'use server';

import { runAuthAction as runAuthActionImpl } from './auth-runner';
import {
  revalidatePodcast as revalidatePodcastImpl,
  revalidateEpisode as revalidateEpisodeImpl,
  revalidateSubscriptions as revalidateSubscriptionsImpl,
  revalidateAdmin as revalidateAdminImpl,
  revalidateAll as revalidateAllImpl,
} from './revalidation';

const wrapServerFunction = <Fn extends (...args: unknown[]) => Promise<unknown>>(
  fn: Fn
): Fn =>
  (async (
    ...args: Parameters<Fn>
  ): Promise<Awaited<ReturnType<Fn>>> => fn(...args)) as Fn;

export const runAuthAction = wrapServerFunction(runAuthActionImpl);
export const revalidatePodcast = wrapServerFunction(revalidatePodcastImpl);
export const revalidateEpisode = wrapServerFunction(revalidateEpisodeImpl);
export const revalidateSubscriptions = wrapServerFunction(
  revalidateSubscriptionsImpl
);
export const revalidateAdmin = wrapServerFunction(revalidateAdminImpl);
export const revalidateAll = wrapServerFunction(revalidateAllImpl);
