import { GoogleGenAI } from '@google/genai';
import { blobToBase64 } from '../utils/fileUtils';

export const visionService = {
  async analyzeFile(apiKey: string, file: File, prompt?: string) {
    const ai = new GoogleGenAI({ apiKey });
    const base64Data = await blobToBase64(file);
    const mimeType = file.type;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            {
              text: prompt || (file.type.startsWith('video') 
                ? 'Assista a este vídeo e descreva detalhadamente o que acontece, cronologicamente se possível.'
                : 'Analise esta imagem em detalhes. Descreva o que você vê, objetos, textos e o contexto geral.')
            }
          ],
        },
      ],
    });

    return response.text;
  }
};
