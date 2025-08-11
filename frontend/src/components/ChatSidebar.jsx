import React, { useState } from "react";
import { MessageSquare, Plus, Trash, Pencil } from "lucide-react";

const ChatSidebar = ({ currentChatId, setCurrentChatId, chats, onAddChat, onDeleteChat }) => {
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const handleRename = (chatId) => {
    if (!renameValue.trim()) return;
    const updated = { ...chats };
    updated[chatId].__name = renameValue.trim();
    localStorage.setItem("curalinkai-chats", JSON.stringify(updated));
    setRenamingId(null);
    setRenameValue("");
  };

  return (
    <div className="w-64 bg-slate-900 p-4 flex flex-col border-r border-slate-800 space-y-4 overflow-y-auto">
      <button
        onClick={onAddChat}
        className="flex items-center space-x-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-500"
      >
        <Plus className="h-4 w-4" />
        <span>New Chat</span>
      </button>
      {Object.entries(chats)
        .sort((a, b) => {
          const aMessages = a[1].filter(m => m.role);
          const bMessages = b[1].filter(m => m.role);
          const aTime = aMessages.slice(-1)[0]?.id || 0;
          const bTime = bMessages.slice(-1)[0]?.id || 0;
          return bTime - aTime;
        })
        .map(([chatId, chatMessages]) => {
          const label = chatMessages.__name || "Untitled Chat";
          const isActive = chatId === currentChatId;
          return (
            <div
              key={chatId}
              className={`group flex justify-between items-center p-2 rounded ${
                isActive ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-gray-300"
              }`}
            >
              <div className="flex-1">
                {renamingId === chatId ? (
                  <input
                    className="bg-slate-700 text-white rounded px-2 w-full"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRename(chatId)}
                    onBlur={() => setRenamingId(null)}
                    autoFocus
                  />
                ) : (
                  <button
                    className="flex items-center space-x-2 w-full text-left"
                    onClick={() => setCurrentChatId(chatId)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="truncate">{label}</span>
                  </button>
                )}
              </div>
              <div className="flex space-x-1 opacity-0 group-hover:opacity-100">
                <Pencil
                  onClick={() => {
                    setRenamingId(chatId);
                    setRenameValue(label);
                  }}
                  className="h-4 w-4 hover:text-yellow-400 cursor-pointer"
                />
                <Trash
                  onClick={() => onDeleteChat(chatId)}
                  className="h-4 w-4 hover:text-red-500 cursor-pointer"
                />
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default ChatSidebar;
