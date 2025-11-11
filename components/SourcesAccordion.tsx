
import React, { useState } from 'react';
import { Source } from '../types';
import { ChevronDownIcon, DocumentTextIcon } from './icons';

interface SourcesAccordionProps {
  sources: Source[];
}

export const SourcesAccordion: React.FC<SourcesAccordionProps> = ({ sources }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full py-1 px-1 text-[#444444] hover:text-[#0A2A4A] rounded focus:outline-none"
        aria-expanded={isOpen}
      >
        <span className="flex items-center font-medium">
            <DocumentTextIcon className="w-3.5 h-3.5 mr-1.5 text-[#949494]"/>
            Fonti ({sources.length})
        </span>
        <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <ul className="mt-1.5 space-y-1 pl-2 pr-1 max-h-28 overflow-y-auto border-l-2 border-[#E2E1E0]">
          {sources.map((source, index) => (
            <li key={index} className="text-xs">
              <a
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0A2A4A] hover:text-[#08223F] hover:underline break-all group flex items-start gap-1.5"
                title={source.uri}
              >
                <span className="font-medium text-[#444444]">{index + 1}.</span>
                <span className="flex-1">{source.title || source.uri}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};