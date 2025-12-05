const profiles = new Map();

async function getProfile(userId) {
  return profiles.get(userId) || null;
}

async function saveProfile(userId, profile) {
  const payload = {
    ...profile,
    id: userId,
    updatedAt: new Date().toISOString(),
  };
  profiles.set(userId, payload);
  return payload;
}

module.exports = {
  getProfile,
  saveProfile,
};
