import React, { useRef, useEffect } from 'react';
import { ChatSession } from '../types';
import { TrashIcon, PencilIcon, ChatBubbleLeftEllipsisIcon } from './icons';

interface ChatSessionItemProps {
  session: ChatSession;
  isActive: boolean;
  isRenaming: boolean;
  renamingTitle: string;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string, event: React.MouseEvent) => void;
  onStartRename: (session: ChatSession) => void;
  onConfirmRename: () => void;
  onCancelRename: () => void;
  onTitleChange: (title: string) => void;
  disabled?: boolean;
}

export const ChatSessionItem: React.FC<ChatSessionItemProps> = ({
  session,
  isActive,
  isRenaming,
  renamingTitle,
  onSelect,
  onDelete,
  onStartRename,
  onConfirmRename,
  onCancelRename,
  onTitleChange,
  disabled = false,
}) => {
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onConfirmRename();
    } else if (e.key === 'Escape') {
      onCancelRename();
    }
  };

  return (
    <div
      className={`group relative px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
        isActive
          ? 'bg-blue-100 border border-blue-300 shadow-sm'
          : 'hover:bg-gray-100 border border-transparent'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      onClick={() => !disabled && onSelect(session.id)}
    >
      {isRenaming ? (
        <input
          ref={renameInputRef}
          type="text"
          value={renamingTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={onConfirmRename}
          className="w-full px-2 py-1 text-sm font-medium bg-white border border-blue-300 rounded outline-none"
          disabled={disabled}
        />
      ) : (
        <div className="flex items-start gap-2 min-w-0">
          <ChatBubbleLeftEllipsisIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-gray-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-gray-700">
              {session.title}
            </p>
            <p className="text-xs text-gray-500">
              {session.messages.length} messaggi
            </p>
          </div>
        </div>
      )}

      {!isRenaming && (
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartRename(session);
            }}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
            title="Rinomina"
            disabled={disabled}
          >
            <PencilIcon className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.id, e);
            }}
            className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
            title="Elimina"
            disabled={disabled}
          >
            <TrashIcon className="w-3.5 h-3.5 text-red-600" />
          </button>
        </div>
      )}
    </div>
  );
};
