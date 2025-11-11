import { 
  GoogleGenAI, 
  Chat, 
  GenerateContentResponse, 
  Part, 
  Content, 
  GenerateContentParameters 
} from "@google/genai";

import { GEMINI_MODEL_NAME, SYSTEM_INSTRUCTION } from '../constants';
import { 
  ChatMessage, 
  Source, 
  GroundingChunk, 
  GroundingMetadata, 
  GenerateContentResponseStreamChunk as LocalGenerateContentResponseStreamChunk 
} from '../types';


// =========================
// CREA UNA SESSIONE DI CHAT
// =========================
export const createChatSession = (aiInstance: GoogleGenAI, history: Content[] = []): Chat => {
  const systemInstructionText = SYSTEM_INSTRUCTION(new Date());
  
  const chat = aiInstance.chats.create({
    model: GEMINI_MODEL_NAME,
    config: {
      systemInstruction: systemInstructionText,
      tools: [{ googleSearch: {} }],
    },
    history: history
  });

  return chat;
};


// ============================================
// INVIA UN MESSAGGIO CON STREAM E ACCUMULO TESTO
// ============================================
export const sendMessageToGeminiStream = async (
  chat: Chat,
  message: string,
  onChunk: (chunk: LocalGenerateContentResponseStreamChunk) => void,
  onError: (error: Error) => void,
  onComplete: (finishReason?: string) => void
): Promise<void> => {
  try {
    const stream = await chat.sendMessageStream({ message });
    let lastFinishReason: string | undefined;

    for await (const sdkStreamChunk of stream) {
      const text = sdkStreamChunk.text || '';
      const candidates = sdkStreamChunk.candidates;
      
      if (candidates && candidates.length > 0 && candidates[0].finishReason) {
          lastFinishReason = candidates[0].finishReason;
      }

      // Passa il chunk non accumulato. L'accumulo avverrà nel chiamante.
      onChunk({ text, candidates });
    }

    // Una volta completato lo streaming, restituisci solo il motivo della fine
    onComplete(lastFinishReason);

  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    if (error instanceof Error) {
      onError(error);
    } else {
      onError(new Error('An unknown error occurred with Gemini API'));
    }
  }
};


// ==============================
// OTTIENE UN RIASSUNTO DAL MODELLO
// ==============================
export const getSummaryFromGemini = async (
  aiInstance: GoogleGenAI,
  textToSummarize: string
): Promise<string> => {
  const summarizationPrompt = `Sei un assistente AI specializzato nel creare riassunti schematici.
Il tuo compito è prendere il testo fornito e trasformarlo in un riepilogo chiaro, conciso e strutturato.
Utilizza elenchi puntati o numerati per evidenziare i concetti chiave, i passaggi importanti o le informazioni salienti.
Mantieni un linguaggio formale e professionale, coerente con un contesto di commercialisti.
Evita introduzioni o commenti aggiuntivi prima o dopo il riassunto. Produci SOLO il riassunto schematico.

Il testo da riassumere è:
---
${textToSummarize}
---`;

  try {
    const response: GenerateContentResponse = await aiInstance.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: summarizationPrompt,
      config: {
        // Usa le impostazioni di default del modello
      },
    });

    return response.text;

  } catch (error) {
    console.error("Error getting summary from Gemini:", error);
    if (error instanceof Error) {
      throw new Error(`Gemini summarization failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred during summarization with Gemini API');
  }
};