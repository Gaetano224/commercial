import React from 'react';
import { LightbulbIcon, InformationCircleIcon, MenuIcon } from './icons';

interface ChatHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  chatTitle?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ isSidebarOpen, onToggleSidebar, chatTitle }) => {
  const appName = "Assistente AI per Commercialisti";

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 backdrop-blur-sm bg-white/95">
      <div className="h-16 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
            aria-label={isSidebarOpen ? "Chiudi sidebar" : "Apri sidebar"}
          >
            <MenuIcon className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
              <LightbulbIcon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-gray-900 truncate" title={chatTitle || appName}>
                {chatTitle ? chatTitle : appName}
              </h1>
              {!chatTitle && (
                <p className="text-xs text-gray-500 hidden sm:block">Analisi documenti e consulenza fiscale</p>
              )}
            </div>
          </div>
        </div>

        <button
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900 ml-2"
          aria-label="Informazioni"
          title="Informazioni sull'applicazione"
          onClick={() => alert("Assistente AI per Commercialisti\n\nSpecializzato in:\n• Analisi di documenti fiscali\n• Consulenza tributaria\n• Quesiti normativi\n• Supporto documentale\n\nPer info: gaetano.mongelli@unisi.it")}
        >
          <InformationCircleIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};