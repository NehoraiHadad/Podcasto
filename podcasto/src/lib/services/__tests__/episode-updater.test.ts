import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { EpisodeUpdater, createEpisodeUpdater } from '../episode-updater';
import { episodesApi } from '../../db/api';

vi.mock('../../db/api', () => ({
  episodesApi: {
    updateEpisode: vi.fn(),
    getEpisodeById: vi.fn(),
  },
}));

describe('EpisodeUpdater', () => {
  let updater: EpisodeUpdater;

  beforeEach(() => {
    vi.clearAllMocks();
    updater = new EpisodeUpdater();
  });

  describe('updateEpisodeWithSummary', () => {
    it('should update episode with title and summary', async () => {
      const episodeId = 'episode-1';
      const title = 'Episode Title';
      const summary = 'Episode summary content';

      await updater.updateEpisodeWithSummary(episodeId, title, summary);

      expect(episodesApi.updateEpisode).toHaveBeenCalledWith(episodeId, {
        title,
        description: summary,
        status: 'summary_completed',
      });
    });
  });

  describe('markEpisodeAsProcessed', () => {
    it('should mark episode as processed', async () => {
      const episodeId = 'episode-2';

      await updater.markEpisodeAsProcessed(episodeId);

      expect(episodesApi.updateEpisode).toHaveBeenCalledWith(episodeId, {
        status: 'processed',
      });
    });
  });

  describe('markEpisodeAsPublished', () => {
    it('should mark episode as published with timestamp', async () => {
      const episodeId = 'episode-3';

      await updater.markEpisodeAsPublished(episodeId);

      expect(episodesApi.updateEpisode).toHaveBeenCalledWith(episodeId, {
        status: 'published',
        published_at: expect.any(Date),
      });
    });
  });

  describe('markEpisodeAsFailed', () => {
    it('should mark episode as failed with error message', async () => {
      const episodeId = 'episode-4';
      const error = new Error('Processing failed');

      await updater.markEpisodeAsFailed(episodeId, error);

      expect(episodesApi.updateEpisode).toHaveBeenCalledWith(episodeId, {
        status: 'failed',
        description: 'Processing failed: Processing failed',
      });
    });

    it('should handle non-Error exceptions', async () => {
      const episodeId = 'episode-5';
      const error = 'String error';

      await updater.markEpisodeAsFailed(episodeId, error);

      expect(episodesApi.updateEpisode).toHaveBeenCalledWith(episodeId, {
        status: 'failed',
        description: 'Processing failed: String error',
      });
    });

    it('should catch and log update errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const episodeId = 'episode-6';

      (episodesApi.updateEpisode as Mock).mockRejectedValue(
        new Error('Database error')
      );

      await updater.markEpisodeAsFailed(episodeId, new Error('Original error'));

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('trackImageGenerationError', () => {
    it('should track image error in metadata', async () => {
      const episodeId = 'episode-7';
      const error = new Error('Image generation failed');
      const existingEpisode = {
        id: episodeId,
        metadata: '{"existing":"data"}',
      };

      (episodesApi.getEpisodeById as Mock).mockResolvedValue(existingEpisode);

      await updater.trackImageGenerationError(episodeId, error);

      expect(episodesApi.updateEpisode).toHaveBeenCalledWith(episodeId, {
        status: 'processed',
        metadata: expect.stringContaining('image_generation_error'),
      });

      const updateCall = (episodesApi.updateEpisode as Mock).mock.calls[0][1];
      const metadata = JSON.parse(updateCall.metadata);
      expect(metadata.image_generation_error).toBe('Image generation failed');
      expect(metadata.image_generation_timestamp).toBeDefined();
      expect(metadata.existing).toBe('data');
    });

    it('should handle episode with no existing metadata', async () => {
      const episodeId = 'episode-8';
      const error = 'Image error';

      (episodesApi.getEpisodeById as Mock).mockResolvedValue({
        id: episodeId,
        metadata: null,
      });

      await updater.trackImageGenerationError(episodeId, error);

      const updateCall = (episodesApi.updateEpisode as Mock).mock.calls[0][1];
      const metadata = JSON.parse(updateCall.metadata);
      expect(metadata.image_generation_error).toBe('Image error');
    });

    it('should handle invalid existing metadata', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const episodeId = 'episode-9';

      (episodesApi.getEpisodeById as Mock).mockResolvedValue({
        id: episodeId,
        metadata: 'invalid json',
      });

      await updater.trackImageGenerationError(episodeId, new Error('Error'));

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('updateEpisodeWithImage', () => {
    it('should update episode with image URL', async () => {
      const episodeId = 'episode-10';
      const imageUrl = 'https://example.com/image.png';
      const existingEpisode = {
        id: episodeId,
        description: 'Original description',
        metadata: null,
      };

      (episodesApi.getEpisodeById as Mock).mockResolvedValue(existingEpisode);
      (episodesApi.updateEpisode as Mock).mockResolvedValue(undefined);

      await updater.updateEpisodeWithImage(episodeId, imageUrl);

      expect(episodesApi.updateEpisode).toHaveBeenCalledWith(episodeId, {
        cover_image: imageUrl,
        status: 'published',
        published_at: expect.any(Date),
        metadata: expect.stringContaining('original_description'),
      });
    });

    it('should throw error if episode not found', async () => {
      const episodeId = 'nonexistent';
      const imageUrl = 'https://example.com/image.png';

      (episodesApi.getEpisodeById as Mock).mockResolvedValue(null);

      await expect(
        updater.updateEpisodeWithImage(episodeId, imageUrl)
      ).rejects.toThrow('Episode not found');
    });

    it('should preserve existing metadata', async () => {
      const episodeId = 'episode-11';
      const imageUrl = 'https://example.com/image.png';
      const existingEpisode = {
        id: episodeId,
        description: 'Description',
        metadata: '{"custom":"field"}',
      };

      (episodesApi.getEpisodeById as Mock).mockResolvedValue(existingEpisode);
      (episodesApi.updateEpisode as Mock).mockResolvedValue(undefined);

      await updater.updateEpisodeWithImage(episodeId, imageUrl);

      const updateCall = (episodesApi.updateEpisode as Mock).mock.calls[0][1];
      const metadata = JSON.parse(updateCall.metadata);
      expect(metadata.custom).toBe('field');
      expect(metadata.original_description).toBe('Description');
    });
  });

  describe('parseEpisodeMetadata', () => {
    it('should parse valid JSON metadata', () => {
      const metadataStr = '{"key":"value","number":42}';
      const result = updater.parseEpisodeMetadata(metadataStr);

      expect(result).toEqual({ key: 'value', number: 42 });
    });

    it('should return null for null input', () => {
      const result = updater.parseEpisodeMetadata(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = updater.parseEpisodeMetadata(undefined);
      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = updater.parseEpisodeMetadata('invalid json');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('createEpisodeUpdater', () => {
    it('should create an EpisodeUpdater instance', () => {
      const updater = createEpisodeUpdater();
      expect(updater).toBeInstanceOf(EpisodeUpdater);
    });
  });
});
