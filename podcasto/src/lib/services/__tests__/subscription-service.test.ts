import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionService } from '../subscriptions';
import type { Subscription } from '@/lib/db/api/subscriptions';
import type { Profile } from '@/lib/db/api/profiles';
import * as dbApi from '@/lib/db/api';

vi.mock('@/lib/db/api', () => ({
  subscriptionsApi: {
    getUserSubscriptions: vi.fn(),
    createSubscription: vi.fn(),
    deleteSubscription: vi.fn(),
  },
  profilesApi: {
    getProfileById: vi.fn(),
    updateEmailNotifications: vi.fn(),
    createProfile: vi.fn(),
  },
}));

const subscriptionsApi = dbApi.subscriptionsApi as {
  getUserSubscriptions: ReturnType<typeof vi.fn>;
  createSubscription: ReturnType<typeof vi.fn>;
  deleteSubscription: ReturnType<typeof vi.fn>;
};

const profilesApi = dbApi.profilesApi as {
  getProfileById: ReturnType<typeof vi.fn>;
  updateEmailNotifications: ReturnType<typeof vi.fn>;
  createProfile: ReturnType<typeof vi.fn>;
};

function createSubscriptionRecord(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub-1',
    user_id: 'user-1',
    podcast_id: 'podcast-1',
    email_notifications: true,
    language_preference: null,
    created_at: new Date(),
    ...overrides,
  } as Subscription;
}

