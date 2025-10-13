import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  SummaryGenerationService,
  createSummaryGenerationService,
} from '../summary-generation';
import { AIService } from '../../ai';
import type { SummaryGenerationOptions } from '../../ai/types';

vi.mock('../../ai');

describe('SummaryGenerationService', () => {
  let service: SummaryGenerationService;
  let mockAIService: {
    generateTitleAndSummary: Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockAIService = {
      generateTitleAndSummary: vi.fn(),
    };

    service = new SummaryGenerationService(mockAIService as any);
  });

  describe('constructor', () => {
    it('should throw error if AIService is not provided', () => {
      expect(() => new SummaryGenerationService(null as any)).toThrow(
        'AIService is required for SummaryGenerationService'
      );
    });

    it('should create service with valid AIService', () => {
      expect(service).toBeInstanceOf(SummaryGenerationService);
    });
  });

  describe('generateSummary', () => {
    const validTranscript =
      'This is a comprehensive podcast transcript discussing various technological advancements.';
    const validOptions: SummaryGenerationOptions = {
      language: 'English',
      style: 'concise',
      maxLength: 150,
    };

    it('should generate summary successfully', async () => {
      const expectedSummary = 'A discussion about technological advancements and their impact.';
      mockAIService.generateTitleAndSummary.mockResolvedValue({
        title: 'Tech Talk',
        summary: expectedSummary,
      });

      const result = await service.generateSummary(validTranscript, validOptions);

      expect(result).toBe(expectedSummary);
      expect(mockAIService.generateTitleAndSummary).toHaveBeenCalledWith(
        validTranscript,
        expect.objectContaining({
          language: validOptions.language,
          style: 'engaging',
          maxLength: 60,
        }),
        validOptions
      );
      expect(mockAIService.generateTitleAndSummary).toHaveBeenCalledTimes(1);
    });

    it('should throw error for empty transcript', async () => {
      await expect(service.generateSummary('', validOptions)).rejects.toThrow(
        'Transcript cannot be empty'
      );

      expect(mockAIService.generateTitleAndSummary).not.toHaveBeenCalled();
    });

    it('should throw error for whitespace-only transcript', async () => {
      await expect(service.generateSummary('   \n\t  ', validOptions)).rejects.toThrow(
        'Transcript cannot be empty'
      );
    });

    it('should handle AI service errors', async () => {
      const errorMessage = 'AI API rate limit exceeded';
      mockAIService.generateTitleAndSummary.mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(
        service.generateSummary(validTranscript, validOptions)
      ).rejects.toThrow(`Failed to generate summary: ${errorMessage}`);
    });

    it('should handle non-Error exceptions', async () => {
      mockAIService.generateTitleAndSummary.mockRejectedValue('Network error');

      await expect(
        service.generateSummary(validTranscript, validOptions)
      ).rejects.toThrow('Failed to generate summary: Network error');
    });

    it('should work with different style options', async () => {
      const detailedOptions: SummaryGenerationOptions = {
        language: 'English',
        style: 'detailed',
        maxLength: 300,
      };

      mockAIService.generateTitleAndSummary.mockResolvedValue({
        title: 'Title',
        summary: 'A detailed comprehensive summary with more information.',
      });

      const result = await service.generateSummary(validTranscript, detailedOptions);

      expect(result).toBeDefined();
      expect(mockAIService.generateTitleAndSummary).toHaveBeenCalledWith(
        validTranscript,
        expect.any(Object),
        detailedOptions
      );
    });

    it('should work with Arabic language', async () => {
      const arabicOptions: SummaryGenerationOptions = {
        language: 'Arabic',
        style: 'concise',
        maxLength: 150,
      };

      mockAIService.generateTitleAndSummary.mockResolvedValue({
        title: 'عنوان',
        summary: 'ملخص موجز عن الموضوع',
      });

      const result = await service.generateSummary(validTranscript, arabicOptions);

      expect(result).toBe('ملخص موجز عن الموضوع');
    });
  });

  describe('createSummaryGenerationService', () => {
    it('should create service with valid AIService', () => {
      const service = createSummaryGenerationService(mockAIService as any);
      expect(service).toBeInstanceOf(SummaryGenerationService);
    });

    it('should throw error if AIService is not provided', () => {
      expect(() => createSummaryGenerationService(null as any)).toThrow(
        'aiService is required'
      );
    });
  });
});
