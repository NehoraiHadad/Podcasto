import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  ImageGenerationService,
  createImageGenerationService,
} from '../image-generation';
import { AIService } from '../../ai';
import * as promptGeneratorModule from '../prompt-generator';

vi.mock('../../ai');
vi.mock('../prompt-generator', () => ({
  createPromptGenerator: vi.fn(),
  PromptGenerator: vi.fn(),
}));

describe('ImageGenerationService', () => {
  let service: ImageGenerationService;
  let mockAIService: {
    getApiKey: Mock;
    generateImage: Mock;
  };
  let mockPromptGenerator: {
    generateImagePrompt: Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockAIService = {
      getApiKey: vi.fn().mockReturnValue('test-api-key'),
      generateImage: vi.fn(),
    };

    mockPromptGenerator = {
      generateImagePrompt: vi.fn(),
    };

    // Mock the prompt generator creation
    vi.mocked(promptGeneratorModule.createPromptGenerator).mockReturnValue(
      mockPromptGenerator as any
    );

    service = new ImageGenerationService(mockAIService as any);
  });

  describe('constructor', () => {
    it('should throw error if AIService is not provided', () => {
      expect(() => new ImageGenerationService(null as any)).toThrow(
        'AIService is required for ImageGenerationService'
      );
    });

    it('should create service with valid AIService', () => {
      expect(service).toBeInstanceOf(ImageGenerationService);
    });
  });

  describe('generateImagePrompt', () => {
    it('should generate prompt with summary and title', async () => {
      const summary = 'A discussion about AI technology';
      const title = 'Future of AI';
      const expectedPrompt = 'Enhanced image prompt';

      mockPromptGenerator.generateImagePrompt.mockResolvedValue(expectedPrompt);

      const result = await service.generateImagePrompt(summary, title);

      expect(result).toBe(expectedPrompt);
      expect(mockPromptGenerator.generateImagePrompt).toHaveBeenCalledWith(
        summary,
        title
      );
    });

    it('should generate prompt with only summary', async () => {
      const summary = 'Technology trends discussion';
      mockPromptGenerator.generateImagePrompt.mockResolvedValue('prompt');

      await service.generateImagePrompt(summary);

      expect(mockPromptGenerator.generateImagePrompt).toHaveBeenCalledWith(
        summary,
        undefined
      );
    });
  });

  describe('generateImagePreview', () => {
    const summary = 'Episode summary about technology';
    const title = 'Tech Episode';

    it('should successfully generate image preview', async () => {
      const mockImageData = Buffer.from('image-data');
      const enhancedPrompt = 'Enhanced prompt for image';

      mockPromptGenerator.generateImagePrompt.mockResolvedValue(enhancedPrompt);
      mockAIService.generateImage.mockResolvedValue({
        imageData: mockImageData,
        mimeType: 'image/jpeg',
      });

      const result = await service.generateImagePreview(summary, title);

      expect(result.success).toBe(true);
      expect(result.imageData).toBe(mockImageData);
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.generatedFromPrompt).toBe(enhancedPrompt);
      expect(result.error).toBeUndefined();
    });

    it('should handle case when no image data is generated', async () => {
      const enhancedPrompt = 'Enhanced prompt';

      mockPromptGenerator.generateImagePrompt.mockResolvedValue(enhancedPrompt);
      mockAIService.generateImage.mockResolvedValue({
        imageData: null,
        mimeType: 'image/jpeg',
      });

      const result = await service.generateImagePreview(summary);

      expect(result.success).toBe(false);
      expect(result.imageData).toBeNull();
      expect(result.error).toBe('No image data was generated');
      expect(result.generatedFromPrompt).toBe(enhancedPrompt);
    });

    it('should handle AI service errors', async () => {
      const errorMessage = 'Image generation API failed';

      mockPromptGenerator.generateImagePrompt.mockResolvedValue('prompt');
      mockAIService.generateImage.mockRejectedValue(new Error(errorMessage));

      const result = await service.generateImagePreview(summary, title);

      expect(result.success).toBe(false);
      expect(result.imageData).toBeNull();
      expect(result.error).toBe(errorMessage);
      expect(result.generatedFromPrompt).toBe(summary);
    });

    it('should handle prompt generation errors', async () => {
      const errorMessage = 'Prompt generation failed';

      mockPromptGenerator.generateImagePrompt.mockRejectedValue(
        new Error(errorMessage)
      );

      const result = await service.generateImagePreview(summary);

      expect(result.success).toBe(false);
      expect(result.error).toContain(errorMessage);
    });

    it('should handle non-Error exceptions', async () => {
      mockPromptGenerator.generateImagePrompt.mockResolvedValue('prompt');
      mockAIService.generateImage.mockRejectedValue('String error');

      const result = await service.generateImagePreview(summary);

      expect(result.success).toBe(false);
      expect(result.error).toBe('String error');
    });
  });

  describe('createImageGenerationService', () => {
    it('should create service with valid AIService', () => {
      const service = createImageGenerationService(mockAIService as any);
      expect(service).toBeInstanceOf(ImageGenerationService);
    });

    it('should throw error if AIService is not provided', () => {
      expect(() => createImageGenerationService(null as any)).toThrow(
        'aiService is required'
      );
    });
  });
});
