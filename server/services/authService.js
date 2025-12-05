const sessions = new Map();
const users = new Map();

async function verifyGoogleToken(token) {
  // Stub: in produção valide via Google Identity
  return {
    googleId: token || 'mock-google-id',
    email: 'demo.user@gmail.com',
    name: 'Demo User',
  };
}

async function createOrUpdateUser(googleProfile) {
  const existing = users.get(googleProfile.googleId);
  const user = existing || {
    id: googleProfile.googleId,
    googleId: googleProfile.googleId,
    email: googleProfile.email,
    createdAt: new Date().toISOString(),
  };
  user.updatedAt = new Date().toISOString();
  user.name = googleProfile.name;
  users.set(user.id, user);
  return user;
}

async function createSession(user) {
  const session = {
    sessionId: `sess_${Date.now()}`,
    userId: user.id,
    email: user.email,
    issuedAt: new Date().toISOString(),
  };
  sessions.set(session.sessionId, session);
  return session;
}

async function validateSession(sessionId) {
  return sessions.get(sessionId) || null;
}

module.exports = {
  verifyGoogleToken,
  createOrUpdateUser,
  createSession,
  validateSession,
};
