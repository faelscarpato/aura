const calendarTokens = new Map();

async function connect(userId, token = 'mock-calendar-token') {
  calendarTokens.set(userId, { token, lastSync: new Date().toISOString() });
  return calendarTokens.get(userId);
}

async function disconnect(userId) {
  calendarTokens.delete(userId);
}

async function status(userId) {
  return calendarTokens.get(userId) || null;
}

module.exports = {
  connect,
  disconnect,
  status,
};
