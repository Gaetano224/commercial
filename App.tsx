import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { ChatMessage, Source, GenerateContentResponseStreamChunk, GroundingChunk, GroundingMetadata, Content, ChatSession, PredefinedPrompt, Attachment } from './types';
import { DEFAULT_PROMPTS, MULTI_CHAT_SESSIONS_LOCAL_STORAGE_KEY, GEMINI_MODEL_NAME } from './constants';
import { createChatSession, sendMessageToGeminiStream, getSummaryFromGemini } from './services/geminiService';
import { parseFile, ACCEPTED_EXTENSIONS_STRING } from './services/fileParser';
import { GoogleGenAI, Chat } from '@google/genai';
import { ChevronRightIcon, PlusCircleIcon, PaperClipIcon, XCircleIcon, MenuIcon } from './components/icons';
import { extractPdfLinks } from './utils/textProcessing';
import './styles/global.css';

const convertChatMessagesToGeminiHistory = (chatMessages: ChatMessage[]): Content[] => {
  return chatMessages
    .filter(msg => (msg.role === 'user' || msg.role === 'model') && msg.text)
    .map(msg => ({
      role: msg.role as 'user' | 'model',
      parts: [{ text: msg.text }],
  }));
};

const CONTINUATION_PROMPT = "Sei stato interrotto. Per favore, continua a generare la risposta ESATTAMENTE da dove ti sei fermato. NON ripetere nulla di quanto già scritto e NON aggiungere frasi introduttive come 'Certo, ecco la continuazione:'. Riprendi direttamente il discorso e concludilo.";

