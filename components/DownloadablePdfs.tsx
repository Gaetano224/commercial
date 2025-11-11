
import React from 'react';
import { ExtractedPdfLink } from '../types';
import { DocumentTextIcon as PdfIcon, ArrowDownTrayIcon as DownloadIcon } from './icons'; // Assuming ArrowDownTrayIcon exists or can be added

interface DownloadablePdfsProps {
  pdfs: ExtractedPdfLink[];
}

export const DownloadablePdfs: React.FC<DownloadablePdfsProps> = ({ pdfs }) => {
  if (!pdfs || pdfs.length === 0) {
    return null;
  }

  return (
    <div className="mt-2.5 mb-1.5 px-1 py-2 border-t border-b border-[#E2E1E0]/70">
      <h4 className="text-xs font-semibold text-[#444444] mb-1.5 px-0.5">Documenti PDF Allegati:</h4>
      <ul className="space-y-1.5 max-h-32 overflow-y-auto">
        {pdfs.map((pdf, index) => (
          <li key={index}>
            <a
              href={pdf.url}
              target="_blank"
              rel="noopener noreferrer"
              download={pdf.fileName} // Suggest filename for download
              className="flex items-center text-xs text-[#0A2A4A] hover:text-[#08223F] hover:underline bg-white p-1.5 rounded-md border border-[#E2E1E0]/80 hover:border-[#949494] transition-all group"
              title={`Scarica o visualizza: ${pdf.fileName}`}
            >
              <PdfIcon className="w-3.5 h-3.5 mr-2 flex-shrink-0 text-[#0A2A4A]/80" />
              <span className="truncate flex-grow" style={{ maxWidth: 'calc(100% - 3rem)' }}>{pdf.title}</span>
              <DownloadIcon className="w-3.5 h-3.5 ml-1.5 flex-shrink-0 text-[#4E5B6F] group-hover:text-[#0A2A4A] transition-colors" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
