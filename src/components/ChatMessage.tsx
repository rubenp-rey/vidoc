import React from 'react';
import { Message } from '../types/chat';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`d-flex w-100 ${isUser ? 'justify-content-end' : 'justify-content-start'} mb-3`}>
      <div 
        className={`p-3 rounded-2 min-w-75 ${isUser ? 'bg-primary text-white' : 'border'}`}
        style={{ 
          backgroundColor: isUser ? undefined : '#f8f9fa'
        }}
      >
        {message.content}
        <small className={`d-block mt-1 ${isUser ? 'text-white-50' : 'text-muted'}`}>
          {message.timestamp.toLocaleTimeString()}
        </small>
      </div>
    </div>
  );
}; 