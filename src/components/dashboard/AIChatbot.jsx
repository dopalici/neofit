import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Book, BookOpen, Info, Zap } from 'lucide-react';
import ChatMessage from '../chatbot/ChatMessage';
import { generateFitnessAdvice, isKnowledgeBaseReady } from '../../services/chatbotService';
import { useIntegratedHealth } from '../../hooks/useIntegratedHealth';
import { getLatestInsights } from '../../services/habitService';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'I am your personalized health advisor. How can I assist you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSourceInfo, setShowSourceInfo] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Get user health data via the integrated health hook
  const {
    enhancementMetrics, 
    healthData, 
    nutritionData, 
    sleepAnalysis,
    userGoals,
    habitData,
    isLoading
  } = useIntegratedHealth();
  
  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Show a personalized greeting if we have data
  useEffect(() => {
    if (!isLoading && healthData && messages.length === 1) {
      // Add a personalized greeting based on user's health data
      let greeting = 'Based on your latest health data, I can provide personalized recommendations. What would you like to know about?';
      
      // Check if knowledge base is available
      const kbStatus = isKnowledgeBaseReady() 
        ? 'I\'m connected to a comprehensive fitness knowledge base for evidence-based advice.' 
        : '';
      
      // Get the latest insights
      const latestInsights = getLatestInsights(1);
      const insightText = latestInsights.length > 0 
        ? `\n\nRecent insight: ${latestInsights[0].content}` 
        : '';
      
      // Mention a notable insight if available
      if (enhancementMetrics?.cardiacEfficiency?.score < 70) {
        greeting = `I notice your cardiac efficiency could be improved. Ask me about heart health or cardiovascular training. ${kbStatus}${insightText}`;
      } else if (sleepAnalysis?.quality === 'SUBOPTIMAL') {
        greeting = `Your recent sleep data indicates suboptimal recovery. Ask me about sleep optimization strategies. ${kbStatus}${insightText}`;
      } else if (nutritionData?.protein?.consumed < nutritionData?.protein?.goal * 0.7) {
        greeting = `Your protein intake is below target levels. Ask me about nutrition optimization. ${kbStatus}${insightText}`;
      } else {
        greeting = `${greeting} ${kbStatus}${insightText}`;
      }
      
      setMessages([
        {
          role: 'assistant',
          content: 'I am your personalized health advisor. How can I assist you today?'
        },
        {
          role: 'assistant',
          content: greeting
        }
      ]);
    }
  }, [isLoading, healthData, enhancementMetrics, sleepAnalysis, nutritionData, messages.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    // Add user message
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    try {
      // Prepare user data for the chatbot
      const userData = {
        healthData,
        enhancementMetrics,
        nutritionData,
        sleepAnalysis,
        habitData
      };
      
      // Generate response with personalized context
      const response = await generateFitnessAdvice(input, userData, userGoals);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Error generating response:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error processing your request. Please try again.'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle clicking on a message to show source info
  const handleMessageClick = (message) => {
    if (message.sourceEntryId && message.sourceEntryTitle) {
      setShowSourceInfo(message);
    } else {
      setShowSourceInfo(null);
    }
  };

  // Close source info panel
  const closeSourceInfo = () => {
    setShowSourceInfo(null);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)} 
        className="fixed bottom-6 right-6 bg-gray-900 text-blue-400 border border-blue-400 rounded-full p-3 shadow-lg hover:bg-blue-500 hover:text-gray-900 transition-colors"
      >
        <Sparkles size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[70vh] bg-gray-900 border border-blue-400 rounded-lg shadow-lg shadow-blue-900/30 flex flex-col overflow-hidden z-50">
      <div className="bg-gray-950 border-b border-blue-400 p-3 flex justify-between items-center">
        <div className="flex items-center">
          <Book size={16} className="text-blue-400 mr-2" />
          <h3 className="text-blue-400 font-sans text-sm font-medium">
            PERSONALIZED HEALTH ADVISOR
            {isKnowledgeBaseReady() && (
              <span className="ml-2 text-xs bg-blue-900 text-blue-200 rounded-full px-2 py-0.5">
                KB Active
              </span>
            )}
          </h3>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-blue-400 hover:text-blue-200"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-850">
        {messages.map((message, index) => (
          <div key={index} onClick={() => handleMessageClick(message)} className={message.sourceEntryId ? "cursor-pointer" : ""}>
            <ChatMessage message={message} />
            {message.sourceEntryId && (
              <div className="flex items-center mt-1 text-xs text-gray-400">
                <BookOpen size={12} className="mr-1" />
                <span>Source: {message.sourceEntryTitle || "Knowledge Base"}</span>
                <Info size={12} className="ml-1 text-gray-500" />
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="bg-gray-950 border border-blue-400 text-blue-400 p-3 rounded-lg text-sm font-sans mr-8 flex items-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Source information panel */}
      {showSourceInfo && (
        <div className="p-3 bg-gray-800 border-t border-blue-500">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-blue-300 font-semibold text-sm flex items-center">
              <BookOpen size={14} className="mr-2" />
              Source Information
            </h4>
            <button onClick={closeSourceInfo} className="text-gray-400 hover:text-gray-200">
              <X size={14} />
            </button>
          </div>
          <div className="text-xs text-gray-300">
            <p><span className="text-gray-400">Title:</span> {showSourceInfo.sourceEntryTitle}</p>
            <p><span className="text-gray-400">ID:</span> {showSourceInfo.sourceEntryId}</p>
            {showSourceInfo.references && showSourceInfo.references.length > 0 && (
              <div className="mt-1">
                <p className="text-gray-400">References:</p>
                <ul className="list-disc list-inside mt-1">
                  {showSourceInfo.references.map((ref, i) => (
                    <li key={i} className="text-gray-300">{ref}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Latest insights */}
      {!showSourceInfo && !isTyping && (
        <div className="p-2 bg-gray-850 border-t border-gray-700">
          <div className="flex items-center text-xs text-gray-400 mb-1">
            <Zap size={12} className="mr-1 text-yellow-400" />
            <span>Latest Insight:</span>
          </div>
          <p className="text-xs text-gray-300 truncate">
            {getLatestInsights(1).length > 0 
              ? getLatestInsights(1)[0].content
              : "Complete your health profile to receive personalized insights."}
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="border-t border-blue-400 p-3 bg-gray-950">
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your health data..."
            className="flex-1 bg-gray-900 border border-blue-400 rounded-l px-3 py-2 text-gray-100 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button 
            type="submit" 
            className="bg-gray-900 text-blue-400 border border-blue-400 border-l-0 rounded-r p-2 hover:bg-blue-500 hover:text-gray-900 transition-colors"
            disabled={isTyping}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}