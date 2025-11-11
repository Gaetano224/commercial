import React, { useState, useRef, useEffect } from 'react';
import { FileUpload } from './FileUpload';
import { PredefinedPrompts } from './PredefinedPrompts';
import { ChatSessionItem } from './ChatSessionItem';
import { ChatSession, PredefinedPrompt, Attachment } from '../types';
import { PlusCircleIcon, MagnifyingGlassIcon, XMarkIcon } from './icons';
import { AccordionSection } from './AccordionSection';

interface SidebarProps {
  chatSessions: ChatSession[];
  activeChatSessionId: string | null;
  onCreateNewChat: () => void;
  onSelectChat: (sessionId: string) => void;
  onDeleteChat: (sessionId: string, event: React.MouseEvent) => void;
  onRenameChat: (sessionId: string, newTitle: string) => void;

  onPromptSelect: (promptText: string, promptTitle: string) => void;
  predefinedPrompts: PredefinedPrompt[];
  
  attachments: Attachment[];
  onSelectFile: () => void;
  onClearAllFiles: () => void;
  
  isStreaming: boolean;
  isInitializing: boolean;
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chatSessions,
  activeChatSessionId,
  onCreateNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onPromptSelect,
  predefinedPrompts,
  attachments,
  onSelectFile,
  onClearAllFiles,
  isStreaming,
  isInitializing,
  onToggleSidebar,
  searchQuery,
  onSearchQueryChange,
}) => {
  const isParsingFile = attachments.some(att => att.status === 'parsing');
  const globalDisabled = isStreaming || isInitializing || isParsingFile;
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(true);
  const [isPromptsOpen, setIsPromptsOpen] = useState(false);
  
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [tempChatTitle, setTempChatTitle] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingSessionId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingSessionId]);

  const handleStartRename = (session: ChatSession) => {
    if (globalDisabled) return;
    setRenamingSessionId(session.id);
    setTempChatTitle(session.title);
  };

  const handleCancelRename = () => {
    setRenamingSessionId(null);
    setTempChatTitle('');
  };
  
  const handleConfirmRename = () => {
    if (renamingSessionId && tempChatTitle.trim()) {
      onRenameChat(renamingSessionId, tempChatTitle.trim());
    }
    handleCancelRename();
  };


  return (
    <aside className="w-80 bg-white h-full flex flex-col border-r border-gray-200 shadow-sm">
      <div className="flex-1 flex flex-col overflow-hidden p-4">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Chat History</h2>
          <button
            onClick={onCreateNewChat}
            disabled={globalDisabled}
            className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-1.5 px-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            title="Crea una nuova chat"
            aria-label="Nuova chat"
          >
            <PlusCircleIcon className="w-4 h-4" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>

        <div className="relative mb-3">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            aria-label="Search chats"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {chatSessions.length === 0 && !isInitializing && (
            <p className="text-xs text-gray-500 text-center py-4">
              {searchQuery ? 'No chats found.' : 'Start a new conversation'}
            </p>
          )}
          {chatSessions.map((session) => (
            <ChatSessionItem
              key={session.id}
              session={session}
              isActive={session.id === activeChatSessionId}
              isRenaming={renamingSessionId === session.id}
              renamingTitle={tempChatTitle}
              onSelect={onSelectChat}
              onDelete={onDeleteChat}
              onStartRename={handleStartRename}
              onConfirmRename={handleConfirmRename}
              onCancelRename={handleCancelRename}
              onTitleChange={setTempChatTitle}
              disabled={globalDisabled}
            />
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-gray-200 p-4 space-y-3">
        <AccordionSection
          title="Upload Document"
          isOpen={isFileUploadOpen}
          onToggle={() => setIsFileUploadOpen(!isFileUploadOpen)}
        >
          <FileUpload
            attachments={attachments}
            onSelectFile={onSelectFile}
            onClearAllFiles={onClearAllFiles}
            disabled={globalDisabled}
          />
        </AccordionSection>

        <AccordionSection
          title="Quick Questions"
          isOpen={isPromptsOpen}
          onToggle={() => setIsPromptsOpen(!isPromptsOpen)}
        >
          <PredefinedPrompts
            prompts={predefinedPrompts}
            onSelect={onPromptSelect}
            hasFileContent={attachments.some(a => a.status === 'ready')}
            disabled={globalDisabled || !activeChatSessionId}
          />
        </AccordionSection>
      </div>

      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">Assistente AI v2.0</p>
      </div>
    </aside>
  );
};