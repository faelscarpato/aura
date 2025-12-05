const gmailTokens = new Map();

async function connect(userId, token = 'mock-gmail-token') {
  gmailTokens.set(userId, { token, lastSync: new Date().toISOString() });
  return gmailTokens.get(userId);
}

async function disconnect(userId) {
  gmailTokens.delete(userId);
}

async function status(userId) {
  return gmailTokens.get(userId) || null;
}

module.exports = {
  connect,
  disconnect,
  status,
};
