import React from 'react';
import { Send, AlertTriangle } from 'lucide-react';

const ChatInput = ({ input, setInput, handleSubmit, isProcessing }) => {
  return (
    <div className="border-t border-gray-700 bg-gray-800 px-6 py-4">
      <div className="flex space-x-4">
        <div className="flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Enter medical query or clinical question..."
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
            disabled={isProcessing}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={isProcessing || !(input || "").trim()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 text-xs text-gray-500 flex items-center justify-center space-x-2">
        <AlertTriangle className="h-3 w-3" />
        <span>For informational purposes only. Not a substitute for professional medical advice.</span>
      </div>
    </div>
  );
};

export default ChatInput;
