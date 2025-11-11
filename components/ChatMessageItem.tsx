import React from 'react';
import { ChatMessage } from '../types';
import { UserIcon, BotIcon as ActualBotIcon, DocumentTextIcon as LinkIcon, ListBulletIcon, ArrowPathIcon, PaperClipIcon } from './icons';
import { SourcesAccordion } from './SourcesAccordion';
import { DownloadablePdfs } from './DownloadablePdfs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { italianMonths, linkifierRules } from '../utils/legislativeReferences';

interface ChatMessageItemProps {
  message: ChatMessage;
  isBotCurrentlyStreaming?: boolean;
  onSummarize?: (messageId: string, textToSummarize: string) => void;
}

const linkifyLegislativeReferences = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    let bestMatch: { rule: typeof linkifierRules[0], result: RegExpExecArray, matchActualStartIndex: number } | null = null;

    for (const rule of linkifierRules) {
      rule.regex.lastIndex = 0; 
      
      const textToSearch = text.substring(currentIndex);
      const matchAttempt = rule.regex.exec(textToSearch);

      if (matchAttempt) {
        const matchActualStartIndex = currentIndex + matchAttempt.index;

        if (bestMatch === null || matchActualStartIndex < bestMatch.matchActualStartIndex) {
          bestMatch = { rule, result: matchAttempt, matchActualStartIndex };
        }
      }
    }

    if (bestMatch) {
      if (bestMatch.matchActualStartIndex > currentIndex) {
        parts.push(text.substring(currentIndex, bestMatch.matchActualStartIndex));
      }

      const matchText = bestMatch.result[0]; 
      const url = bestMatch.rule.urlFormatter(bestMatch.result); 
      const title = bestMatch.rule.titleFormatter(bestMatch.result);
      
      const linkElement = (
        <a
          key={`${bestMatch.rule.name}-${bestMatch.matchActualStartIndex}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0A2A4A] hover:text-[#08223F] underline font-medium group inline-flex items-center"
          title={title}
        >
          {matchText}
          <LinkIcon className="w-3 h-3 ml-1 opacity-70 group-hover:opacity-100" />
        </a>
      );
      parts.push(linkElement);
      currentIndex = bestMatch.matchActualStartIndex + matchText.length;
    } else {
      parts.push(text.substring(currentIndex));
      break;
    }
  }
  return parts.length > 0 ? parts : [text]; 
};


export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, isBotCurrentlyStreaming, onSummarize }) => {
  const isUser = message.role === 'user';
  
  const showTypingIndicator = message.role === 'model' && isBotCurrentlyStreaming && message.text.length === 0;

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  const contentToRender: React.ReactNode[] = isUser ? [message.text] : linkifyLegislativeReferences(message.text);

  const handleSummarizeClick = () => {
    if (onSummarize && message.role === 'model' && !message.isSummarizing && !message.summary) {
      onSummarize(message.id, message.text);
    }
  };
  

  let summarizeButtonText = "Riassumi";
  let summarizeButtonDisabled = false;

  if (message.isSummarizing) {
    summarizeButtonText = "Riassumendo...";
    summarizeButtonDisabled = true;
  } else if (message.summary) {
    summarizeButtonText = "Riassunto Generato";
    summarizeButtonDisabled = true;
  }

  const initialMessageIds = ['initial-bot-message', 'initial-bot-message-reset'];
  const showSummarizeButton = !isUser && onSummarize && !isBotCurrentlyStreaming && message.text.length > 0 && !initialMessageIds.includes(message.id);
  

  return (
    <div className={`flex items-start gap-3 animate-fade-in ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className={`flex-shrink-0 w-8 h-8 rounded-full p-1.5 flex items-center justify-center mt-0.5 ${showTypingIndicator ? 'bg-gray-300 animate-pulse' : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'} shadow-sm`}>
          <ActualBotIcon className="w-5 h-5" />
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start flex-1'} gap-2`}>
        <div
          className={`px-4 py-3 rounded-lg shadow-sm ${
            isUser
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none'
              : 'bg-gray-50 text-gray-900 border border-gray-200 rounded-bl-none'
          }`}
          style={{ overflowWrap: 'break-word', wordBreak: 'break-word', hyphens: 'auto' }}
        >
          {showTypingIndicator ? (
            <div className="flex items-center gap-1.5 py-1">
              <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
              <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1 text-inherit">
              {isUser && message.attachments && message.attachments.length > 0 && (
                <div className="not-prose mb-2 space-y-1">
                  {message.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-white/20 rounded text-xs border border-white/30">
                      <PaperClipIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate font-medium" title={attachment.fileName}>
                        {attachment.fileName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {contentToRender.map((part, index) => (
                typeof part === 'string' ? (
                  <ReactMarkdown key={`md-${index}`} remarkPlugins={[remarkGfm]}>
                    {part}
                  </ReactMarkdown>
                ) : (
                  part
                )
              ))}
            </div>
          )}
        </div>

        {!isUser && message.summary && (
          <div className="w-full max-w-2xl bg-blue-50 border-l-4 border-blue-500 p-3 rounded-md shadow-sm">
            <h4 className="text-xs font-semibold text-blue-900 mb-2">Riepilogo:</h4>
            <div className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1 text-gray-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.summary}</ReactMarkdown>
            </div>
          </div>
        )}

        {showSummarizeButton && (
          <button
            onClick={handleSummarizeClick}
            disabled={summarizeButtonDisabled}
            className="text-xs font-medium py-1.5 px-3 rounded-md transition-all bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            aria-label={summarizeButtonText}
          >
            <ListBulletIcon className="w-3.5 h-3.5" />
            {summarizeButtonText}
          </button>
        )}

        {!isUser && message.downloadablePdfs && message.downloadablePdfs.length > 0 && (
          <DownloadablePdfs pdfs={message.downloadablePdfs} />
        )}

        {!isUser && (message.sources && message.sources.length > 0 || true) && (
          <div className="w-full text-left space-y-1">
            {message.sources && message.sources.length > 0 && (
              <SourcesAccordion sources={message.sources} />
            )}
            <p className="text-xs text-gray-400">
              {formatDate(message.timestamp)}
            </p>
          </div>
        )}

        {isUser && (
          <p className="text-xs text-blue-200">
            {formatDate(message.timestamp)}
          </p>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full p-1.5 flex items-center justify-center mt-0.5 shadow-sm">
          <UserIcon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};