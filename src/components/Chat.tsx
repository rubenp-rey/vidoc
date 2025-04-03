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
        content: response.text,
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
    <div className="d-flex flex-column h-100 w-100 flex-grow-1">
      <div 
        ref={messagesContainerRef}
        className="d-flex flex-column flex-grow-1 overflow-auto p-3 w-100"
      >
        {messages.length === 0 ? 
          <div className="d-flex justify-content-center align-items-center flex-grow-1">
            <img className="w-50 opacity-75" src={'./src/assets/askme.png'} />
          </div>
        :
          <div className="w-100">
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        }
      </div>
      <form onSubmit={handleSubmit} className="p-3 border-top w-100">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Write your question..."
            disabled={isLoading}
          />
          <button 
            className="btn btn-primary" 
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            style={{ backgroundColor: '#FFD5C2', color: 'black', border: 'none' }}
          >
            {isLoading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <i className="bi bi-send" style={{fontSize: '1.2rem'}}></i>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}; 