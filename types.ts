export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  status: 'parsing' | 'ocr' | 'ready' | 'error';
  content?: string;
  error?: string;
  ocrProgress?: number;
  statusMessage?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: Source[];
  timestamp: Date;
  downloadablePdfs?: ExtractedPdfLink[];
  summary?: string;
  isSummarizing?: boolean;
  attachments?: {
    fileName: string;
  }[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastModifiedAt: Date;
  // geminiHistory?: Content[]; // We'll rebuild this on the fly for now
}

export interface Source {
  uri: string;
  title: string;
}

export interface PredefinedPrompt {
  id: string;
  title: string;
  prompt: string;
}

export interface Part {
  text?: string;
  inlineData?: {
    mimeType?: string;
    data?: string;
  };
}
export interface Content {
  parts?: Part[]; // Changed to optional to align with SDK
  role?: string; // 'user' or 'model'
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  retrievedContext?: {
    uri?: string;
    title?: string;
  };
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

export interface Candidate {
  content?: Content;
  finishReason?: string;
  index?: number;
  tokenCount?: number;
  groundingMetadata?: GroundingMetadata;
}
export interface GenerateContentResponseStreamChunk {
  text: string;
  candidates?: Candidate[];
}

export interface ExtractedPdfLink {
  url: string;
  fileName: string;
  title: string;
}