import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/build/pdf.mjs';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import Tesseract from 'tesseract.js';
import { Attachment } from '../types';

// This is a global setting for pdf.js worker. It's safe to set it here.
GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

const ACCEPTED_MIME_TYPES = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  jpg: 'image/jpeg',
  png: 'image/png',
};

export const ACCEPTED_EXTENSIONS_STRING = ".pdf, .docx, .doc, .xlsx, .xls, .jpg, .jpeg, .png";

export interface ParsedFile {
    content: string;
    fileTypeHint: string;
}

export const parseFile = async (
    file: File,
    progressCallback: (progressUpdate: Partial<Attachment>) => void
): Promise<ParsedFile> => {
    const fileType = file.type;
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

    const arrayBuffer = await file.arrayBuffer();
    let extractedText = '';
    let fileTypeHint = fileExtension;

    // ==========================================================
    // PDF Parsing (Hybrid: Text Extraction + OCR on each page)
    // ==========================================================
    if (fileType === ACCEPTED_MIME_TYPES.pdf || fileExtension === 'pdf') {
        fileTypeHint = 'pdf';
        progressCallback({ status: 'ocr', statusMessage: 'Caricamento PDF...', ocrProgress: 0 });
        
        const pdfDocProxy = await getDocument({ data: arrayBuffer }).promise;
        const numPages = pdfDocProxy.numPages;
        let combinedText = '';

        const tesseractWorker = await Tesseract.createWorker('ita', 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const pageProgress = (m.progress || 0);
                    // The progress is updated per-page, so we need to calculate the overall progress.
                    // This part of the Tesseract logger is complex to map to overall progress, so we will primarily update on page completion.
                }
            }
        });

        for (let i = 1; i <= numPages; i++) {
            const pageProgress = Math.round((i / numPages) * 100);
            progressCallback({ statusMessage: `Analisi OCR (Pagina ${i}/${numPages})...`, ocrProgress: pageProgress });

            const page = await pdfDocProxy.getPage(i);
            
            // 1. Standard Text Extraction
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => (item as any).str || '').join(' ');
            if (pageText.trim()) {
                combinedText += `--- Pagina ${i} (Testo Estratto) ---\n${pageText}\n\n`;
            }

            // 2. OCR Extraction
            const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR accuracy
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                const { data: { text: ocrText } } = await tesseractWorker.recognize(canvas);
                if (ocrText.trim()) {
                   combinedText += `--- Pagina ${i} (Testo da Immagine/OCR) ---\n${ocrText}\n\n`;
                }
            }
            page.cleanup(); // Cleanup resources
        }

        await tesseractWorker.terminate();
        progressCallback({ statusMessage: 'Analisi completata.', ocrProgress: 100 });
        
        return { content: combinedText.trim(), fileTypeHint };
    }
    
    // =============================
    // Image Parsing (OCR)
    // =============================
    if (fileType.startsWith('image/')) {
        fileTypeHint = 'image';
        progressCallback({ status: 'ocr', statusMessage: 'Riconoscimento testo...', ocrProgress: 0 });
        
        const { data: { text } } = await Tesseract.recognize(
            file,
            'ita', // Italian language
            { 
              logger: m => {
                if (m.status === 'recognizing text') {
                    progressCallback({ ocrProgress: Math.round(m.progress * 100) });
                }
              }
            }
        );
        
        progressCallback({ statusMessage: 'Analisi completata.', ocrProgress: 100 });
        return { content: text.trim(), fileTypeHint };
    }

    // =====================================
    // Other File Types (DOCX, XLSX, etc.)
    // =====================================
    progressCallback({ status: 'parsing' });
    if (fileType === ACCEPTED_MIME_TYPES.docx || fileExtension === 'docx') {
        fileTypeHint = 'docx';
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
        return { content: extractedText.trim(), fileTypeHint };
    }
    
    if (fileType === ACCEPTED_MIME_TYPES.xlsx || fileType === ACCEPTED_MIME_TYPES.xls || fileExtension === 'xlsx' || fileExtension === 'xls') {
        fileTypeHint = 'excel';
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        workbook.SheetNames.forEach(sheetName => {
          extractedText += `Foglio: ${sheetName}\n\n`;
          const worksheet = workbook.Sheets[sheetName];
          const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          extractedText += jsonData.map(row => row.join('\t')).join('\n');
          extractedText += '\n\n';
        });
        return { content: extractedText.trim(), fileTypeHint };
    }
    
    if (fileType === ACCEPTED_MIME_TYPES.doc || fileExtension === 'doc') {
        fileTypeHint = 'doc';
        extractedText = `File DOC (${file.name}) caricato. L'estrazione automatica del testo da file .doc non è supportata. Puoi convertire il file in .docx per l'analisi del contenuto.`;
        return { content: extractedText, fileTypeHint };
    }
    
    throw new Error(`Formato file non supportato: ${file.name} (${fileType || 'tipo sconosciuto'}).`);
};