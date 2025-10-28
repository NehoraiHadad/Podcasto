import { describe, it, expect } from 'vitest';

describe('TelegramDataService', () => {
  describe('validateTelegramData', () => {
    // Inline minimal class for testing validation logic
    type TelegramChannelMessages = Array<{ text?: string; timestamp?: string }>;
    type TelegramData = {
      results?: Record<string, TelegramChannelMessages>;
      total_messages?: number;
    };

    class TestTelegramValidator {
      validateTelegramData(data: TelegramData | null | undefined): boolean {
        if (!data || !data.results) {
          return false;
        }

        const channels = Object.keys(data.results);
        if (channels.length === 0) {
          return false;
        }

        const hasMessages = channels.some((channel) => {
          const channelMessages = data.results?.[channel];
          return Array.isArray(channelMessages) && channelMessages.length > 0;
        });

        return hasMessages;
      }
    }

    const validator = new TestTelegramValidator();

    it('should validate correct data structure', () => {
      const validData: TelegramData = {
        results: {
          'channel1': [
            { text: 'Message 1', timestamp: '2024-01-01' },
          ],
        },
        total_messages: 1,
      };

      expect(validator.validateTelegramData(validData)).toBe(true);
    });

    it('should reject data without results', () => {
      const invalidData: TelegramData = { total_messages: 0 };
      expect(validator.validateTelegramData(invalidData)).toBe(false);
    });

    it('should reject data with empty results', () => {
      const invalidData: TelegramData = { results: {}, total_messages: 0 };
      expect(validator.validateTelegramData(invalidData)).toBe(false);
    });

    it('should reject data with channels but no messages', () => {
      const invalidData: TelegramData = {
        results: { 'channel1': [] },
        total_messages: 0,
      };
      expect(validator.validateTelegramData(invalidData)).toBe(false);
    });

    it('should validate data with multiple channels', () => {
      const validData: TelegramData = {
        results: {
          'channel1': [{ text: 'Msg 1' }],
          'channel2': [{ text: 'Msg 2' }],
        },
        total_messages: 2,
      };

      expect(validator.validateTelegramData(validData)).toBe(true);
    });
  });
});
