import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { TranscriptProcessor, createTranscriptProcessor } from '../transcript-processor';
import type { IS3Service } from '../interfaces';

describe('TranscriptProcessor', () => {
  let processor: TranscriptProcessor;
  let mockS3Service: {
    getTranscriptFromS3: Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockS3Service = {
      getTranscriptFromS3: vi.fn(),
    };

    processor = new TranscriptProcessor(mockS3Service as any);
  });

  describe('constructor', () => {
    it('should throw error if S3Service is not provided', () => {
      expect(() => new TranscriptProcessor(null as any)).toThrow(
        'S3Service is required for TranscriptProcessor'
      );
    });

    it('should create processor with valid S3Service', () => {
      expect(processor).toBeInstanceOf(TranscriptProcessor);
    });
  });

  describe('getTranscriptWithRetry', () => {
    const podcastId = 'podcast-1';
    const episodeId = 'episode-1';
    const validTranscript = 'This is a test transcript content.';

    it('should retrieve transcript on first attempt', async () => {
      mockS3Service.getTranscriptFromS3.mockResolvedValue(validTranscript);

      const result = await processor.getTranscriptWithRetry(podcastId, episodeId);

      expect(result).toBe(validTranscript);
      expect(mockS3Service.getTranscriptFromS3).toHaveBeenCalledTimes(1);
      expect(mockS3Service.getTranscriptFromS3).toHaveBeenCalledWith(
        podcastId,
        episodeId
      );
    });

    it('should retry on failure and succeed on second attempt', async () => {
      mockS3Service.getTranscriptFromS3
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(validTranscript);

      const result = await processor.getTranscriptWithRetry(podcastId, episodeId);

      expect(result).toBe(validTranscript);
      expect(mockS3Service.getTranscriptFromS3).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries with failures', async () => {
      mockS3Service.getTranscriptFromS3.mockRejectedValue(
        new Error('S3 retrieval failed')
      );

      await expect(
        processor.getTranscriptWithRetry(podcastId, episodeId, 3)
      ).rejects.toThrow('Failed to retrieve transcript after 3 attempts');

      expect(mockS3Service.getTranscriptFromS3).toHaveBeenCalledTimes(3);
    });

    it('should throw error if transcript is null after all retries', async () => {
      mockS3Service.getTranscriptFromS3.mockResolvedValue(null);

      await expect(
        processor.getTranscriptWithRetry(podcastId, episodeId, 2)
      ).rejects.toThrow(
        `Failed to retrieve transcript for episode ${episodeId} after multiple attempts`
      );
    });

    it('should use custom maxRetries parameter', async () => {
      mockS3Service.getTranscriptFromS3.mockRejectedValue(new Error('Failed'));

      await expect(
        processor.getTranscriptWithRetry(podcastId, episodeId, 1)
      ).rejects.toThrow('Failed to retrieve transcript after 1 attempts');

      expect(mockS3Service.getTranscriptFromS3).toHaveBeenCalledTimes(1);
    });

    it('should preprocess transcript before returning', async () => {
      const messyTranscript = 'This   has    extra   spaces\n and  \n   newlines';
      mockS3Service.getTranscriptFromS3.mockResolvedValue(messyTranscript);

      const result = await processor.getTranscriptWithRetry(podcastId, episodeId);

      expect(result).not.toContain('  '); // No double spaces
      // The preprocessor replaces all whitespace with single spaces and removes spaces around newlines
      expect(result).toBe('This has extra spaces and newlines');
    });
  });

  describe('preprocessTranscript', () => {
    it('should remove redundant whitespace', () => {
      const input = 'This   has    multiple   spaces';
      const result = processor.preprocessTranscript(input);

      expect(result).toBe('This has multiple spaces');
    });

    it('should clean up newlines with spaces', () => {
      const input = 'Line one \nLine two\n Line three';
      const result = processor.preprocessTranscript(input);

      // The preprocessor replaces all whitespace including newlines with single spaces
      expect(result).toBe('Line one Line two Line three');
    });

    it('should truncate transcript exceeding maxLength', () => {
      const longTranscript = 'A'.repeat(20000);
      const result = processor.preprocessTranscript(longTranscript, 15000);

      expect(result.length).toBe(15003); // 15000 + '...'
      expect(result.endsWith('...')).toBe(true);
    });

    it('should not truncate transcript within maxLength', () => {
      const shortTranscript = 'Short transcript';
      const result = processor.preprocessTranscript(shortTranscript, 15000);

      expect(result).toBe(shortTranscript);
      expect(result.endsWith('...')).toBe(false);
    });

    it('should use default maxLength of 15000', () => {
      const longTranscript = 'B'.repeat(20000);
      const result = processor.preprocessTranscript(longTranscript);

      expect(result.length).toBeLessThanOrEqual(15003);
    });

    it('should handle empty string', () => {
      const result = processor.preprocessTranscript('');
      expect(result).toBe('');
    });

    it('should handle string with only whitespace', () => {
      const result = processor.preprocessTranscript('   \n   \t   ');
      expect(result.trim()).toBe('');
    });
  });

  describe('createTranscriptProcessor', () => {
    it('should create processor with valid S3Service', () => {
      const processor = createTranscriptProcessor(mockS3Service as any);
      expect(processor).toBeInstanceOf(TranscriptProcessor);
    });

    it('should throw error if S3Service is not provided', () => {
      expect(() => createTranscriptProcessor(null as any)).toThrow(
        's3Service is required'
      );
    });
  });
});
