import React, { useState, useEffect } from "react";
import ChatSidebar from "./components/ChatSidebar";
import ChatHeader from "./components/ChatHeader";
import ChatMessages from "./components/ChatMessages";
import ChatInput from "./components/ChatInput";

const App = () => {
  const [chats, setChats] = useState(() => {
    const stored = localStorage.getItem("curalinkai-chats");
    return stored ? JSON.parse(stored) : { "main": [] };
  });
  const [currentChatId, setCurrentChatId] = useState("main");
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    localStorage.setItem("curalinkai-chats", JSON.stringify(chats));
  }, [chats]);

  const messages = chats[currentChatId] || [];

  const handleSendMessage = async (userMessage) => {
    const isFirstMessage = (chats[currentChatId]?.length || 0) === 0;
    if (!userMessage.trim()) return;

    const newMessage = {
      id: Date.now(),
      type: "user",
      content: userMessage,
      status: "sent"
    };

    const updatedMessages = [...messages, newMessage];

    setChats({ ...chats, [currentChatId]: updatedMessages });
    setInput("");
    setIsProcessing(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userMessage,
          chatHistory: updatedMessages.map((msg) => ({
            role: msg.type === "user" ? "user" : "assistant",
            content: msg.content,
          })),
        }),
      });

      const data = await res.json();

      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: data.answer ?? "No answer returned.",
        status: "delivered",
        sources: Array.isArray(data.sources) ? data.sources : []
      };

      setChats((prev) => ({
        ...prev,
        [currentChatId]: [...prev[currentChatId], aiMessage],
      }));
    } catch (error) {
      setChats((prev) => ({
        ...prev,
        [currentChatId]: [
          ...prev[currentChatId],
          {
            id: Date.now() + 1,
            type: "ai",
            content: "Sorry, I encountered an issue processing your request.",
            error: true,
            status: "error"
          }
        ]
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = () => {
    handleSendMessage(input);
  };

  const handleAddChat = () => {
    const newId = `chat-${Date.now()}`;
    setChats((prev) => ({ ...prev, [newId]: [] }));
    setCurrentChatId(newId);
  };

  const handleDeleteChat = (chatId) => {
    const { [chatId]: _, ...rest } = chats;
    const updatedChats = Object.keys(rest).length > 0 ? rest : { [`chat-${Date.now()}`]: [] };
    setChats(updatedChats);
    const fallbackId = Object.keys(updatedChats)[0];
    setCurrentChatId(fallbackId);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-gray-100">
      <ChatSidebar
        currentChatId={currentChatId}
        setCurrentChatId={setCurrentChatId}
        chats={chats}
        onAddChat={handleAddChat}
        onDeleteChat={handleDeleteChat}
      />
      <div className="flex flex-col flex-1 border-l border-slate-800">
        <ChatHeader />
        <ChatMessages messages={messages} isProcessing={isProcessing} />
        <ChatInput
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
};

export default App;
