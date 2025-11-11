

import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { ChatMessageItem } from './ChatMessageItem';

interface MessageListProps {
  messages: ChatMessage[];
  streamingBotMessageId?: string; 
  onSummarize?: (messageId: string, textToSummarize: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, streamingBotMessageId, onSummarize }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, streamingBotMessageId]);

  return (
    <div className="flex-grow p-4 sm:p-6 space-y-5 overflow-y-auto"> {/* Increased spacing */}
      {messages.map((msg) => (
        <ChatMessageItem 
          key={msg.id} 
          message={msg} 
          isBotCurrentlyStreaming={msg.role === 'model' && msg.id === streamingBotMessageId}
          onSummarize={onSummarize}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};