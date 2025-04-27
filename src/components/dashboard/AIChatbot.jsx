import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

export default function AIChatbot({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your NeoFit AI advisor. How can I help you optimize your health and fitness journey today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        text: "I'm analyzing your request and will provide personalized recommendations based on your health data.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed bottom-4 right-4 w-96 bg-gray-900/95 border border-cyan-500/20 rounded-lg shadow-lg z-50"
    >
      <div className="p-4 border-b border-cyan-500/20">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
            <h3 className="font-mono text-cyan-400">NeoFit AI Advisor</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-cyan-400 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="h-96 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.sender === "user"
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "bg-gray-800/50 text-gray-300"
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <span className="text-xs text-gray-500 mt-1 block">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-cyan-500/20">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your health..."
            className="flex-1 bg-gray-800/50 border border-cyan-500/20 rounded px-4 py-2 text-gray-300 focus:outline-none focus:border-cyan-500/40"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded font-mono hover:bg-cyan-500/30 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </motion.div>
  );
}
