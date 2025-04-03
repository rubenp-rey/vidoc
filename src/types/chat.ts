export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface ChatResponse {
  text: string;
  error?: string;
  source?: string;
  relevantDoc?: {
    filename: string;
    content: string;
  };
} 