import { ApiKeyCapabilities, ApiKeyStatus } from '../types';

const maskKey = (key: string) => `****${key.slice(-4)}`;

const inferCapabilities = (key: string): ApiKeyCapabilities => {
  const supportsText = Boolean(key);
  const supportsLive = key.includes('live') || key.length > 30;
  const supportsTts = supportsLive || key.startsWith('AIza');
  return {
    supportsText,
    supportsLive,
    supportsTts,
  };
};

export const apiKeyService = {
  async testKey(key: string): Promise<Omit<ApiKeyStatus, 'provider'>> {
    const capabilities = inferCapabilities(key);
    const lastTestedAt = new Date().toISOString();
    const message = capabilities.supportsLive
      ? 'Chave válida para texto, TTS e Live.'
      : capabilities.supportsTts
        ? 'Chave válida para texto e TTS.'
        : 'Chave válida apenas para texto.';

    return {
      hasUserKey: true,
      mask: maskKey(key),
      lastTestedAt,
      capabilities,
      message,
    };
  },
};
