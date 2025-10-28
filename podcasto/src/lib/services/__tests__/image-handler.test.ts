import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageHandler, createImageHandler } from '../image-handler';
import { episodesApi } from '../../db/api';
import type {
  IS3Service,
  IEpisodeUpdater,
  IImageGenerationService,
} from '../interfaces';
import type { ImagePreviewResult } from '../interfaces/post-processing-types.interface';

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
  let uploadImageToS3Mock: ReturnType<
    typeof vi.fn<
      Parameters<IS3Service['uploadImageToS3']>,
      ReturnType<IS3Service['uploadImageToS3']>
    >
  >;
  let generateImagePromptMock: ReturnType<
    typeof vi.fn<
      Parameters<IImageGenerationService['generateImagePrompt']>,
      ReturnType<IImageGenerationService['generateImagePrompt']>
    >
  >;
  let generateImagePreviewMock: ReturnType<
    typeof vi.fn<
      Parameters<IImageGenerationService['generateImagePreview']>,
      ReturnType<IImageGenerationService['generateImagePreview']>
    >
  >;
  let updateEpisodeWithImageMock: ReturnType<
    typeof vi.fn<
      Parameters<IEpisodeUpdater['updateEpisodeWithImage']>,
      ReturnType<IEpisodeUpdater['updateEpisodeWithImage']>
    >
  >;
  let markEpisodeAsPublishedMock: ReturnType<
    typeof vi.fn<
      Parameters<IEpisodeUpdater['markEpisodeAsPublished']>,
      ReturnType<IEpisodeUpdater['markEpisodeAsPublished']>
    >
  >;
  let trackImageGenerationErrorMock: ReturnType<
    typeof vi.fn<
      Parameters<IEpisodeUpdater['trackImageGenerationError']>,
      ReturnType<IEpisodeUpdater['trackImageGenerationError']>
    >
  >;
  let getEpisodeByIdMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    uploadImageToS3Mock = vi.fn<
      Parameters<IS3Service['uploadImageToS3']>,
      ReturnType<IS3Service['uploadImageToS3']>
    >();

    mockS3Service = {
      listEpisodeFiles: vi.fn(async () => ({ files: [], error: undefined })),
      getFileContent: vi.fn(async () => ({ content: null, error: undefined })),
      getFileMetadata: vi.fn(async () => ({ metadata: null, error: undefined })),
      uploadImageToS3: uploadImageToS3Mock,
      deleteFile: vi.fn(async () => ({ success: true })),
      deleteAllEpisodeFiles: vi.fn(async () => ({ success: true, deletedCount: 0 })),
      deleteEpisodeFromS3: vi.fn(async () => ({ success: true, deletedCount: 0 })),
      deletePodcastFromS3: vi.fn(async () => ({ success: true, deletedCount: 0 })),
      getTranscriptFromS3: vi.fn(async () => null),
    };

    updateEpisodeWithImageMock = vi.fn<
      Parameters<IEpisodeUpdater['updateEpisodeWithImage']>,
      ReturnType<IEpisodeUpdater['updateEpisodeWithImage']>
    >(async () => undefined);
    markEpisodeAsPublishedMock = vi.fn<
      Parameters<IEpisodeUpdater['markEpisodeAsPublished']>,
      ReturnType<IEpisodeUpdater['markEpisodeAsPublished']>
    >(async () => undefined);
    trackImageGenerationErrorMock = vi.fn<
      Parameters<IEpisodeUpdater['trackImageGenerationError']>,
      ReturnType<IEpisodeUpdater['trackImageGenerationError']>
    >(async () => undefined);

    mockEpisodeUpdater = {
      updateEpisodeWithSummary: vi.fn(async () => undefined),
      markEpisodeAsProcessed: vi.fn(async () => undefined),
      markEpisodeAsPublished: markEpisodeAsPublishedMock,
      markEpisodeAsFailed: vi.fn(async () => undefined),
      trackImageGenerationError: trackImageGenerationErrorMock,
      updateEpisodeWithImage: updateEpisodeWithImageMock,
      parseEpisodeMetadata: vi.fn(() => ({})),
    };

    generateImagePromptMock = vi.fn<
      Parameters<IImageGenerationService['generateImagePrompt']>,
      ReturnType<IImageGenerationService['generateImagePrompt']>
    >(async () => '');
    generateImagePreviewMock = vi.fn<
      Parameters<IImageGenerationService['generateImagePreview']>,
      ReturnType<IImageGenerationService['generateImagePreview']>
    >();

    mockImageService = {
      generateImagePrompt: generateImagePromptMock,
      generateImagePreview: generateImagePreviewMock,
    };

    getEpisodeByIdMock = vi.mocked(episodesApi.getEpisodeById);

    handler = new ImageHandler(mockS3Service, mockEpisodeUpdater, mockImageService);
  });

  describe('constructor', () => {
    it('should throw error if S3Service is not provided', () => {
      expect(() =>
        new ImageHandler(
          null as unknown as IS3Service,
          mockEpisodeUpdater,
          mockImageService
        )
      ).toThrow('S3Service is required for ImageHandler');
    });

    it('should throw error if EpisodeUpdater is not provided', () => {
      expect(() =>
        new ImageHandler(
          mockS3Service,
          null as unknown as IEpisodeUpdater,
          mockImageService
        )
      ).toThrow('EpisodeUpdater is required for ImageHandler');
    });

    it('should throw error if ImageGenerationService is not provided', () => {
      expect(() =>
        new ImageHandler(
          mockS3Service,
          mockEpisodeUpdater,
          null as unknown as IImageGenerationService
        )
      ).toThrow('ImageGenerationService is required for ImageHandler');
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

      generateImagePromptMock.mockResolvedValue(expectedPrompt);

      const result = await handler.generateImagePrompt(summary, title);

      expect(result).toBe(expectedPrompt);
      expect(generateImagePromptMock).toHaveBeenCalledWith(summary, title);
    });
  });

  describe('generateImagePreview', () => {
    it('should delegate to image service', async () => {
      const summary = 'Test summary';
      const expectedResult: ImagePreviewResult = {
        success: true,
        imageData: Buffer.from('test'),
        mimeType: 'image/jpeg',
      };

      generateImagePreviewMock.mockResolvedValue(expectedResult);

      const result = await handler.generateImagePreview(summary);

      expect(result).toEqual(expectedResult);
      expect(generateImagePreviewMock).toHaveBeenCalledWith(summary, undefined);
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

      getEpisodeByIdMock.mockResolvedValue(mockEpisode);
      uploadImageToS3Mock.mockResolvedValue({
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
      expect(uploadImageToS3Mock).toHaveBeenCalledWith(
        podcastId,
        episodeId,
        imageData,
        mimeType
      );
      expect(updateEpisodeWithImageMock).toHaveBeenCalledWith(
        episodeId,
        imageUrl,
        'Episode description'
      );
    });

    it('should handle episode not found', async () => {
      getEpisodeByIdMock.mockResolvedValue(null);

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
      getEpisodeByIdMock.mockResolvedValue(mockEpisode);
      uploadImageToS3Mock.mockResolvedValue({
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
      getEpisodeByIdMock.mockResolvedValue(mockEpisode);
      uploadImageToS3Mock.mockResolvedValue({
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

      getEpisodeByIdMock.mockResolvedValue(mockEpisode);
      generateImagePreviewMock.mockResolvedValue({
        success: true,
        imageData,
        mimeType: 'image/jpeg',
      });
      uploadImageToS3Mock.mockResolvedValue({
        url: 'https://s3.example.com/image.jpg',
      });

      const result = await handler.generateEpisodeImage(episodeId, podcastId, summary);

      expect(result).toBe(true);
      expect(generateImagePreviewMock).toHaveBeenCalledWith(summary, 'Episode Title');
    });

    it('should handle image generation failure gracefully', async () => {
      const mockEpisode = { id: episodeId, title: 'Title' };

      getEpisodeByIdMock.mockResolvedValue(mockEpisode);
      generateImagePreviewMock.mockResolvedValue({
        success: false,
        imageData: null,
        mimeType: 'image/jpeg',
        error: 'Generation failed',
      });

      const result = await handler.generateEpisodeImage(episodeId, podcastId, summary);

      expect(result).toBe(false);
      expect(markEpisodeAsPublishedMock).toHaveBeenCalledWith(episodeId);
    });

    it('should handle save failure gracefully', async () => {
      const mockEpisode = { id: episodeId, title: 'Title' };
      const imageData = Buffer.from('image');

      getEpisodeByIdMock
        .mockResolvedValueOnce(mockEpisode)
        .mockResolvedValueOnce(mockEpisode);
      generateImagePreviewMock.mockResolvedValue({
        success: true,
        imageData,
        mimeType: 'image/jpeg',
      });
      uploadImageToS3Mock.mockResolvedValue({
        url: undefined,
        error: 'Upload failed',
      });

      const result = await handler.generateEpisodeImage(episodeId, podcastId, summary);

      expect(result).toBe(false);
    });

    it('should track errors in episode metadata', async () => {
      const mockEpisode = { id: episodeId, title: 'Title' };
      const error = new Error('Unexpected error');

      getEpisodeByIdMock.mockResolvedValue(mockEpisode);
      generateImagePreviewMock.mockRejectedValue(error);

      const result = await handler.generateEpisodeImage(episodeId, podcastId, summary);

      expect(result).toBe(false);
      expect(trackImageGenerationErrorMock).toHaveBeenCalledWith(episodeId, error);
    });
  });

  describe('createImageHandler', () => {
    it('should create handler with all dependencies', () => {
      const instance = createImageHandler(
        mockS3Service,
        mockEpisodeUpdater,
        mockImageService
      );
      expect(instance).toBeInstanceOf(ImageHandler);
    });

    it('should throw error if any dependency is missing', () => {
      expect(() =>
        createImageHandler(
          null as unknown as IS3Service,
          mockEpisodeUpdater,
          mockImageService
        )
      ).toThrow('All dependencies are required for ImageHandler');
    });
  });
});
