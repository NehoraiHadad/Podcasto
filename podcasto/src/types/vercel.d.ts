declare module '@vercel/functions' {
  /**
   * Enqueues a task to be executed after response has been sent to the client.
   * The function can run for extended periods but will eventually time out
   * based on your Vercel plan limitations.
   */
  export function waitUntil(promise: Promise<unknown> | (() => Promise<unknown>)): void;
} 