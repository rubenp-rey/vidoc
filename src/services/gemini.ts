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

      console.log("LAST USER MESSAGE:", lastUserMessage)
      // Buscar documentos relevantes
      const relevantDocs = await this.embeddingsService.findMostRelevants(lastUserMessage.content);
      
      // Construir el contexto con los documentos relevantes
      let context = '';
      if (relevantDocs) {
        relevantDocs.map((doc)=>{
          context += `Document context "${doc.metadata.filename}":\n${doc.content}\n\n`;
        })
      }
    
      // Build the complete prompt
      const prompt = 'You are an assistant for a company called Tinybird that answers the user’s questions based on the context provided by documents. You may answer questions using past documents that are no longer passed to you.\n'
        + 'Your response must be in markdown format.' 
        + 'Conversation context: ' + conversationHistory + '\n' 
        + 'User’s question: ' + lastUserMessage.content + '\n'
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
        docProposals: relevantDocs,
      };
    } catch (error) {
      return {
        text: '',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
} 