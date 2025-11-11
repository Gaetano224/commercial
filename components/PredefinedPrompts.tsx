
import React from 'react';
import { PredefinedPrompt } from '../types';
import { SparklesIcon } from './icons'; 

interface PredefinedPromptsProps {
  prompts: PredefinedPrompt[];
  onSelect: (promptText: string, promptTitle: string) => void;
  hasFileContent: boolean;
  disabled?: boolean;
}

export const PredefinedPrompts: React.FC<PredefinedPromptsProps> = ({ prompts, onSelect, hasFileContent, disabled }) => {
  return (
    <div className="flex-grow flex flex-col min-h-0">
      <h2 className="text-sm font-semibold text-[#444444] uppercase tracking-wider mb-2.5">Domande rapide sul Documento</h2>
      {!hasFileContent && (
        <div className="bg-[#E2E1E0] border border-[#949494]/70 text-[#444444] px-3.5 py-2.5 rounded-lg text-xs mb-3 shadow-sm">
          Per utilizzare queste domande, è necessario caricare prima un file.
        </div>
      )}
      <div className="space-y-2 overflow-y-auto flex-grow pr-0.5 pb-1">
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => onSelect(prompt.prompt, prompt.title)}
            disabled={!hasFileContent || disabled}
            className="w-full text-left bg-white hover:bg-[#E2E1E0]/70 border border-[#E2E1E0]/80 text-[#070707] font-medium py-2.5 px-3.5 rounded-lg text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2A4A] focus-visible:border-[#0A2A4A] disabled:opacity-60 disabled:bg-[#E2E1E0] disabled:cursor-not-allowed disabled:hover:bg-[#E2E1E0] shadow-sm hover:shadow-md hover:border-[#949494]"
          >
            <div className="flex items-center">
              <SparklesIcon className="w-4 h-4 mr-2.5 text-[#0A2A4A] flex-shrink-0" />
              <span className="text-xs sm:text-sm leading-snug">{prompt.title}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
