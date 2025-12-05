import { UserProfile } from '../types';

const STORAGE_PREFIX = 'jarvis-profile-';

export const userProfileService = {
  async fetchProfile(userId: string): Promise<UserProfile | null> {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  },
  async saveProfile(userId: string, profile: UserProfile): Promise<UserProfile> {
    const payload = { ...profile, id: userId, updatedAt: new Date().toISOString() };
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(payload));
    return payload;
  },
};
