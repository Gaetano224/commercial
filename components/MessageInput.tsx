
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
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white sticky bottom-0 z-10">
      <div className="max-w-4xl mx-auto flex items-end gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
        <button
          type="button"
          onClick={onAttachFile}
          disabled={disabled}
          className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors hover:bg-white"
          aria-label="Allega file"
          title="Allega documento"
        >
          <PaperClipIcon className="w-5 h-5" />
        </button>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi un messaggio... (Shift+Enter per nuova riga)"
          className="flex-grow bg-transparent border-none focus:ring-0 resize-none text-sm text-gray-900 placeholder-gray-400 min-h-[2.5rem] max-h-40 font-medium"
          rows={1}
          disabled={disabled}
          aria-label="Messaggio da inviare"
        />

        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="flex-shrink-0 p-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-sm active:scale-95"
          aria-label="Invia messaggio"
          title="Invia (Enter)"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};