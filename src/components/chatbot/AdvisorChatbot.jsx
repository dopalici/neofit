import React, { useState, useRef, useEffect } from 'react';
import { MessagesSquare, Send, X } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { generateFitnessAdvice } from '../../services/chatbotService';

export default function AdvisorChatbot({ userData, userGoals }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'NEURAL INTERFACE ACTIVE. HOW CAN I ASSIST WITH YOUR FITNESS OPTIMIZATION?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    // Add user message
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    try {
      // Generate response
      const response = await generateFitnessAdvice(input, userData, userGoals);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Error generating response:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'NEURAL NETWORK DISRUPTION. PLEASE REPHRASE YOUR QUERY.'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)} 
        className="fixed bottom-6 right-6 bg-cyber-black text-cyber-cyan border border-cyber-cyan rounded-full p-3 shadow-lg shadow-cyan-900/30 hover:bg-cyber-cyan hover:text-cyber-black transition-colors"
      >
        <MessagesSquare size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-96 bg-gray-900 border border-cyber-cyan rounded-lg shadow-lg shadow-cyan-900/30 flex flex-col overflow-hidden z-50">
      <div className="bg-gray-950 border-b border-cyber-cyan p-3 flex justify-between items-center">
        <h3 className="text-cyber-cyan font-mono text-sm">SCIENTIFIC ADVISOR AI</h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-cyan-600 hover:text-cyan-400"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        {isTyping && (
          <div className="bg-gray-950 border border-cyber-cyan text-cyber-cyan p-3 rounded-lg text-sm font-mono mr-8 flex items-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-cyber-cyan rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-cyber-cyan rounded-full animate-pulse delay-150"></div>
              <div className="w-2 h-2 bg-cyber-cyan rounded-full animate-pulse delay-300"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="border-t border-cyber-cyan p-3">
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="QUERY SCIENTIFIC DATABASE..."
            className="flex-1 bg-gray-950 border border-cyber-cyan rounded-l px-3 py-2 text-cyan-300 font-mono text-sm focus:outline-none"
          />
          <button 
            type="submit" 
            className="bg-cyber-black text-cyber-cyan border border-cyber-cyan border-l-0 rounded-r p-2 hover:bg-cyber-cyan hover:text-cyber-black transition-colors"
            disabled={isTyping}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}