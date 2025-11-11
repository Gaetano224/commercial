import React from 'react';
import { LightbulbIcon, InformationCircleIcon, Bars3Icon } from './icons';

interface ChatHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  chatTitle?: string; // Optional: to display the current chat's title
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ isSidebarOpen, onToggleSidebar, chatTitle }) => {
  const appName = "Assistente AI per Commercialisti";
  return (
    <div className="p-4 border-b border-[#E2E1E0] bg-white sticky top-0 z-20 h-16 flex items-center">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <div className="p-1.5 bg-[#0A2A4A] rounded-lg mr-3 shadow">
             <LightbulbIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#070707] truncate max-w-xs sm:max-w-md md:max-w-lg" title={chatTitle || appName}>
              {chatTitle ? `Chat: ${chatTitle}` : appName}
            </h1>
          </div>
        </div>
        <button 
          className="text-[#444444] hover:text-[#070707] p-2 rounded-full hover:bg-[#E2E1E0] transition-colors"
          aria-label="Informazioni sull'applicazione"
          onClick={() => alert("Assistente AI per Commercialisti\nUn'intelligenza artificiale specializzata nel supportare i commercialisti con analisi di documenti, risposte a quesiti fiscali e legali, e ricerche normative.\nPer info: gaetano.mongelli@unisi.it, mario.caronna@unisi.it")}
        >
          <InformationCircleIcon className="w-6 h-6"/>
        </button>
      </div>
    </div>
  );
};