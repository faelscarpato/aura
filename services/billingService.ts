import { BillingStatus } from '../types';

const BILLING_STORAGE = 'aura-billing';

export const billingService = {
  async getStatus(): Promise<BillingStatus> {
    const raw = localStorage.getItem(BILLING_STORAGE);
    if (!raw) {
      return {
        tier: 'free',
        usingPlatformVoice: true,
      };
    }
    try {
      return JSON.parse(raw) as BillingStatus;
    } catch {
      return {
        tier: 'free',
        usingPlatformVoice: true,
      };
    }
  },
  async saveStatus(status: BillingStatus): Promise<BillingStatus> {
    localStorage.setItem(BILLING_STORAGE, JSON.stringify(status));
    return status;
  },
};
