import { DocumentEmbedding } from "@/services/embeddings";

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  docProposals: DocumentEmbedding[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface ChatResponse {
  text: string;
  error?: string;
  docProposals?: DocumentEmbedding[];
} 