const newsTokens = new Map();

async function connect(userId, token = 'mock-news-token') {
  newsTokens.set(userId, { token, lastSync: new Date().toISOString() });
  return newsTokens.get(userId);
}

async function disconnect(userId) {
  newsTokens.delete(userId);
}

async function status(userId) {
  return newsTokens.get(userId) || null;
}

module.exports = {
  connect,
  disconnect,
  status,
};
