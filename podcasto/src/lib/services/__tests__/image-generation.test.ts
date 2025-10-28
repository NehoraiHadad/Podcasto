import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ImageGenerationService,
  createImageGenerationService,
} from '../image-generation';
import type { AIService } from '../../ai';
import type { PromptGenerator } from '../prompt-generator';
import * as promptGeneratorModule from '../prompt-generator';

vi.mock('../../ai');
vi.mock('../prompt-generator', () => ({
  createPromptGenerator: vi.fn(),
  PromptGenerator: vi.fn(),
}));

describe('ImageGenerationService', () => {
  let service: ImageGenerationService;
  let mockAIService: Pick<AIService, 'getApiKey' | 'generateImage'>;
  let mockPromptGenerator: Pick<PromptGenerator, 'generateImagePrompt'>;
  let getApiKeyMock: ReturnType<typeof vi.fn<[], string>>;
  let generateImageMock: ReturnType<
    typeof vi.fn<
      Parameters<AIService['generateImage']>,
      ReturnType<AIService['generateImage']>
    >
  >;
  let generateImagePromptMock: ReturnType<
    typeof vi.fn<
      Parameters<PromptGenerator['generateImagePrompt']>,
      ReturnType<PromptGenerator['generateImagePrompt']>
    >
  >;

  beforeEach(() => {
    vi.clearAllMocks();

    getApiKeyMock = vi.fn(() => 'test-api-key');
    generateImageMock = vi.fn();
    mockAIService = {
      getApiKey: getApiKeyMock,
      generateImage: generateImageMock,
    };

    generateImagePromptMock = vi.fn();
    mockPromptGenerator = {
      generateImagePrompt: generateImagePromptMock,
    };

    // Mock the prompt generator creation
    vi.mocked(promptGeneratorModule.createPromptGenerator).mockReturnValue(
      mockPromptGenerator as unknown as PromptGenerator
    );

    service = new ImageGenerationService(mockAIService as unknown as AIService);
  });

  describe('constructor', () => {
    it('should throw error if AIService is not provided', () => {
      expect(
        () => new ImageGenerationService(null as unknown as AIService)
      ).toThrow(
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

      generateImagePromptMock.mockResolvedValue(expectedPrompt);

      const result = await service.generateImagePrompt(summary, title);

      expect(result).toBe(expectedPrompt);
      expect(generateImagePromptMock).toHaveBeenCalledWith(
        summary,
        title
      );
    });

    it('should generate prompt with only summary', async () => {
      const summary = 'Technology trends discussion';
      generateImagePromptMock.mockResolvedValue('prompt');

      await service.generateImagePrompt(summary);

      expect(generateImagePromptMock).toHaveBeenCalledWith(
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

      generateImagePromptMock.mockResolvedValue(enhancedPrompt);
      generateImageMock.mockResolvedValue({
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

      generateImagePromptMock.mockResolvedValue(enhancedPrompt);
      generateImageMock.mockResolvedValue({
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

      generateImagePromptMock.mockResolvedValue('prompt');
      generateImageMock.mockRejectedValue(new Error(errorMessage));

      const result = await service.generateImagePreview(summary, title);

      expect(result.success).toBe(false);
      expect(result.imageData).toBeNull();
      expect(result.error).toBe(errorMessage);
      expect(result.generatedFromPrompt).toBe(summary);
    });

    it('should handle prompt generation errors', async () => {
      const errorMessage = 'Prompt generation failed';

      generateImagePromptMock.mockRejectedValue(
        new Error(errorMessage)
      );

      const result = await service.generateImagePreview(summary);

      expect(result.success).toBe(false);
      expect(result.error).toContain(errorMessage);
    });

    it('should handle non-Error exceptions', async () => {
      generateImagePromptMock.mockResolvedValue('prompt');
      generateImageMock.mockRejectedValue('String error');

      const result = await service.generateImagePreview(summary);

      expect(result.success).toBe(false);
      expect(result.error).toBe('String error');
    });
  });

  describe('createImageGenerationService', () => {
    it('should create service with valid AIService', () => {
      const service = createImageGenerationService(
        mockAIService as unknown as AIService
      );
      expect(service).toBeInstanceOf(ImageGenerationService);
    });

    it('should throw error if AIService is not provided', () => {
      expect(() =>
        createImageGenerationService(null as unknown as AIService)
      ).toThrow(
        'aiService is required'
      );
    });
  });
});
