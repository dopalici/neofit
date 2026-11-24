import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Book, BookOpen, Info, Zap, Settings, Trash2 } from 'lucide-react';
import ChatMessage from '../chatbot/ChatMessage';
import {
  generateFitnessAdvice,
  isKnowledgeBaseReady,
  getAIConfig,
  configureAI,
  getConversationHistory,
  clearConversationHistory,
} from '../../services/chatbotService';
import { loadDefaultKnowledgeBase } from '../../services/knowledgeBaseService';
import { useIntegratedHealth } from '../../hooks/useIntegratedHealth';
import { getLatestInsights } from '../../services/habitService';

const DEFAULT_GREETING = {
  role: 'assistant',
  content: 'I am your personalized health advisor. How can I assist you today?',
};

export default function AIChatbot({ isOpen: externalIsOpen, onClose } = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen || internalIsOpen : internalIsOpen;

  const handleClose = () => {
    setInternalIsOpen(false);
    if (onClose) onClose();
  };

  const [messages, setMessages] = useState(() => {
    const saved = getConversationHistory();
    return saved.length > 0 ? [DEFAULT_GREETING, ...saved] : [DEFAULT_GREETING];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSourceInfo, setShowSourceInfo] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [kbReady, setKbReady] = useState(() => isKnowledgeBaseReady());
  const [aiConfig, setAiConfig] = useState(() => getAIConfig());
  const messagesEndRef = useRef(null);

  // Auto-load pre-indexed FitLib knowledge base
  useEffect(() => {
    let active = true;
    loadDefaultKnowledgeBase().then(() => {
      if (active) setKbReady(isKnowledgeBaseReady());
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSaveConfig = (e) => {
    e.preventDefault();
    const updated = configureAI(aiConfig);
    setAiConfig(updated);
    setShowConfig(false);
  };

  const handleClearHistory = () => {
    clearConversationHistory();
    setMessages([DEFAULT_GREETING]);
    setShowSourceInfo(null);
  };
  
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
        onClick={() => setInternalIsOpen(true)} 
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
            ADVISOR AI
            {kbReady && (
              <span className="ml-2 text-xs bg-blue-900 text-blue-200 rounded-full px-2 py-0.5">
                KB Active
              </span>
            )}
            {aiConfig.provider !== 'local' && aiConfig.apiKey && (
              <span className="ml-1 text-xs bg-cyan-900 text-cyan-200 rounded-full px-2 py-0.5 uppercase">
                {aiConfig.provider}
              </span>
            )}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConfig((prev) => !prev)}
            className="text-blue-400 hover:text-blue-200"
            title="Configure AI Provider"
          >
            <Settings size={15} />
          </button>
          <button
            onClick={handleClearHistory}
            className="text-blue-400 hover:text-red-400"
            title="Clear Conversation History"
          >
            <Trash2 size={15} />
          </button>
          <button 
            onClick={handleClose}
            className="text-blue-400 hover:text-blue-200"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {showConfig && (
        <form onSubmit={handleSaveConfig} className="p-3 bg-gray-950 border-b border-blue-800 space-y-2 text-xs font-mono">
          <div>
            <label className="text-cyan-500 block mb-1">PROVIDER</label>
            <select
              value={aiConfig.provider}
              onChange={(e) => {
                const provider = e.target.value;
                setAiConfig((prev) => ({
                  ...prev,
                  provider,
                  model: provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o-mini',
                  endpoint:
                    provider === 'anthropic'
                      ? 'https://api.anthropic.com/v1/messages'
                      : 'https://api.openai.com/v1/chat/completions',
                }));
              }}
              className="w-full bg-gray-900 border border-cyan-800 rounded px-2 py-1 text-cyan-200"
            >
              <option value="local">Local Knowledge Base (Offline RAG)</option>
              <option value="openai">OpenAI Compatible</option>
              <option value="anthropic">Anthropic Claude</option>
            </select>
          </div>
          {aiConfig.provider !== 'local' && (
            <>
              <div>
                <label className="text-cyan-500 block mb-1">API KEY</label>
                <input
                  type="password"
                  value={aiConfig.apiKey || ''}
                  onChange={(e) => setAiConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="sk-..."
                  className="w-full bg-gray-900 border border-cyan-800 rounded px-2 py-1 text-cyan-200"
                />
              </div>
              <div>
                <label className="text-cyan-500 block mb-1">MODEL</label>
                <input
                  type="text"
                  value={aiConfig.model || ''}
                  onChange={(e) => setAiConfig((prev) => ({ ...prev, model: e.target.value }))}
                  className="w-full bg-gray-900 border border-cyan-800 rounded px-2 py-1 text-cyan-200"
                />
              </div>
            </>
          )}
          <div className="flex justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setShowConfig(false)}
              className="px-2 py-1 text-gray-400 hover:text-gray-200"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-cyan-900 text-cyan-200 border border-cyan-600 rounded hover:bg-cyan-800"
            >
              SAVE
            </button>
          </div>
        </form>
      )}
      
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