function createProfileRecord(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'user-1',
    display_name: null,
    email_notifications: true,
    has_seen_welcome: false,
    unsubscribe_token: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  } as Profile;
}

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  beforeEach(() => {
    service = new SubscriptionService();
    vi.resetAllMocks();
    subscriptionsApi.getUserSubscriptions.mockResolvedValue([]);
    subscriptionsApi.createSubscription.mockResolvedValue(createSubscriptionRecord());
    subscriptionsApi.deleteSubscription.mockResolvedValue(true);
    profilesApi.getProfileById.mockResolvedValue(createProfileRecord());
    profilesApi.updateEmailNotifications.mockResolvedValue(createProfileRecord());
  });

  describe('subscribe', () => {
    it('creates a new subscription when none exists', async () => {
      const newSubscription = createSubscriptionRecord();

      subscriptionsApi.getUserSubscriptions.mockResolvedValue([]);
      subscriptionsApi.createSubscription.mockResolvedValue(newSubscription);

      const result = await service.subscribe('user-1', 'podcast-1');

      expect(result.success).toBe(true);
      expect(result.success && result.data).toEqual(newSubscription);
      expect(subscriptionsApi.createSubscription).toHaveBeenCalledWith({
        user_id: 'user-1',
        podcast_id: 'podcast-1',
      });
    });

    it('returns existing subscription if already subscribed', async () => {
      const existingSubscription = createSubscriptionRecord();

      subscriptionsApi.getUserSubscriptions.mockResolvedValue([existingSubscription]);

      const result = await service.subscribe('user-1', 'podcast-1');

      expect(result.success).toBe(true);
      expect(result.success && result.data).toEqual(existingSubscription);
      expect(subscriptionsApi.createSubscription).not.toHaveBeenCalled();
    });

    it('returns failure when creation throws', async () => {
      subscriptionsApi.getUserSubscriptions.mockResolvedValue([]);
      subscriptionsApi.createSubscription.mockRejectedValue(new Error('db error'));

      const result = await service.subscribe('user-1', 'podcast-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('db error');
      }
    });
  });

  describe('unsubscribe', () => {
    it('removes existing subscription', async () => {
      const existingSubscription = createSubscriptionRecord();

      subscriptionsApi.getUserSubscriptions.mockResolvedValue([existingSubscription]);
      subscriptionsApi.deleteSubscription.mockResolvedValue(true);

      const result = await service.unsubscribe('user-1', 'podcast-1');

      expect(result.success).toBe(true);
      expect(subscriptionsApi.deleteSubscription).toHaveBeenCalledWith('sub-1');
    });

    it('returns failure when subscription not found', async () => {
      subscriptionsApi.getUserSubscriptions.mockResolvedValue([]);

      const result = await service.unsubscribe('user-1', 'podcast-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Subscription not found');
      }
    });

    it('returns failure when deletion fails', async () => {
      const existingSubscription = createSubscriptionRecord();

      subscriptionsApi.getUserSubscriptions.mockResolvedValue([existingSubscription]);
      subscriptionsApi.deleteSubscription.mockResolvedValue(false);

      const result = await service.unsubscribe('user-1', 'podcast-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Failed to delete subscription');
      }
    });
  });

  describe('toggleSubscription', () => {
    it('subscribes when no subscription exists', async () => {
      const createdSubscription = createSubscriptionRecord();

      subscriptionsApi.getUserSubscriptions.mockResolvedValueOnce([]);
      subscriptionsApi.createSubscription.mockResolvedValue(createdSubscription);

      const result = await service.toggleSubscription('user-1', 'podcast-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ isSubscribed: true });
      }
    });

    it('unsubscribes when subscription exists', async () => {
      const existingSubscription = createSubscriptionRecord();

      subscriptionsApi.getUserSubscriptions
        .mockResolvedValueOnce([existingSubscription])
        .mockResolvedValueOnce([existingSubscription]);
      subscriptionsApi.deleteSubscription.mockResolvedValue(true);

      const result = await service.toggleSubscription('user-1', 'podcast-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ isSubscribed: false });
      }
    });

    it('returns failure when subscription creation fails', async () => {
      subscriptionsApi.getUserSubscriptions.mockResolvedValueOnce([]);
      subscriptionsApi.createSubscription.mockRejectedValue(new Error('create failure'));

      const result = await service.toggleSubscription('user-1', 'podcast-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('create failure');
      }
    });

    it('returns failure when unsubscribe operation fails', async () => {
      const existingSubscription = createSubscriptionRecord();

      subscriptionsApi.getUserSubscriptions.mockResolvedValueOnce([existingSubscription]);
      subscriptionsApi.deleteSubscription.mockResolvedValue(false);

      const result = await service.toggleSubscription('user-1', 'podcast-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Failed to delete subscription');
      }
    });
  });

  describe('getEmailNotificationPreference', () => {
    it('returns preference when profile exists', async () => {
      profilesApi.getProfileById.mockResolvedValue(
        createProfileRecord({ email_notifications: false })
      );

      const result = await service.getEmailNotificationPreference('user-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });

    it('defaults to true when profile missing', async () => {
      profilesApi.getProfileById.mockResolvedValue(null);

      const result = await service.getEmailNotificationPreference('user-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('returns failure when API throws', async () => {
      profilesApi.getProfileById.mockRejectedValue(new Error('fetch error'));

      const result = await service.getEmailNotificationPreference('user-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('fetch error');
      }
    });
  });

  describe('updateEmailNotificationPreference', () => {
    it('updates existing profile', async () => {
      profilesApi.getProfileById.mockResolvedValue(createProfileRecord());
      profilesApi.updateEmailNotifications.mockResolvedValue(
        createProfileRecord({ email_notifications: false })
      );

      const result = await service.updateEmailNotificationPreference('user-1', false);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
      expect(profilesApi.updateEmailNotifications).toHaveBeenCalledWith('user-1', false);
    });

    it('creates profile when missing', async () => {
      profilesApi.getProfileById.mockResolvedValue(null);
      profilesApi.createProfile.mockResolvedValue(
        createProfileRecord({ email_notifications: false })
      );

      const result = await service.updateEmailNotificationPreference('user-1', false);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
      expect(profilesApi.createProfile).toHaveBeenCalledWith({
        id: 'user-1',
        email_notifications: false,
      });
    });

    it('returns failure when update fails', async () => {
      profilesApi.getProfileById.mockResolvedValue(createProfileRecord());
      profilesApi.updateEmailNotifications.mockResolvedValue(null);

      const result = await service.updateEmailNotificationPreference('user-1', true);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Profile not found');
      }
    });

    it('returns failure when API throws', async () => {
      profilesApi.getProfileById.mockRejectedValue(new Error('update error'));

      const result = await service.updateEmailNotificationPreference('user-1', true);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('update error');
      }
    });
  });
});
