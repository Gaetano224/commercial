

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
    <div className="flex-grow overflow-y-auto bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
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
    </div>
  );
};