const App: React.FC = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const aiInstanceRef = useRef<GoogleGenAI | null>(null);
  const chatSessionRef = useRef<Chat | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentBotMessageRef = useRef<ChatMessage | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_CONTINUATIONS = 3;
  const continuationCountRef = useRef(0);

  const createNewChatSession = (activate: boolean = true): ChatSession => {
    const newSessionId = `session-${Date.now()}`;
    const now = new Date();
    const welcomeMessage: ChatMessage = {
      id: `initial-bot-${newSessionId}`,
      role: 'model',
      text: 'Ciao! Sono il tuo assistente AI specializzato per commercialisti. Carica un documento per analizzarlo o ponimi una domanda su questioni fiscali, societarie o legali. Come posso supportarti oggi?',
      timestamp: now,
    };
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'Nuova Chat',
      messages: [welcomeMessage],
      createdAt: now,
      lastModifiedAt: now,
    };

    setChatSessions(prevSessions => {
      const updatedSessions = [...prevSessions, newSession];
      if (activate) {
        setActiveChatSessionId(newSessionId);
        if (aiInstanceRef.current) {
          chatSessionRef.current = createChatSession(aiInstanceRef.current, []); // New chat starts with empty Gemini history
        }
      }
      return updatedSessions;
    });
    return newSession;
  };

  const initializeApp = useCallback(async () => {
    setIsInitializing(true);
    setError(null);

    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
      }
      aiInstanceRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const storedSessionsRaw = localStorage.getItem(MULTI_CHAT_SESSIONS_LOCAL_STORAGE_KEY);
      let loadedSessions: ChatSession[] = [];
      if (storedSessionsRaw) {
        const parsedSessions = JSON.parse(storedSessionsRaw);
        if (Array.isArray(parsedSessions)) {
          loadedSessions = parsedSessions.map((s: any) => ({
            id: s.id || `session-${Date.now()}-${Math.random()}`,
            title: s.title || 'Chat Precedente',
            messages: (s.messages || []).map((msg: any) => ({
              id: msg.id || `msg-${Date.now()}-${Math.random()}`,
              role: msg.role || 'model',
              text: msg.text || '',
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
              sources: msg.sources || [],
              downloadablePdfs: msg.downloadablePdfs || [],
              summary: msg.summary,
              isSummarizing: msg.isSummarizing || false,
              attachments: msg.attachments, // Load attachments
            })),
            createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
            lastModifiedAt: s.lastModifiedAt ? new Date(s.lastModifiedAt) : new Date(),
          })).sort((a, b) => new Date(b.lastModifiedAt).getTime() - new Date(a.lastModifiedAt).getTime()); // Sort by most recent
        }
      }

      // ALWAYS create a new chat on startup and make it active.
      const newSessionId = `session-${Date.now()}`;
      const now = new Date();
      const welcomeMessage: ChatMessage = {
        id: `initial-bot-${newSessionId}`,
        role: 'model',
        text: 'Ciao! Sono il tuo assistente AI specializzato per commercialisti. Carica un documento per analizzarlo o ponimi una domanda su questioni fiscali, societarie o legali. Come posso supportarti oggi?',
        timestamp: now,
      };
      const newActiveSession: ChatSession = {
        id: newSessionId,
        title: 'Nuova Chat',
        messages: [welcomeMessage],
        createdAt: now,
        lastModifiedAt: now,
      };

      // The new session is added to the list of loaded sessions.
      const allSessions = [...loadedSessions, newActiveSession];
      
      setChatSessions(allSessions);
      setActiveChatSessionId(newActiveSession.id);

      if (aiInstanceRef.current) {
        // A new chat always starts with an empty history for the Gemini model
        chatSessionRef.current = createChatSession(aiInstanceRef.current, []);
      }

    } catch (e) {
      console.error("Failed to initialize app or load history:", e);
      localStorage.removeItem(MULTI_CHAT_SESSIONS_LOCAL_STORAGE_KEY);
      const errorMessage = e instanceof Error ? e.message : "Errore nell'inizializzazione. Controlla la API Key e la connessione.";
      setError(errorMessage);
      // Create a dummy error session to display the message
      const errorSessionId = `error-session-${Date.now()}`;
      const errorMsg: ChatMessage = {
          id: `error-init-${Date.now()}`,
          role: 'model',
          text: `Si è verificato un errore critico durante l'inizializzazione: ${errorMessage}. Assicurati che la API_KEY sia configurata.`,
          timestamp: new Date(),
      };
      setChatSessions([{
          id: errorSessionId,
          title: "Errore Inizializzazione",
          messages: [errorMsg],
          createdAt: new Date(),
          lastModifiedAt: new Date(),
      }]);
      setActiveChatSessionId(errorSessionId);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  useEffect(() => {
    if (isInitializing || chatSessions.length === 0) {
      return; 
    }
    localStorage.setItem(MULTI_CHAT_SESSIONS_LOCAL_STORAGE_KEY, JSON.stringify(chatSessions));
  }, [chatSessions, isInitializing]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
  
    // Fix: Explicitly type 'file' as File to prevent it from being inferred as 'unknown'.
    const newAttachments: Attachment[] = Array.from(files).map((file: File) => ({
      id: `file-${Date.now()}-${Math.random()}`,
      fileName: file.name,
      fileType: file.type,
      status: 'parsing',
    }));
  
    setAttachments(prev => [...prev, ...newAttachments]);
  
    await Promise.allSettled(
      // Fix: Explicitly type 'file' as File to resolve type errors when accessing its properties or passing it to functions.
      Array.from(files).map(async (file: File, index) => {
        const correspondingAttachment = newAttachments[index];
        const progressCallback = (progressUpdate: Partial<Attachment>) => {
          setAttachments(prev => prev.map(att =>
            att.id === correspondingAttachment.id
              ? { ...att, ...progressUpdate }
              : att
          ));
        };
  
        try {
          const { content, fileTypeHint } = await parseFile(file, progressCallback);
          setAttachments(prev => prev.map(att => 
            att.id === correspondingAttachment.id 
              ? { ...att, status: 'ready', content, fileType: fileTypeHint, ocrProgress: 100, statusMessage: 'Pronto' } 
              : att
          ));
        } catch (error) {
          console.error("Error parsing file:", file.name, error);
          const message = error instanceof Error ? error.message : 'Errore sconosciuto.';
          setAttachments(prev => prev.map(att => 
            att.id === correspondingAttachment.id 
              ? { ...att, status: 'error', error: `Errore: ${message}` } 
              : att
          ));
        }
      })
    );
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleRemoveAttachment = useCallback((attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  }, []);

  const handleClearAllAttachments = useCallback(() => {
    setAttachments([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const triggerFileSelect = useCallback(() => {
      fileInputRef.current?.click();
  }, []);


  const handleCreateNewChat = () => {
    if (isStreaming || isInitializing) return;
    createNewChatSession(true);
  };

  const handleSelectChat = useCallback((sessionId: string) => {
    if (isStreaming || isInitializing || sessionId === activeChatSessionId) return;
    
    const selectedSession = chatSessions.find(s => s.id === sessionId);
    if (selectedSession && aiInstanceRef.current) {
      setActiveChatSessionId(sessionId);
      chatSessionRef.current = createChatSession(aiInstanceRef.current, convertChatMessagesToGeminiHistory(selectedSession.messages));
      setError(null); // Clear any general errors when switching chats
    }
  }, [chatSessions, activeChatSessionId, isStreaming, isInitializing]);

  const handleDeleteChat = useCallback((sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent onSelectChat from firing
    if (isStreaming || isInitializing) return;

    setChatSessions(prevSessions => {
      const remainingSessions = prevSessions.filter(s => s.id !== sessionId);
      if (remainingSessions.length === 0) {
        // If all chats are deleted, create a new one
        const newSession = createNewChatSession(false); // Create but don't activate yet
        setActiveChatSessionId(newSession.id);
         if (aiInstanceRef.current) {
          chatSessionRef.current = createChatSession(aiInstanceRef.current, []);
        }
        return [newSession]; // Return the new session as an array
      } else if (sessionId === activeChatSessionId) {
        // If active chat is deleted, select the most recent of the remaining
        const mostRecentRemaining = remainingSessions.sort((a,b) => new Date(b.lastModifiedAt).getTime() - new Date(a.lastModifiedAt).getTime())[0];
        setActiveChatSessionId(mostRecentRemaining.id);
        if (aiInstanceRef.current) {
          chatSessionRef.current = createChatSession(aiInstanceRef.current, convertChatMessagesToGeminiHistory(mostRecentRemaining.messages));
        }
      }
      return remainingSessions;
    });
  }, [activeChatSessionId, isStreaming, isInitializing]); // createNewChatSession removed from deps

  const handleRenameChat = useCallback((sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return; // Prevent empty titles
    setChatSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === sessionId
          ? { ...session, title: newTitle.trim(), lastModifiedAt: new Date() }
          : session
      )
    );
  }, []);

  const executeStreamingRequest = useCallback(async (textToSend: string) => {
      const isProcessingFile = attachments.some(a => a.status === 'parsing' || a.status === 'ocr');
      if (!chatSessionRef.current || !activeChatSessionId || isProcessingFile) return;
  
      const botMessageId = currentBotMessageRef.current?.id;
      if (!botMessageId) {
          console.error("Cannot stream, bot message is not ready.");
          setIsStreaming(false);
          return;
      }
  
      await sendMessageToGeminiStream(
          chatSessionRef.current,
          textToSend,
          (chunk) => { // onChunk
              setChatSessions(prevSessions => prevSessions.map(session => {
                  if (session.id === activeChatSessionId) {
                      const updatedMessages = session.messages.map(msg => {
                          if (msg.id === botMessageId && currentBotMessageRef.current) {
                              currentBotMessageRef.current.text += chunk.text;
                              
                              const pdfsInText = extractPdfLinks(currentBotMessageRef.current.text);
                              const existingPdfUrls = new Set(currentBotMessageRef.current.downloadablePdfs?.map(p => p.url) || []);
                              const newPdfs = pdfsInText.filter(p => !existingPdfUrls.has(p.url));
                              if (newPdfs.length > 0) {
                                  currentBotMessageRef.current.downloadablePdfs = [...(currentBotMessageRef.current.downloadablePdfs || []), ...newPdfs];
                              }
                              
                              if (chunk.candidates && chunk.candidates.length > 0) {
                                  const groundingMetadata: GroundingMetadata | undefined = chunk.candidates[0].groundingMetadata;
                                  if (groundingMetadata && groundingMetadata.groundingChunks) {
                                      const newSourcesFromChunk: Source[] = groundingMetadata.groundingChunks
                                          .map((gc: GroundingChunk) => {
                                              const webSource = gc.web || gc.retrievedContext;
                                              if (webSource && webSource.uri) {
                                                  return { uri: webSource.uri, title: webSource.title || webSource.uri };
                                              } return null;
                                          }).filter((s): s is Source => s !== null);
                                      
                                      if (!currentBotMessageRef.current.sources) currentBotMessageRef.current.sources = [];
                                      const existingSourceUris = new Set(currentBotMessageRef.current.sources.map(s => s.uri));
                                      newSourcesFromChunk.forEach(ns => {
                                          if (!existingSourceUris.has(ns.uri)) currentBotMessageRef.current.sources!.push(ns);
                                      });
                                  }
                              }
                              return { ...currentBotMessageRef.current, timestamp: new Date() };
                          }
                          return msg;
                      });
                      return { ...session, messages: updatedMessages, lastModifiedAt: new Date() };
                  }
                  return session;
              }));
          },
          (err) => { // onError
              console.error("Gemini API Error:", err);
              const errorMessage = `Errore dall'API: ${err.message}`;
              setError(errorMessage);
              setChatSessions(prevSessions => prevSessions.map(session => {
                  if (session.id === activeChatSessionId) {
                      const updatedMessages = session.messages.map(msg => {
                          if (msg.id === botMessageId && currentBotMessageRef.current) {
                              currentBotMessageRef.current.text += `\n\n**${errorMessage}**`;
                              return { ...currentBotMessageRef.current, timestamp: new Date() };
                          }
                          return msg;
                      });
                      return { ...session, messages: updatedMessages, lastModifiedAt: new Date() };
                  }
                  return session;
              }));
              setIsStreaming(false);
              currentBotMessageRef.current = null;
          },
          (finishReason) => { // onComplete
              if (finishReason === 'MAX_TOKENS' && continuationCountRef.current < MAX_CONTINUATIONS) {
                  continuationCountRef.current += 1;
                  executeStreamingRequest(CONTINUATION_PROMPT);
              } else {
                  const finalBotMessageText = currentBotMessageRef.current?.text?.trim() || '';

                  // Handle cases like safety blocks where the stream ends without sending text.
                  if (finishReason && finishReason !== 'STOP' && finalBotMessageText === '') {
                      const safetyMessage = "Non posso rispondere a questa richiesta. La domanda potrebbe aver violato le norme di sicurezza. Prova a riformulare la tua domanda.";
                      setChatSessions(prevSessions => prevSessions.map(session => {
                          if (session.id === activeChatSessionId) {
                              const updatedMessages = session.messages.map(msg => {
                                  if (msg.id === botMessageId) {
                                      return { ...msg, text: safetyMessage };
                                  }
                                  return msg;
                              });
                              return { ...session, messages: updatedMessages, lastModifiedAt: new Date() };
                          }
                          return session;
                      }));
                  }
                  
                  if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
                     console.warn(`Response may have been truncated. Final finish reason: ${finishReason}`);
                  }
                  
                  setIsStreaming(false);
                  currentBotMessageRef.current = null;
              }
          }
      );
  }, [activeChatSessionId, attachments]);


  const handleSendMessage = useCallback(async (
    inputText: string, 
    isPredefinedPrompt: boolean = false,
    promptTitleForDisplay?: string 
  ) => {
    const isProcessingFile = attachments.some(a => a.status === 'parsing' || a.status === 'ocr');
    if (!chatSessionRef.current || !activeChatSessionId || isStreaming || isProcessingFile || isInitializing) return;

    continuationCountRef.current = 0; // Reset for new message

    const readyAttachments = attachments.filter(a => a.status === 'ready');
    let displayedUserText = inputText; 
    let textToSendToGemini = inputText;
    let attachmentsForMessage: ChatMessage['attachments'] = [];

    if (readyAttachments.length > 0) {
      attachmentsForMessage = readyAttachments.map(({ fileName }) => ({ fileName }));
      
      const fileContexts = readyAttachments.map(att => 
        `Contenuto dal documento (nome file: ${att.fileName}, tipo: ${att.fileType}):\n---\n${att.content}\n---`
      ).join('\n\n');

      let fileContextPrefix = `Considerando il contenuto dei seguenti documenti:\n\n${fileContexts}\n\n`;

      if (isPredefinedPrompt && promptTitleForDisplay) {
        displayedUserText = `${promptTitleForDisplay}`;
      }
      textToSendToGemini = `${fileContextPrefix}Rispondi alla seguente domanda:\n${inputText}`;
    }
    
    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: displayedUserText, 
      timestamp: new Date(),
      attachments: attachmentsForMessage.length > 0 ? attachmentsForMessage : undefined,
    };

    const botMessageId = `bot-${Date.now()}`;
    currentBotMessageRef.current = {
        id: botMessageId,
        role: 'model',
        text: '',
        timestamp: new Date(),
        sources: [],
        downloadablePdfs: [],
    };
    
    setChatSessions(prevSessions => prevSessions.map(session => {
      if (session.id === activeChatSessionId) {
        const isFirstUserMessageInNewChat = session.messages.length === 1 && session.messages[0].id.startsWith('initial-bot-');
        const titleText = readyAttachments.length > 0 
          ? readyAttachments.map(a => a.fileName).join(', ') 
          : displayedUserText;
        return {
          ...session,
          title: isFirstUserMessageInNewChat ? (titleText.substring(0, 40) + (titleText.length > 40 ? '...' : '')) : session.title,
          messages: [...session.messages, newUserMessage, currentBotMessageRef.current!],
          lastModifiedAt: new Date(),
        };
      }
      return session;
    }));

    setIsStreaming(true);
    setError(null); 
    
    // Auto-clear the file after it has been used for a message
    if (readyAttachments.length > 0) {
        handleClearAllAttachments();
    }
    
    executeStreamingRequest(textToSendToGemini);

  }, [activeChatSessionId, attachments, isStreaming, isInitializing, chatSessions, executeStreamingRequest, handleClearAllAttachments]);

  const handlePredefinedPromptSelect = (promptText: string, promptTitle: string) => {
    if (!activeChatSessionId) {
        setError("Nessuna chat attiva selezionata per inviare la domanda.");
        return;
    }
    const readyAttachments = attachments.filter(a => a.status === 'ready');
    if (readyAttachments.length === 0) { 
        setError("Per favore, carica prima un file per utilizzare questa funzione.");
        return;
    }
    
    handleSendMessage(promptText, true, promptTitle); 
  };

  const handleSummarizeMessage = useCallback(async (messageId: string, textToSummarize: string) => {
    if (!aiInstanceRef.current || !activeChatSessionId) {
      setError("L'istanza AI non è inizializzata o nessuna chat attiva. Impossibile riassumere.");
      return;
    }
    setError(null);
    setChatSessions(prevSessions => prevSessions.map(session => {
      if (session.id === activeChatSessionId) {
        return {
          ...session,
          messages: session.messages.map(msg => msg.id === messageId ? { ...msg, isSummarizing: true, summary: undefined } : msg),
          lastModifiedAt: new Date(),
        };
      }
      return session;
    }));

    try {
      const summaryText = await getSummaryFromGemini(aiInstanceRef.current, textToSummarize);
      setChatSessions(prevSessions => prevSessions.map(session => {
        if (session.id === activeChatSessionId) {
          return {
            ...session,
            messages: session.messages.map(msg => msg.id === messageId ? { ...msg, summary: summaryText, isSummarizing: false } : msg),
            lastModifiedAt: new Date(),
          };
        }
        return session;
      }));
    } catch (e) {
      console.error("Failed to summarize message:", e);
      const summaryErrorMessage = e instanceof Error ? e.message : "Errore durante la generazione del riassunto.";
      setChatSessions(prevSessions => prevSessions.map(session => {
        if (session.id === activeChatSessionId) {
          return {
            ...session,
            messages: session.messages.map(msg => msg.id === messageId ? { ...msg, isSummarizing: false, summary: `Errore riassunto: ${summaryErrorMessage}` } : msg),
            lastModifiedAt: new Date(),
          };
        }
        return session;
      }));
    }
  }, [activeChatSessionId, aiInstanceRef]);


  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const filteredChatSessions = useMemo(() => {
    if (!searchQuery.trim()) {
      return chatSessions;
    }
    return chatSessions.filter(session => {
      const query = searchQuery.toLowerCase().trim();
      const titleMatch = session.title.toLowerCase().includes(query);
      if (titleMatch) return true;
      
      const messageMatch = session.messages.some(message => 
        message.text.toLowerCase().includes(query)
      );
      return messageMatch;
    });
  }, [chatSessions, searchQuery]);

  const activeMessages = chatSessions.find(s => s.id === activeChatSessionId)?.messages || [];
  const activeSessionTitle = chatSessions.find(s => s.id === activeChatSessionId)?.title;
  
  const AttachmentsPreview = () => {
    if (attachments.length === 0) return null;

    return (
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-2 max-h-32 overflow-y-auto">
          {attachments.map(att => (
            <div key={att.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between hover:border-gray-300 transition-colors">
              <div className="flex items-center min-w-0 gap-2.5">
                <PaperClipIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate" title={att.fileName}>
                    {att.fileName}
                  </p>
                  {(att.status === 'parsing' || att.status === 'ocr') && !att.statusMessage && (
                    <p className="text-xs text-gray-500">Processing...</p>
                  )}
                  {att.status === 'error' && (
                    <p className="text-xs text-red-600 truncate" title={att.error}>{att.error}</p>
                  )}
                  {att.status === 'ready' && (
                    <p className="text-xs text-green-600">Ready</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRemoveAttachment(att.id)}
                className="p-1.5 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                aria-label={`Remove file ${att.fileName}`}
              >
                <XCircleIcon className="w-5 h-5 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const isProcessingFile = attachments.some(a => a.status === 'parsing' || a.status === 'ocr');

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-white">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={ACCEPTED_EXTENSIONS_STRING}
        style={{ display: 'none' }}
        id="app-file-input"
        multiple
      />

      {isSidebarOpen && (
        <div className="hidden md:block flex-shrink-0 w-80 overflow-hidden">
          <Sidebar
            chatSessions={filteredChatSessions.sort((a, b) => new Date(b.lastModifiedAt).getTime() - new Date(a.lastModifiedAt).getTime())}
            activeChatSessionId={activeChatSessionId}
            onCreateNewChat={handleCreateNewChat}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
            onRenameChat={handleRenameChat}
            onPromptSelect={handlePredefinedPromptSelect}
            predefinedPrompts={DEFAULT_PROMPTS}
            attachments={attachments}
            onSelectFile={triggerFileSelect}
            onClearAllFiles={handleClearAllAttachments}
            isStreaming={isStreaming}
            isInitializing={isInitializing}
            onToggleSidebar={toggleSidebar}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
        </div>
      )}

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={toggleSidebar}
        />
      )}

      {isSidebarOpen && (
        <div className="fixed left-0 top-0 h-full w-80 z-50 md:hidden overflow-hidden">
          <Sidebar
            chatSessions={filteredChatSessions.sort((a, b) => new Date(b.lastModifiedAt).getTime() - new Date(a.lastModifiedAt).getTime())}
            activeChatSessionId={activeChatSessionId}
            onCreateNewChat={handleCreateNewChat}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
            onRenameChat={handleRenameChat}
            onPromptSelect={handlePredefinedPromptSelect}
            predefinedPrompts={DEFAULT_PROMPTS}
            attachments={attachments}
            onSelectFile={triggerFileSelect}
            onClearAllFiles={handleClearAllAttachments}
            isStreaming={isStreaming}
            isInitializing={isInitializing}
            onToggleSidebar={toggleSidebar}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col max-h-screen bg-white overflow-hidden">
        <ChatHeader
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
          chatTitle={activeSessionTitle}
        />

        {error && !isInitializing && (
          <div className="px-4 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm">
            <div className="max-w-4xl mx-auto">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {isInitializing && activeMessages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-6">
            <div className="w-12 h-12 animate-spin text-blue-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-lg font-medium">Initializing AI Assistant...</p>
            <p className="text-sm">Please wait.</p>
          </div>
        )}

        {!isInitializing && activeMessages.length === 0 && !activeChatSessionId && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-6">
            <PlusCircleIcon className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-lg font-semibold text-gray-700">No chat selected</p>
            <p className="text-sm mb-6">Start a new conversation to begin</p>
            <button
              onClick={handleCreateNewChat}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 px-6 rounded-lg transition-all shadow-sm"
            >
              Start New Chat
            </button>
          </div>
        )}

        {activeMessages.length > 0 && (
          <>
            <MessageList
              messages={activeMessages}
              streamingBotMessageId={currentBotMessageRef.current?.id}
              onSummarize={handleSummarizeMessage}
            />
            <AttachmentsPreview />
            <MessageInput
              onSendMessage={(message) => handleSendMessage(message)}
              onAttachFile={triggerFileSelect}
              disabled={!chatSessionRef.current || !activeChatSessionId || isStreaming || isInitializing || isProcessingFile}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default App;
