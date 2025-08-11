import React from 'react';
import { MessageCircle, User, CheckCircle, XCircle, AlertTriangle, FileText, ExternalLink } from 'lucide-react';

const getStatusIcon = (status) => {
  switch (status) {
    case 'sent':
      return <CheckCircle className="h-3 w-3 text-blue-400" />;
    case 'delivered':
      return <CheckCircle className="h-3 w-3 text-green-400" />;
    case 'error':
      return <XCircle className="h-3 w-3 text-red-400" />;
    default:
      return null;
  }
};

const MessageBubble = ({ message }) => {
  const data = message || {};
  const isUser = data.type === 'user';
  const isError = !!data.error;
  const sources = Array.isArray(data.sources) ? data.sources : [];

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-4xl ${isUser ? 'ml-12' : 'mr-12'}`}>
        <div className="flex items-start space-x-3">
          {!isUser && (
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
            </div>
          )}

          <div className="flex-1">
            <div
              className={`rounded-lg p-4 ${
                isUser
                  ? 'bg-blue-600 text-white'
                  : isError
                  ? 'bg-red-900 border border-red-700'
                  : 'bg-gray-800 border border-gray-700'
              }`}
            >
              {isError && (
                <div className="flex items-center space-x-2 mb-2 text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">System Error</span>
                </div>
              )}

              <p className="text-sm leading-relaxed mb-3">{data.content}</p>

              {(typeof data.confidence === 'number' || data.status) && (
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <div className="flex items-center space-x-2">
                    {typeof data.confidence === 'number' && (
                      <span>Confidence: {(data.confidence * 100).toFixed(0)}%</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">{getStatusIcon(data.status)}</div>
                </div>
              )}

              {sources.length > 0 && (
                <div className="border-t border-gray-600 pt-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-400">MedlinePlus References</span>
                  </div>

                  <div className="space-y-2">
                    {sources.map((source, idx) => {
                      const relevance =
                        typeof source.score === 'number'
                          ? source.score
                          : typeof source.relevance === 'number'
                          ? source.relevance
                          : null;

                      return (
                        <div key={idx} className="bg-gray-700 rounded p-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              {source.url ? (
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-medium text-gray-200 hover:underline inline-flex items-center gap-1"
                                  title={source.url}
                                >
                                  {source.title || 'Untitled'}
                                  <ExternalLink className="h-3 w-3 opacity-70" />
                                </a>
                              ) : (
                                <span className="text-xs font-medium text-gray-200">
                                  {source.title || 'Untitled'}
                                </span>
                              )}
                              {source.snippet && (
                                <p className="text-xs text-gray-300 mt-1 line-clamp-3">
                                  {source.snippet}
                                </p>
                              )}
                            </div>

                            {relevance !== null && (
                              <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                Match: {Math.round(relevance * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {isUser && (
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
