import React from 'react';
import { Message } from '../types/chat';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`d-flex w-100 ${isUser ? 'justify-content-end' : 'justify-content-start'} mb-3`}>
      <div 
        className={`p-3 rounded-2 min-w-75 ${isUser ? 'text-black' : 'border'}`}
        style={{ 
          backgroundColor: isUser ? '#FFD5C2' : '#f8f9fa',
          border: isUser ? 'none' : '1px solid #ccc',
          fontSize:'1rem',
          fontWeight:'400',
        }}
      >
        <ReactMarkdown>{message.content}</ReactMarkdown>
        {message.docProposals.length > 0 &&
          <div className="m-2 d-flex gap-3">
            {message.docProposals.map((doc, index)=>
              <div 
                key={index} 
                className="" 
                style={{padding:'0.4rem', backgroundColor:'#FFD5C2', fontSize:'0.7rem', color:'#1F271B', borderWidth:'0', borderRadius:'0.4rem', fontWeight:'600'}}
                >
                {doc.metadata.filename}
              </div>
            )}
          </div>
        }
        <small className={`d-block fw-light`} style={{fontSize:'0.7rem'}}>
          {message.timestamp.toLocaleTimeString()}
        </small>
      </div>
    </div>
  );
}; 