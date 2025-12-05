const keepTokens = new Map();

async function connect(userId, token = 'mock-keep-token') {
  keepTokens.set(userId, { token, lastSync: new Date().toISOString() });
  return keepTokens.get(userId);
}

async function disconnect(userId) {
  keepTokens.delete(userId);
}

async function status(userId) {
  return keepTokens.get(userId) || null;
}

module.exports = {
  connect,
  disconnect,
  status,
};
