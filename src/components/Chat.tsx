import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { Message } from '../types/chat';
import { GeminiService } from '../services/gemini';

interface ChatProps {
  currentFile?: {
    name: string;
    content: string;
  };
  onFileSelect?: (file: { name: string; content: string }) => void;
}

export const Chat: React.FC<ChatProps> = ({ currentFile, onFileSelect }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const newMessage: Message = {
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await GeminiService.getInstance().sendMessage([...messages, newMessage]);
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.relevantDoc && onFileSelect) {
        onFileSelect({
          name: response.relevantDoc.filename,
          content: response.relevantDoc.content
        });
      }

      const assistantMessage: Message = {
        content: response.text + (response.source ? `\n\nFuente: ${response.source}` : ''),
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      const errorMessage: Message = {
        content: 'Lo siento, ha ocurrido un error al procesar tu mensaje.',
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column h-100 w-100">
      <div 
        ref={messagesContainerRef}
        className="flex-grow-1 overflow-auto p-3 w-100"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-3 border-top w-100">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            disabled={isLoading}
          />
          <button 
            className="btn btn-primary" 
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
          >
            {isLoading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <i className="bi bi-send"></i>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}; 