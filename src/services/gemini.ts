import { Message, ChatResponse } from '../types/chat';
import { EmbeddingsService } from './embeddings';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export class GeminiService {
  private static instance: GeminiService;
  private apiKey: string;
  private embeddingsService: EmbeddingsService;

  private constructor() {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno');
    }
    this.apiKey = GEMINI_API_KEY;
    this.embeddingsService = EmbeddingsService.getInstance();
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  public async sendMessage(messages: Message[]): Promise<ChatResponse> {
    try {

      //Cogemos el ultimo mensaje del user
      const lastUserMessage = messages[messages.length - 1]

      //Historial de conversación
      let conversationHistory = ''
      messages.map((message)=> {
        if(message.role === 'assistant'){
          conversationHistory += 'Asistente: ' + message.content
        }else{
          conversationHistory += 'Usuario: ' + message.content
        }
      })

      // Buscar documentos relevantes
      const relevantDoc = await this.embeddingsService.search(lastUserMessage.content);
      
      // Construir el contexto con los documentos relevantes
      let context = '';
      if (relevantDoc) {
        context = 'Basado en los siguientes documentos:\n\n';
        context += `Documento "${relevantDoc.metadata.filename}":\n${relevantDoc.content}\n\n`;
      }

      // Construir el prompt completo
      const prompt = 'Eres un asistente que responde basándose en el contexto proporcionado por documetnos. Tu formato de respuesa debe estar bien formateado y no debe contener caracteres especiales como *, #, etc. Utiliza saltos de linea para separar las ideas.' 
        + 'Historial de conversación: ' + conversationHistory + '\n' 
        + context;
        
      console.log(prompt);

      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Error en la API: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        text: data.candidates[0].content.parts[0].text,
        source: relevantDoc?.metadata.filename,
        relevantDoc: relevantDoc ? {
          filename: relevantDoc.metadata.filename,
          content: relevantDoc.content
        } : undefined
      };
    } catch (error) {
      return {
        text: '',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
} 