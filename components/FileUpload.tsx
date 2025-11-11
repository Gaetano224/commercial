import React from 'react';
import { DocumentTextIcon, ArrowPathIcon as LoadingIcon, InformationCircleIcon as ErrorIcon, SparklesIcon } from './icons';
import { ACCEPTED_EXTENSIONS_STRING } from '../services/fileParser';
import { Attachment } from '../types';

interface FileUploadProps {
  attachments: Attachment[];
  onSelectFile: () => void;
  onClearAllFiles: () => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  attachments,
  onSelectFile,
  onClearAllFiles,
  disabled,
}) => {
  const isProcessing = attachments.some(att => att.status === 'parsing' || att.status === 'ocr');
  const readyCount = attachments.filter(att => att.status === 'ready').length;
  const errorCount = attachments.filter(att => att.status === 'error').length;

  const effectiveDisabled = disabled || isProcessing;
  const buttonText = isProcessing ? 'Elaborazione...' : (attachments.length > 0 ? 'Aggiungi File' : 'Seleziona File');

  return (
    <div className="bg-white p-4 border border-[#E2E1E0]/80 rounded-xl space-y-3.5 shadow-sm">
      <button
        id="file-upload-button-label"
        onClick={onSelectFile}
        disabled={effectiveDisabled}
        className="w-full flex items-center justify-center gap-2.5 bg-[#0A2A4A] hover:bg-[#08223F] text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors disabled:bg-[#0A2A4A]/50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#0A2A4A] focus-visible:ring-offset-2"
        aria-label={`Seleziona file (${ACCEPTED_EXTENSIONS_STRING})`}
      >
        <DocumentTextIcon className="w-5 h-5" />
        {buttonText}
      </button>

      {isProcessing && (
        <div className="flex items-center justify-center text-sm text-[#444444] p-3 bg-[#E2E1E0] rounded-lg">
          <LoadingIcon className="w-4 h-4 mr-2.5 animate-spin text-[#0A2A4A]" />
          <span>Analisi file in corso...</span>
        </div>
      )}

      {attachments.length > 0 && !isProcessing && (
         <div className="p-3 bg-white border border-[#0A2A4A]/60 text-[#0A2A4A] rounded-lg text-xs flex flex-col gap-1.5">
          {readyCount > 0 && 
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 flex-shrink-0" />
              <span><strong>{readyCount}</strong> file pronti per l'analisi.</span>
            </div>
          }
          {errorCount > 0 &&
            <div className="flex items-center gap-2 text-[#EF270A]">
              <ErrorIcon className="w-4 h-4 flex-shrink-0" />
              <span><strong>{errorCount}</strong> file con errori.</span>
            </div>
          }
        </div>
      )}
      
      {attachments.length > 0 && (
          <button
              onClick={onClearAllFiles}
              disabled={disabled || isProcessing}
              className="w-full bg-[#E2E1E0] hover:bg-[#D1D1D0] text-[#070707] font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#949494] focus-visible:ring-offset-1"
          >
              Rimuovi Tutti i File
          </button>
      )}
      
      {attachments.length === 0 && !isProcessing && (
           <p className="text-xs text-[#444444]/90 text-center pt-1.5">Nessun file caricato. Tipi supportati: {ACCEPTED_EXTENSIONS_STRING}</p>
      )}
    </div>
  );
};