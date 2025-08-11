import React from 'react';
import MessageBubble from './MessageBubble';
import { MessageCircle } from 'lucide-react';

const ChatMessages = ({ messages = [], isProcessing = false, messagesEndRef = null }) => {
  const safeMessages = Array.isArray(messages) ? messages : [];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="space-y-6">
        {safeMessages.map((message, idx) => (
          <MessageBubble key={message.id ?? idx} message={message} />
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="max-w-4xl mr-12">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-400">Consulting MedlinePlus knowledge base...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatMessages;
