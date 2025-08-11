import React from "react";
import { Stethoscope } from "lucide-react";

const ChatHeader = () => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
          <Stethoscope className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            CuraLinkAI
          </h1>
          <span className="text-sm font-serif italic text-gray-400">
            Powered by MedlinePlus
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
