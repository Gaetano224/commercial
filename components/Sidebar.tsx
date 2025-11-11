import React, { useState, useRef, useEffect } from 'react';
import { FileUpload } from './FileUpload';
import { PredefinedPrompts } from './PredefinedPrompts';
import { ChatSession, PredefinedPrompt, Attachment } from '../types';
import { PlusCircleIcon, TrashIcon, ChatBubbleLeftEllipsisIcon, MagnifyingGlassIcon, PencilIcon } from './icons';
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
    <div className="w-80 bg-white p-5 h-full flex flex-col overflow-hidden">
      {/* Chat History Section */}
      <div className="flex-grow flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-1">
            <h2 className="text-sm font-semibold text-[#444444] uppercase tracking-wider">Cronologia Chat</h2>
            <button
                onClick={onCreateNewChat}
                disabled={globalDisabled}
                className="flex items-center gap-1.5 text-xs bg-[#0A2A4A] hover:bg-[#08223F] text-white font-semibold py-1.5 px-2.5 rounded-lg transition-colors disabled:bg-[#0A2A4A]/50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#0A2A4A] focus-visible:ring-offset-1"
                title="Crea una nuova chat"
            >
                <PlusCircleIcon className="w-4 h-4" />
                Nuova
            </button>
        </div>
        
        <div className="relative my-2">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="w-4 h-4 text-[#949494]" />
          </span>
          <input
            type="text"
            placeholder="Cerca nelle chat..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full rounded-lg border border-[#E2E1E0]/80 bg-white py-2 pl-9 pr-3 text-sm text-[#070707] placeholder-[#949494] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A2A4A] focus:border-transparent"
            aria-label="Cerca nelle chat"
          />
        </div>

        <div className="flex-grow overflow-y-auto space-y-1.5 pr-0.5 pb-1">
          {chatSessions.length === 0 && !isInitializing && (
            <p className="text-xs text-[#949494] text-center py-2">
              {searchQuery ? 'Nessuna chat trovata.' : 'Nessuna chat precedente. Inizia una nuova conversazione!'}
            </p>
          )}
          {chatSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => renamingSessionId !== session.id && onSelectChat(session.id)}
              className={`
                group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all
                text-xs font-medium
                ${session.id === activeChatSessionId 
                  ? 'bg-[#0A2A4A] text-white shadow-md' 
                  : 'bg-white hover:bg-[#E2E1E0]/70 border border-[#E2E1E0]/80 text-[#070707] hover:border-[#949494]'}
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2A4A]
              `}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectChat(session.id); }}
              aria-current={session.id === activeChatSessionId ? "page" : undefined}
            >
              <div className="flex items-center flex-grow min-w-0 mr-2">
                <ChatBubbleLeftEllipsisIcon className={`w-4 h-4 mr-2 flex-shrink-0 ${session.id === activeChatSessionId ? 'text-white' : 'text-[#4E5B6F]'}`} />
                {renamingSessionId === session.id ? (
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={tempChatTitle}
                    onChange={(e) => setTempChatTitle(e.target.value)}
                    onBlur={handleConfirmRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleConfirmRename(); }
                      if (e.key === 'Escape') handleCancelRename();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-xs font-medium bg-white border border-[#0A2A4A] rounded-md px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#0A2A4A] text-[#070707]"
                  />
                ) : (
                  <span className="truncate flex-grow" title={session.title} onDoubleClick={() => handleStartRename(session)}>
                    {session.title}
                  </span>
                )}
              </div>
              <div className="flex items-center flex-shrink-0">
                {renamingSessionId !== session.id && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStartRename(session); }}
                      className={`p-1 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed
                        ${session.id === activeChatSessionId 
                          ? 'text-white/70 hover:text-white hover:bg-white/20' 
                          : 'text-[#949494] hover:text-[#0A2A4A] hover:bg-[#0A2A4A]/10'}`}
                      aria-label={`Rinomina chat "${session.title}"`}
                      title="Rinomina chat"
                      disabled={globalDisabled}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => onDeleteChat(session.id, e)}
                      disabled={globalDisabled}
                      className={`ml-1 p-1 rounded-md transition-colors opacity-50 group-hover:opacity-100
                                ${session.id === activeChatSessionId 
                                  ? 'text-white/70 hover:text-white hover:bg-white/20' 
                                  : 'text-[#949494] hover:text-[#EF270A] hover:bg-[#EF270A]/10'}
                                disabled:opacity-30 disabled:cursor-not-allowed`}
                      aria-label={`Elimina chat "${session.title}"`}
                      title="Elimina chat"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Collapsible sections container */}
      <div className="flex-shrink-0 pt-2 border-t border-[#E2E1E0]/80">
        <AccordionSection 
          title="Allega Documento"
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
          title="Domande Rapide" 
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
      
      <div className="mt-auto pt-4">
        <p className="text-xs text-[#949494] text-center">Assistente AI per Commercialisti v1.5</p>
      </div>
    </div>
  );
};