import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { ImageHandler, createImageHandler } from '../image-handler';
import { episodesApi } from '../../db/api';
import type {
  IS3Service,
  IEpisodeUpdater,
  IImageGenerationService,
} from '../interfaces';

vi.mock('../../db/api', () => ({
  episodesApi: {
    getEpisodeById: vi.fn(),
  },
}));

describe('ImageHandler', () => {
  let handler: ImageHandler;
  let mockS3Service: IS3Service;
  let mockEpisodeUpdater: IEpisodeUpdater;
  let mockImageService: IImageGenerationService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockS3Service = {
      uploadImageToS3: vi.fn(),
    } as any;

    mockEpisodeUpdater = {
      updateEpisodeWithImage: vi.fn(),
      markEpisodeAsPublished: vi.fn(),
      trackImageGenerationError: vi.fn(),
    } as any;

    mockImageService = {
      generateImagePrompt: vi.fn(),
      generateImagePreview: vi.fn(),
    } as any;

    handler = new ImageHandler(mockS3Service, mockEpisodeUpdater, mockImageService);
  });

  describe('constructor', () => {
    it('should throw error if S3Service is not provided', () => {
      expect(() => new ImageHandler(null as any, mockEpisodeUpdater, mockImageService)).toThrow(
        'S3Service is required for ImageHandler'
      );
    });

    it('should throw error if EpisodeUpdater is not provided', () => {
      expect(() => new ImageHandler(mockS3Service, null as any, mockImageService)).toThrow(
        'EpisodeUpdater is required for ImageHandler'
      );
    });

    it('should throw error if ImageGenerationService is not provided', () => {
      expect(() => new ImageHandler(mockS3Service, mockEpisodeUpdater, null as any)).toThrow(
        'ImageGenerationService is required for ImageHandler'
      );
    });

    it('should create handler with all dependencies', () => {
      expect(handler).toBeInstanceOf(ImageHandler);
    });
  });

  describe('generateImagePrompt', () => {
    it('should delegate to image service', async () => {
      const summary = 'Test summary';
      const title = 'Test title';
      const expectedPrompt = 'Generated prompt';

      (mockImageService.generateImagePrompt as Mock).mockResolvedValue(expectedPrompt);

      const result = await handler.generateImagePrompt(summary, title);

      expect(result).toBe(expectedPrompt);
      expect(mockImageService.generateImagePrompt).toHaveBeenCalledWith(summary, title);
    });
  });

  describe('generateImagePreview', () => {
    it('should delegate to image service', async () => {
      const summary = 'Test summary';
      const expectedResult = {
        success: true,
        imageData: Buffer.from('test'),
        mimeType: 'image/jpeg',
      };

      (mockImageService.generateImagePreview as Mock).mockResolvedValue(expectedResult);

      const result = await handler.generateImagePreview(summary);

      expect(result).toEqual(expectedResult);
      expect(mockImageService.generateImagePreview).toHaveBeenCalledWith(summary, undefined);
    });
  });

  describe('saveGeneratedImage', () => {
    const episodeId = 'episode-1';
    const podcastId = 'podcast-1';
    const imageData = Buffer.from('image-data');
    const mimeType = 'image/png';

    it('should successfully save image and update episode', async () => {
      const mockEpisode = {
        id: episodeId,
        description: 'Episode description',
      };
      const imageUrl = 'https://s3.example.com/image.png';

      (episodesApi.getEpisodeById as Mock).mockResolvedValue(mockEpisode);
      (mockS3Service.uploadImageToS3 as Mock).mockResolvedValue({
        url: imageUrl,
        error: undefined,
      });

      const result = await handler.saveGeneratedImage(
        episodeId,
        podcastId,
        imageData,
        mimeType
      );

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBe(imageUrl);
      expect(mockS3Service.uploadImageToS3).toHaveBeenCalledWith(
        podcastId,
        episodeId,
        imageData,
        mimeType
      );
      expect(mockEpisodeUpdater.updateEpisodeWithImage).toHaveBeenCalledWith(
        episodeId,
        imageUrl,
        'Episode description'
      );
    });

    it('should handle episode not found', async () => {
      (episodesApi.getEpisodeById as Mock).mockResolvedValue(null);

      const result = await handler.saveGeneratedImage(
        episodeId,
        podcastId,
        imageData,
        mimeType
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Episode not found');
    });

    it('should handle S3 upload error', async () => {
      const mockEpisode = { id: episodeId, description: 'Test' };
      (episodesApi.getEpisodeById as Mock).mockResolvedValue(mockEpisode);
      (mockS3Service.uploadImageToS3 as Mock).mockResolvedValue({
        url: undefined,
        error: 'Upload failed',
      });

      const result = await handler.saveGeneratedImage(
        episodeId,
        podcastId,
        imageData,
        mimeType
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Upload failed');
    });

    it('should handle missing URL from upload', async () => {
      const mockEpisode = { id: episodeId, description: 'Test' };
      (episodesApi.getEpisodeById as Mock).mockResolvedValue(mockEpisode);
      (mockS3Service.uploadImageToS3 as Mock).mockResolvedValue({
        url: null,
        error: undefined,
      });

      const result = await handler.saveGeneratedImage(
        episodeId,
        podcastId,
        imageData,
        mimeType
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to upload image to S3');
    });
  });

  describe('generateEpisodeImage', () => {
    const episodeId = 'episode-2';
    const podcastId = 'podcast-2';
    const summary = 'Episode summary';

    it('should successfully generate and save image', async () => {
      const mockEpisode = {
        id: episodeId,
        title: 'Episode Title',
        description: 'Description',
      };
      const imageData = Buffer.from('image');

      (episodesApi.getEpisodeById as Mock).mockResolvedValue(mockEpisode);
      (mockImageService.generateImagePreview as Mock).mockResolvedValue({
        success: true,
        imageData,
        mimeType: 'image/jpeg',
      });
      (mockS3Service.uploadImageToS3 as Mock).mockResolvedValue({
        url: 'https://s3.example.com/image.jpg',
      });

      const result = await handler.generateEpisodeImage(episodeId, podcastId, summary);

      expect(result).toBe(true);
      expect(mockImageService.generateImagePreview).toHaveBeenCalledWith(
        summary,
        'Episode Title'
      );
    });

    it('should handle image generation failure gracefully', async () => {
      const mockEpisode = { id: episodeId, title: 'Title' };

      (episodesApi.getEpisodeById as Mock).mockResolvedValue(mockEpisode);
      (mockImageService.generateImagePreview as Mock).mockResolvedValue({
        success: false,
        imageData: null,
        mimeType: 'image/jpeg',
        error: 'Generation failed',
      });

      const result = await handler.generateEpisodeImage(episodeId, podcastId, summary);

      expect(result).toBe(false);
      expect(mockEpisodeUpdater.markEpisodeAsPublished).toHaveBeenCalledWith(episodeId);
    });

    it('should handle save failure gracefully', async () => {
      const mockEpisode = { id: episodeId, title: 'Title' };
      const imageData = Buffer.from('image');

      (episodesApi.getEpisodeById as Mock)
        .mockResolvedValueOnce(mockEpisode)
        .mockResolvedValueOnce(mockEpisode);
      (mockImageService.generateImagePreview as Mock).mockResolvedValue({
        success: true,
        imageData,
        mimeType: 'image/jpeg',
      });
      (mockS3Service.uploadImageToS3 as Mock).mockResolvedValue({
        url: undefined,
        error: 'Upload failed',
      });

      const result = await handler.generateEpisodeImage(episodeId, podcastId, summary);

      expect(result).toBe(false);
    });

    it('should track errors in episode metadata', async () => {
      const mockEpisode = { id: episodeId, title: 'Title' };
      const error = new Error('Unexpected error');

      (episodesApi.getEpisodeById as Mock).mockResolvedValue(mockEpisode);
      (mockImageService.generateImagePreview as Mock).mockRejectedValue(error);

      const result = await handler.generateEpisodeImage(episodeId, podcastId, summary);

      expect(result).toBe(false);
      expect(mockEpisodeUpdater.trackImageGenerationError).toHaveBeenCalledWith(
        episodeId,
        error
      );
    });
  });

  describe('createImageHandler', () => {
    it('should create handler with all dependencies', () => {
      const handler = createImageHandler(
        mockS3Service,
        mockEpisodeUpdater,
        mockImageService
      );
      expect(handler).toBeInstanceOf(ImageHandler);
    });

    it('should throw error if any dependency is missing', () => {
      expect(() =>
        createImageHandler(null as any, mockEpisodeUpdater, mockImageService)
      ).toThrow('All dependencies are required for ImageHandler');
    });
  });
});
