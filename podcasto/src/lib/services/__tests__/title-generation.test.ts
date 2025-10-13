import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { TitleGenerationService, createTitleGenerationService } from '../title-generation';
import { AIService } from '../../ai';
import type { TitleGenerationOptions } from '../../ai/types';

vi.mock('../../ai');

describe('TitleGenerationService', () => {
  let service: TitleGenerationService;
  let mockAIService: {
    generateTitleAndSummary: Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockAIService = {
      generateTitleAndSummary: vi.fn(),
    };

    service = new TitleGenerationService(mockAIService as any);
  });

  describe('constructor', () => {
    it('should throw error if AIService is not provided', () => {
      expect(() => new TitleGenerationService(null as any)).toThrow(
        'AIService is required for TitleGenerationService'
      );
    });

    it('should create service with valid AIService', () => {
      expect(service).toBeInstanceOf(TitleGenerationService);
    });
  });

  describe('generateTitle', () => {
    const validTranscript = 'This is a test podcast transcript about technology.';
    const validOptions: TitleGenerationOptions = {
      language: 'English',
      style: 'engaging',
      maxLength: 60,
    };

    it('should generate title successfully', async () => {
      const expectedTitle = 'The Future of Technology';
      mockAIService.generateTitleAndSummary.mockResolvedValue({
        title: expectedTitle,
        summary: 'A discussion about tech trends',
      });

      const result = await service.generateTitle(validTranscript, validOptions);

      expect(result).toBe(expectedTitle);
      expect(mockAIService.generateTitleAndSummary).toHaveBeenCalledWith(
        validTranscript,
        validOptions,
        expect.objectContaining({
          language: validOptions.language,
          style: 'concise',
          maxLength: 150,
        })
      );
      expect(mockAIService.generateTitleAndSummary).toHaveBeenCalledTimes(1);
    });

    it('should throw error for empty transcript', async () => {
      await expect(service.generateTitle('', validOptions)).rejects.toThrow(
        'Transcript cannot be empty'
      );

      expect(mockAIService.generateTitleAndSummary).not.toHaveBeenCalled();
    });

    it('should throw error for whitespace-only transcript', async () => {
      await expect(service.generateTitle('   \n\t  ', validOptions)).rejects.toThrow(
        'Transcript cannot be empty'
      );
    });

    it('should handle AI service errors', async () => {
      const errorMessage = 'AI service unavailable';
      mockAIService.generateTitleAndSummary.mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(service.generateTitle(validTranscript, validOptions)).rejects.toThrow(
        `Failed to generate title: ${errorMessage}`
      );
    });

    it('should handle non-Error exceptions', async () => {
      mockAIService.generateTitleAndSummary.mockRejectedValue('String error');

      await expect(service.generateTitle(validTranscript, validOptions)).rejects.toThrow(
        'Failed to generate title: String error'
      );
    });

    it('should work with different language options', async () => {
      const arabicOptions: TitleGenerationOptions = {
        language: 'Arabic',
        style: 'professional',
        maxLength: 50,
      };

      mockAIService.generateTitleAndSummary.mockResolvedValue({
        title: 'عنوان تجريبي',
        summary: 'ملخص',
      });

      const result = await service.generateTitle(validTranscript, arabicOptions);

      expect(result).toBe('عنوان تجريبي');
      expect(mockAIService.generateTitleAndSummary).toHaveBeenCalledWith(
        validTranscript,
        arabicOptions,
        expect.objectContaining({ language: 'Arabic' })
      );
    });
  });

  describe('createTitleGenerationService', () => {
    it('should create service with valid AIService', () => {
      const service = createTitleGenerationService(mockAIService as any);
      expect(service).toBeInstanceOf(TitleGenerationService);
    });

    it('should throw error if AIService is not provided', () => {
      expect(() => createTitleGenerationService(null as any)).toThrow(
        'aiService is required'
      );
    });
  });
});
