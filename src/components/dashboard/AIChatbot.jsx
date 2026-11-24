import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Send, X, Book, BookOpen, Info, Zap, Settings, Trash2 } from 'lucide-react';
import ChatMessage from '../chatbot/ChatMessage';
import {
  DEFAULT_PROVIDER_SETTINGS,
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
  content:
    'System Coach online. Ask about your active skill rung, today’s readiness dose, or how to fix your #1 physiological bottleneck.',
};

const QUICK_PROMPTS = [
  'Based on my readiness & biometrics, what is my exact plan today?',
  'How do I unlock the next rung of my primary goal faster?',
  'What is my biggest recovery or nutrition bottleneck right now?',
];

export default function AIChatbot({
  isOpen: externalIsOpen,
  onClose,
  healthData: propsHealthData,
  nutritionData: propsNutritionData,
  habitData: propsHabitData,
  userGoals: propsUserGoals,
  readiness: propsReadiness,
  progression: propsProgression,
  systemState: propsSystemState,
  aerobicAnalysis: propsAerobicAnalysis,
  pendingPrompt,
  onConsumePendingPrompt,
} = {}) {
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

  const integrated = useIntegratedHealth(propsUserGoals || {});
  const healthData = propsHealthData || integrated.healthData;
  const nutritionData = propsNutritionData || integrated.nutritionData;
  const habitData = propsHabitData || integrated.habitData;
  const userGoals = propsUserGoals || integrated.userGoals;
  const enhancementMetrics = integrated.enhancementMetrics;
  const sleepAnalysis = integrated.sleepAnalysis;

  useEffect(() => {
    let active = true;
    loadDefaultKnowledgeBase().then(() => {
      if (active) setKbReady(isKnowledgeBaseReady());
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendQuery = useCallback(
    async (queryText) => {
      const trimmed = String(queryText || '').trim();
      if (!trimmed) return;

      setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
      setInput('');
      setIsTyping(true);

      try {
        const userData = {
          healthData,
          enhancementMetrics,
          nutritionData,
          sleepAnalysis,
          habitData,
          readiness: propsReadiness,
          progression: propsProgression,
          systemState: propsSystemState,
          aerobicAnalysis: propsAerobicAnalysis,
        };

        const response = await generateFitnessAdvice(trimmed, userData, userGoals);
        setMessages((prev) => [...prev, response]);
      } catch (error) {
        console.error('Error generating response:', error);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Unable to process your request right now. Please try again.',
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [
      healthData,
      enhancementMetrics,
      nutritionData,
      sleepAnalysis,
      habitData,
      propsReadiness,
      propsProgression,
      propsSystemState,
      propsAerobicAnalysis,
      userGoals,
    ]
  );

  // Auto-submit contextual prompt triggered from Dashboard cards (Rung, Quest, or Insight)
  useEffect(() => {
    if (isOpen && pendingPrompt) {
      const promptToRun = pendingPrompt;
      if (onConsumePendingPrompt) onConsumePendingPrompt();
      sendQuery(promptToRun);
    }
  }, [isOpen, pendingPrompt, onConsumePendingPrompt, sendQuery]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    await sendQuery(input);
  };

  const handleMessageClick = (message) => {
    if (message.sourceEntryId && message.sourceEntryTitle) {
      setShowSourceInfo(message);
    } else {
      setShowSourceInfo(null);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setInternalIsOpen(true)}
        title="Open System AI Coach"
        aria-label="Open System AI Coach"
        className="fixed bottom-20 md:bottom-6 right-5 bg-cyan-400 text-slate-950 rounded-full p-3.5 shadow-xl shadow-cyan-950/50 hover:bg-cyan-300 transition-colors z-40"
      >
        <Sparkles size={22} />
      </button>
    );
  }

  const activeProviderBadge =
    aiConfig.provider === 'proxy'
      ? 'GEMINI PROXY'
      : aiConfig.provider !== 'local' && aiConfig.apiKey
      ? `${aiConfig.provider} · ${aiConfig.model}`
      : 'OFFLINE FITLIB RAG';

  return (
    <div className="system-window nv-modal-surface fixed bottom-20 md:bottom-6 right-4 sm:right-6 w-[25rem] max-w-[calc(100vw-2rem)] h-[72vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50">
      {/* Header */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center min-w-0">
          <Book size={16} className="text-cyan-400 mr-2 shrink-0" />
          <div className="truncate">
            <h3 className="text-slate-100 font-sans text-sm font-semibold flex items-center gap-2">
              SYSTEM AI COACH
              {kbReady && (
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 rounded px-1.5 py-0.5">
                  587 KB
                </span>
              )}
            </h3>
            <p className="text-[10px] font-mono text-slate-400 uppercase truncate">
              {activeProviderBadge}
              {propsReadiness?.score !== null && propsReadiness?.score !== undefined
                ? ` · READINESS ${propsReadiness.score}`
                : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setShowConfig((prev) => !prev)}
            className="p-1 text-slate-400 hover:text-cyan-300 transition-colors"
            title="Configure Gemini / AI Provider"
          >
            <Settings size={15} />
          </button>
          <button
            onClick={handleClearHistory}
            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
            title="Clear Conversation History"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-slate-100 transition-colors"
            aria-label="Close AI Coach"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Provider Configuration Panel */}
      {showConfig && (
        <form
          onSubmit={handleSaveConfig}
          className="p-3.5 bg-slate-950 border-b border-slate-800 space-y-2.5 text-xs font-mono"
        >
          <div>
            <label className="text-cyan-400 block mb-1">AI ENGINE</label>
            <select
              value={aiConfig.provider}
              onChange={(e) => {
                const provider = e.target.value;
                const defaults =
                  DEFAULT_PROVIDER_SETTINGS[provider] || DEFAULT_PROVIDER_SETTINGS.local;
                setAiConfig((prev) => ({
                  ...prev,
                  provider,
                  model: defaults.model,
                  endpoint: defaults.endpoint,
                }));
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
            >
              <option value="gemini">Google Gemini (2.5 Flash / Flash-Lite — Recommended)</option>
              <option value="proxy">Production Proxy (/api/coach — Key stays on server)</option>
              <option value="local">Local FitLib Vault RAG (Offline / Free)</option>
              <option value="openai">OpenAI Compatible</option>
              <option value="anthropic">Anthropic Claude</option>
            </select>
          </div>

          {aiConfig.provider === 'gemini' && (
            <>
              <div>
                <label className="text-cyan-400 block mb-1">GEMINI MODEL TIER</label>
                <select
                  value={aiConfig.model || 'gemini-2.5-flash-lite'}
                  onChange={(e) => setAiConfig((prev) => ({ ...prev, model: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                >
                  <option value="auto">Auto-Route (Flash-Lite quick / Flash deep)</option>
                  <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite (Ultra-Cheap)</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Deep Coaching)</option>
                </select>
              </div>
              <div>
                <label className="text-cyan-400 block mb-1">GEMINI API KEY (DEV / BYOK)</label>
                <input
                  type="password"
                  value={aiConfig.apiKey || ''}
                  onChange={(e) => setAiConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="AIza..."
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                />
              </div>
            </>
          )}

          {aiConfig.provider === 'proxy' && (
            <div>
              <label className="text-cyan-400 block mb-1">PROXY ENDPOINT URL</label>
              <input
                type="text"
                value={aiConfig.endpoint || '/api/coach'}
                onChange={(e) => setAiConfig((prev) => ({ ...prev, endpoint: e.target.value }))}
                placeholder="/api/coach or https://your-worker.workers.dev"
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
              />
            </div>
          )}

          {(aiConfig.provider === 'openai' || aiConfig.provider === 'anthropic') && (
            <>
              <div>
                <label className="text-cyan-400 block mb-1">API KEY</label>
                <input
                  type="password"
                  value={aiConfig.apiKey || ''}
                  onChange={(e) => setAiConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="sk-..."
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                />
              </div>
              <div>
                <label className="text-cyan-400 block mb-1">MODEL</label>
                <input
                  type="text"
                  value={aiConfig.model || ''}
                  onChange={(e) => setAiConfig((prev) => ({ ...prev, model: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setShowConfig(false)}
              className="px-2.5 py-1 text-slate-400 hover:text-slate-200"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-cyan-500/20 text-cyan-200 border border-cyan-500/60 rounded hover:bg-cyan-500/30"
            >
              SAVE ENGINE
            </button>
          </div>
        </form>
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            onClick={() => handleMessageClick(message)}
            className={message.sourceEntryId ? 'cursor-pointer' : ''}
          >
            <ChatMessage message={message} />
            {message.sourceEntryId && (
              <div className="flex items-center mt-1 text-[11px] text-slate-400">
                <BookOpen size={11} className="mr-1 text-cyan-400" />
                <span className="truncate">
                  FitLib: {message.sourceEntryTitle || message.sourceEntryId}
                </span>
                <Info size={11} className="ml-1 text-slate-500 shrink-0" />
              </div>
            )}
          </div>
        ))}

        {/* Quick prompts on fresh conversation */}
        {messages.length <= 1 && !isTyping && (
          <div className="space-y-1.5 pt-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              ONE-TAP DIAGNOSTICS
            </p>
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendQuery(q)}
                className="w-full text-left text-xs font-sans text-cyan-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 rounded-lg px-3 py-2 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {isTyping && (
          <div className="bg-slate-900 border border-slate-800 text-cyan-400 p-3 rounded-lg text-xs font-mono mr-8 flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse delay-150" />
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse delay-300" />
            </div>
            <span>Analyzing biometrics & FitLib evidence...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Source information panel */}
      {showSourceInfo && (
        <div className="p-3 bg-slate-950 border-t border-cyan-500/40">
          <div className="flex justify-between items-center mb-1.5">
            <h4 className="text-cyan-300 font-semibold text-xs flex items-center">
              <BookOpen size={13} className="mr-1.5" />
              Verified FitLib Source
            </h4>
            <button onClick={() => setShowSourceInfo(null)} className="text-slate-400 hover:text-slate-200">
              <X size={14} />
            </button>
          </div>
          <div className="text-xs text-slate-300 space-y-1">
            <p>
              <span className="text-slate-500">Node:</span> {showSourceInfo.sourceEntryTitle}
            </p>
            {showSourceInfo.references && showSourceInfo.references.length > 0 && (
              <ul className="list-disc list-inside text-[11px] text-slate-400">
                {showSourceInfo.references.slice(0, 3).map((ref, i) => (
                  <li key={i} className="truncate">
                    {ref}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Compact insight footer */}
      {!showSourceInfo && !isTyping && (
        <div className="px-3 py-2 bg-slate-950/70 border-t border-slate-800/80 flex items-center text-[11px] text-slate-400">
          <Zap size={12} className="mr-1.5 text-amber-400 shrink-0" />
          <span className="truncate">
            {propsReadiness?.bottleneck
              ? `Top bottleneck: ${propsReadiness.bottleneck.title}`
              : getLatestInsights(1)[0]?.content ||
                'Synced with your active goals, readiness & 587-note FitLib Vault.'}
          </span>
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="border-t border-slate-800 p-3 bg-slate-950">
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your System Coach..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-l-lg px-3 py-2 text-slate-100 font-sans text-sm focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 border-l-0 rounded-r-lg px-3 py-2.5 hover:bg-cyan-400 hover:text-slate-950 transition-colors"
            disabled={isTyping}
            aria-label="Send message"
          >
            <Send size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}