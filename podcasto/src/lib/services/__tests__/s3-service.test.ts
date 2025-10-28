import { describe, it, expect, vi, beforeEach } from 'vitest';
import { S3Service } from '../s3-service';
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import type { S3ServiceConfig } from '../s3-service-types';

vi.mock('@aws-sdk/client-s3');
vi.mock('@aws-sdk/s3-request-presigner');

describe('S3Service', () => {
  let s3Service: S3Service;
  let sendMock: ReturnType<typeof vi.fn<[unknown], Promise<unknown>>>;
  const testConfig: S3ServiceConfig = {
    region: 'us-east-1',
    bucket: 'test-bucket',
    accessKeyId: 'test-key',
    secretAccessKey: 'test-secret',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    sendMock = vi.fn<[unknown], Promise<unknown>>();

    vi.mocked(S3Client).mockImplementation(
      () => ({ send: sendMock } as unknown as S3Client)
    );

    s3Service = new S3Service(testConfig);
  });

  describe('uploadImageToS3', () => {
    const podcastId = 'podcast-1';
    const episodeId = 'episode-1';
    const imageData = Buffer.from('test-image-data');
    const mimeType = 'image/png';

    it('should successfully upload an image', async () => {
      sendMock.mockResolvedValue({});

      const result = await s3Service.uploadImageToS3(
        podcastId,
        episodeId,
        imageData,
        mimeType
      );

      expect(result.url).toBeDefined();
      expect(result.url).toContain(podcastId);
      expect(result.url).toContain(episodeId);
      expect(result.error).toBeUndefined();
      expect(sendMock).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });

    it('should return error when upload fails', async () => {
      const errorMessage = 'S3 upload failed';
      sendMock.mockRejectedValue(new Error(errorMessage));

      const result = await s3Service.uploadImageToS3(
        podcastId,
        episodeId,
        imageData,
        mimeType
      );

      expect(result.error).toBeDefined();
      expect(result.error).toContain(errorMessage);
      expect(result.url).toBeUndefined();
    });

    it('should handle empty buffer', async () => {
      const emptyBuffer = Buffer.from('');

      const result = await s3Service.uploadImageToS3(
        podcastId,
        episodeId,
        emptyBuffer,
        mimeType
      );

      expect(result).toBeDefined();
    });
  });

  describe('uploadImageToS3 - different mime types', () => {
    const podcastId = 'podcast-1';
    const episodeId = 'episode-1';
    const imageData = Buffer.from('test-image-data');

    it('should handle jpeg mime type', async () => {
      sendMock.mockResolvedValue({});

      const result = await s3Service.uploadImageToS3(
        podcastId,
        episodeId,
        imageData,
        'image/jpeg'
      );

      expect(result.url).toBeDefined();
      expect(result.url).toContain('.jpeg');
    });

    it('should handle png mime type', async () => {
      sendMock.mockResolvedValue({});

      const result = await s3Service.uploadImageToS3(
        podcastId,
        episodeId,
        imageData,
        'image/png'
      );

      expect(result.url).toBeDefined();
      expect(result.url).toContain('.png');
    });
  });

  describe('listEpisodeFiles', () => {
    it('should list files successfully', async () => {
      sendMock.mockResolvedValue({
        Contents: [
          { Key: 'podcast-1/episode-1/audio.mp3', Size: 1000 },
          { Key: 'podcast-1/episode-1/image.png', Size: 500 },
        ],
      });

      const result = await s3Service.listEpisodeFiles('podcast-1', 'episode-1');

      expect(result.files).toHaveLength(2);
      expect(result.error).toBeUndefined();
      expect(sendMock).toHaveBeenCalledWith(expect.any(ListObjectsV2Command));
    });

    it('should handle empty folder', async () => {
      sendMock.mockResolvedValue({
        Contents: [],
      });

      const result = await s3Service.listEpisodeFiles('podcast-1', 'episode-1');

      expect(result.files).toHaveLength(0);
      expect(result.error).toBeUndefined();
    });

    it('should handle list errors', async () => {
      sendMock.mockRejectedValue(new Error('List failed'));

      const result = await s3Service.listEpisodeFiles('podcast-1', 'episode-1');

      expect(result.error).toBeDefined();
      expect(result.files).toEqual([]);
    });
  });

  describe('deleteEpisodeFromS3', () => {
    it('should successfully delete episode folder', async () => {
      sendMock
        .mockResolvedValueOnce({
          Contents: [
            { Key: 'podcast-1/episode-1/file1.mp3' },
            { Key: 'podcast-1/episode-1/file2.png' },
          ],
        })
        .mockResolvedValueOnce({ Deleted: [{ Key: 'file1' }, { Key: 'file2' }] });

      const result = await s3Service.deleteEpisodeFromS3('podcast-1', 'episode-1');

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBeGreaterThan(0);
      expect(sendMock).toHaveBeenCalledWith(expect.any(DeleteObjectsCommand));
    });

    it('should handle empty folder deletion', async () => {
      sendMock.mockResolvedValue({ Contents: [] });

      const result = await s3Service.deleteEpisodeFromS3('podcast-1', 'episode-1');

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(0);
    });
  });
});
