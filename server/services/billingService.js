const billingByUser = new Map();

async function getBillingForUser(userId) {
  return (
    billingByUser.get(userId) || {
      tier: 'free',
      usingPlatformVoice: true,
      minutesRemaining: null,
      renewalDate: null,
    }
  );
}

async function setBillingForUser(userId, payload) {
  const next = { ...(await getBillingForUser(userId)), ...payload };
  billingByUser.set(userId, next);
  return next;
}

async function canUseVoice(userId) {
  const billing = await getBillingForUser(userId);
  return billing.tier !== 'free';
}

module.exports = {
  getBillingForUser,
  setBillingForUser,
  canUseVoice,
};
