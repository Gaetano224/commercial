
import React, { useState } from 'react';
import { PaperAirplaneIcon, PaperClipIcon } from './icons';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onAttachFile: () => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onAttachFile, disabled }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-[#E2E1E0] bg-white sticky bottom-0 z-10">
      <div className="flex items-end bg-white border border-[#949494]/80 rounded-xl p-1 focus-within:ring-2 focus-within:ring-[#0A2A4A] focus-within:border-[#0A2A4A] shadow-sm">
        <button
          type="button"
          onClick={onAttachFile}
          disabled={disabled}
          className="p-2.5 text-[#4E5B6F] hover:text-[#0A2A4A] rounded-lg disabled:text-[#949494] disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#0A2A4A]"
          aria-label="Allega file"
        >
          <PaperClipIcon className="w-5 h-5" />
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi un messaggio..."
          className="flex-grow p-2.5 bg-transparent border-none focus:ring-0 resize-none text-sm text-[#070707] placeholder-[#949494] min-h-[2.75em] max-h-40"
          rows={1}
          disabled={disabled}
          aria-label="Messaggio da inviare"
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="ml-2 p-2.5 bg-[#0A2A4A] hover:bg-[#08223F] text-white rounded-lg disabled:bg-[#0A2A4A]/50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#0A2A4A]"
          aria-label="Invia messaggio"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};