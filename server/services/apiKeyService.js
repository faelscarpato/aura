const keys = new Map();

const capabilitiesFromKey = (key) => {
  const supportsText = Boolean(key);
  const supportsLive = key && key.length > 30;
  const supportsTts = supportsLive || key.startsWith('AIza');
  return { supportsText, supportsTts, supportsLive };
};

async function saveUserKey(userId, key) {
  const capabilities = capabilitiesFromKey(key);
  const entry = {
    mask: `****${key.slice(-4)}`,
    capabilities,
    createdAt: new Date().toISOString(),
  };
  keys.set(userId, entry);
  return entry;
}

async function getUserKeyMeta(userId) {
  return keys.get(userId) || null;
}

module.exports = {
  saveUserKey,
  getUserKeyMeta,
};
