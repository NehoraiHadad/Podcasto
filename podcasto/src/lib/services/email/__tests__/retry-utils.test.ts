/**
 * Tests for Retry Utilities
 * These tests demonstrate retry behavior and error classification
 */

import { describe, it, expect, vi } from 'vitest';
import { withRetry, isRetryableError, DEFAULT_RETRY_CONFIG, withRetryResult } from '../retry-utils';

describe('isRetryableError', () => {
  it('should identify retryable AWS throttling errors', () => {
    expect(isRetryableError(new Error('ThrottlingException: Rate exceeded'))).toBe(true);
    expect(isRetryableError(new Error('Request throttled'))).toBe(true);
    expect(isRetryableError(new Error('Too many requests'))).toBe(true);
  });

  it('should identify retryable network errors', () => {
    expect(isRetryableError(new Error('ECONNRESET'))).toBe(true);
    expect(isRetryableError(new Error('ENOTFOUND'))).toBe(true);
    expect(isRetryableError(new Error('Network timeout'))).toBe(true);
  });

  it('should identify retryable service errors', () => {
    expect(isRetryableError(new Error('Service unavailable'))).toBe(true);
    expect(isRetryableError(new Error('Temporarily unavailable'))).toBe(true);
  });

  it('should NOT identify non-retryable errors', () => {
    expect(isRetryableError(new Error('ValidationError: Invalid email'))).toBe(false);
    expect(isRetryableError(new Error('MessageRejected: Content rejected'))).toBe(false);
    expect(isRetryableError(new Error('Unknown error'))).toBe(false);
  });
});

describe('withRetry', () => {
  it('should succeed on first attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success');

    const result = await withRetry(operation);

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable errors', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('ThrottlingException'))
      .mockResolvedValueOnce('success');

    const result = await withRetry(operation, { ...DEFAULT_RETRY_CONFIG, baseDelayMs: 10 });

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should NOT retry on non-retryable errors', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('ValidationError: Invalid email'));

    await expect(
      withRetry(operation, { ...DEFAULT_RETRY_CONFIG, baseDelayMs: 10 })
    ).rejects.toThrow('ValidationError');

    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should throw after max attempts', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('ThrottlingException'));

    await expect(
      withRetry(operation, { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 100 })
    ).rejects.toThrow('ThrottlingException');

    expect(operation).toHaveBeenCalledTimes(3);
  });
});

describe('withRetryResult', () => {
  it('should return success result with data', async () => {
    const operation = vi.fn().mockResolvedValue('success');

    const result = await withRetryResult(operation);

    expect(result.success).toBe(true);
    expect(result.attempts).toBe(1);
    expect(result.data).toBe('success');
    expect(result.error).toBeUndefined();
  });

  it('should return failure result with error', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('ThrottlingException'));

    const result = await withRetryResult(operation, {
      maxAttempts: 3,
      baseDelayMs: 10,
      maxDelayMs: 100,
    });

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(3);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('ThrottlingException');
  });
});
