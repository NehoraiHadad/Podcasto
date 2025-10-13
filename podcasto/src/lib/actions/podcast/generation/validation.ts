/**
 * Validation utilities for podcast generation operations.
 * Handles environment checks and date range validation.
 */

import { ActionResponse } from '../schemas';
import type { DateRange } from './types';

/**
 * Checks that all required environment variables are set for podcast generation.
 * Validates Lambda function name and SQS queue URL configuration.
 *
 * @returns ActionResponse indicating success or configuration error
 */
export function checkEnvironmentConfiguration(): ActionResponse {
  // Get the Lambda function name from environment variables
  const telegramLambdaName = process.env.TELEGRAM_LAMBDA_NAME;
  const sqsQueueUrl = process.env.SQS_QUEUE_URL;

  console.log(`[PODCAST_GEN] Using Lambda function: ${telegramLambdaName}`);
  console.log(`[PODCAST_GEN] Using SQS queue: ${sqsQueueUrl}`);

  if (!telegramLambdaName) {
    console.error('TELEGRAM_LAMBDA_NAME environment variable not set');
    return {
      success: false,
      error: 'Server configuration error: Lambda function name not set'
    };
  }

  if (!sqsQueueUrl) {
    console.error('SQS_QUEUE_URL environment variable not set');
    return {
      success: false,
      error: 'Server configuration error: SQS queue URL not set'
    };
  }

  return { success: true };
}

/**
 * Validates date range for episode generation.
 * Ensures start is before end, dates are not in the future,
 * and range does not exceed 30 days.
 *
 * @param dateRange - The date range to validate
 * @returns ActionResponse indicating validation success or specific error
 */
export function validateDateRange(dateRange: DateRange): ActionResponse {
  const { startDate, endDate } = dateRange;

  // Check that start date is before end date
  if (startDate >= endDate) {
    return {
      success: false,
      error: 'Start date must be before end date'
    };
  }

  // Check that dates are not in the future
  const now = new Date();
  if (startDate > now) {
    return {
      success: false,
      error: 'Start date cannot be in the future'
    };
  }

  if (endDate > now) {
    return {
      success: false,
      error: 'End date cannot be in the future'
    };
  }

  // Check that range is not too large (max 30 days)
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff > 30) {
    return {
      success: false,
      error: 'Date range cannot exceed 30 days'
    };
  }

  return { success: true };
}
