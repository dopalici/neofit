// This service integrates the fitness advisor chatbot with the knowledge base and optional AI LLM APIs

import { 
  getKnowledgeBase, 
  searchKnowledge, 
  getPersonalizedRecommendations,
  getRelatedEntries,
  isKnowledgeBaseInitialized,
  initializeFromFiles,
  initializeFromDirectory,
  loadDefaultKnowledgeBase
} from './knowledgeBaseService';
import { processEnhancementMetrics } from './healthDataProcessor';
import {
  buildAITelemetryBrief,
  computeProgressionSummary,
  computeReadinessAssessment,
  getSystemState,
} from './goalEngineService';
import {
  analyzeAerobicGoalProgress,
  buildAerobicCoachBrief,
} from './aerobicGoalService';
import { getFromStorage, saveToStorage } from '../utils/storageUtils';

const AI_CONFIG_KEY = 'ai-advisor-config';
const CHAT_HISTORY_KEY = 'ai-advisor-history';
const MAX_HISTORY_MESSAGES = 12;
const MAX_REQUESTS_PER_MINUTE = 15;
const requestTimestamps = [];

export const DEFAULT_PROVIDER_SETTINGS = {
  gemini: {
    model: 'gemini-2.5-flash-lite',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
  },
  proxy: {
    model: 'auto',
    endpoint: process.env.REACT_APP_AI_PROXY_URL || '/api/coach',
  },
  openai: {
    model: 'gpt-4o-mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
  },
  anthropic: {
    model: 'claude-3-5-sonnet-20241022',
    endpoint: 'https://api.anthropic.com/v1/messages',
  },
  local: {
    model: 'fitlib-local-rag',
    endpoint: '',
  },
};

/**
 * Get current AI provider configuration (localStorage overrides env vars)
 */
export function getAIConfig() {
  const stored = getFromStorage(AI_CONFIG_KEY, null) || {};
  const envGemini = process.env.REACT_APP_GEMINI_API_KEY || '';
  const envProxy = process.env.REACT_APP_AI_PROXY_URL || '';
  const envOpenAI = process.env.REACT_APP_OPENAI_API_KEY || process.env.REACT_APP_AI_API_KEY || '';
  const envAnthropic = process.env.REACT_APP_ANTHROPIC_API_KEY || '';

  const provider =
    stored.provider ||
    process.env.REACT_APP_AI_PROVIDER ||
    (envProxy ? 'proxy' : envGemini ? 'gemini' : envOpenAI ? 'openai' : envAnthropic ? 'anthropic' : 'local');

  const defaults = DEFAULT_PROVIDER_SETTINGS[provider] || DEFAULT_PROVIDER_SETTINGS.local;

  const apiKey =
    stored.apiKey !== undefined
      ? stored.apiKey
      : provider === 'gemini'
      ? envGemini
      : provider === 'anthropic'
      ? envAnthropic
      : provider === 'openai'
      ? envOpenAI
      : '';

  const model = stored.model || defaults.model;
  const endpoint = stored.endpoint || defaults.endpoint;

  return { provider, apiKey, model, endpoint };
}

/**
 * Save AI provider configuration
 */
export function configureAI(config) {
  const current = getAIConfig();
  const nextProvider = config.provider || current.provider;
  const providerChanged = config.provider && config.provider !== current.provider;
  const defaults = DEFAULT_PROVIDER_SETTINGS[nextProvider] || DEFAULT_PROVIDER_SETTINGS.local;

  const next = {
    ...current,
    ...config,
    provider: nextProvider,
    model: config.model || (providerChanged ? defaults.model : current.model || defaults.model),
    endpoint:
      config.endpoint !== undefined
        ? config.endpoint
        : providerChanged
        ? defaults.endpoint
        : current.endpoint || defaults.endpoint,
  };
  saveToStorage(AI_CONFIG_KEY, next);
  return next;
}

/**
 * Sliding-window rate limiter (per minute)
 */
export function checkRateLimit() {
  const now = Date.now();
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > 60000) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    return { allowed: false, retryAfterMs: 60000 - (now - requestTimestamps[0]) };
  }
  requestTimestamps.push(now);
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Approximate token-budget trimmer (~4 characters per token)
 */
export function trimToTokenBudget(text = '', maxTokens = 600) {
  const maxChars = maxTokens * 4;
  if (!text || text.length <= maxChars) return text || '';
  return `${text.slice(0, maxChars)}...`;
}

/**
 * Retrieve persisted conversation history
 */
export function getConversationHistory() {
  const history = getFromStorage(CHAT_HISTORY_KEY, []);
  return Array.isArray(history) ? history : [];
}

/**
 * Append a message turn to conversation history (capped at MAX_HISTORY_MESSAGES)
 */
function appendConversationHistory(role, content) {
  const history = getConversationHistory();
  const updated = [...history, { role, content, timestamp: new Date().toISOString() }].slice(
    -MAX_HISTORY_MESSAGES
  );
  saveToStorage(CHAT_HISTORY_KEY, updated);
  return updated;
}

/**
 * Clear persisted conversation history
 */
export function clearConversationHistory() {
  saveToStorage(CHAT_HISTORY_KEY, []);
}

// Pattern matching responses for when no knowledge base is available
const fallbackResponses = {
  handstand: {
    content: 'Based on your current metrics, I recommend a progressive approach to the handstand push-up. Studies indicate that proper scapular positioning is crucial for vertical pressing movements. Begin with pike push-ups at a 45° angle, progressing to 60° and then 90° as strength increases. Research shows that isometric holds at your current maximum position create the neural adaptations necessary for progression.',
    references: ['Journal of Strength and Conditioning, 2024']
  },
  
  run: {
    content: 'Your VO2max of 48.3 is above average, but requires improvement to achieve a 4-minute mile. Scientific literature supports incorporating the 80/20 training principle: 80% low intensity, 20% high intensity intervals. This maximizes mitochondrial density while minimizing recovery time. I recommend 400m interval training at 95% effort with 1:1 work-to-rest ratio, 2x weekly.',
    references: ['Sports Medicine Review, 2023', 'Exercise Physiology Journal, 2024']
  },
  
  diet: {
    content: 'Analysis of your body composition metrics suggests optimizing protein intake to 1.8g/kg of body weight daily. Recent meta-analyses demonstrate that protein distribution throughout the day (4-5 servings of 0.4g/kg) is superior to total daily consumption for muscle protein synthesis. Your current pattern shows suboptimal distribution with 68% of protein consumed in evening meals.',
    references: ['International Journal of Sport Nutrition, 2024', 'Protein Timing Meta-Analysis, 2023']
  },
  
  default: {
    content: 'Based on your current biometric data, I can provide scientific guidance for optimizing your training protocol. Your metrics indicate potential for significant improvement with proper periodization and recovery management. Would you like me to analyze a specific aspect of your fitness regimen?'
  }
};

/**
 * Initialize the knowledge base for the chatbot from files
 * @param {FileList|Array<File>} files - Files from input element or drag-drop
 * @returns {Promise<boolean>} - True if initialization was successful
 */
export async function initializeKnowledgeBaseFromFiles(files) {
  try {
    if (!files || files.length === 0) {
      return false;
    }
    
    await initializeFromFiles(files);
    return true;
  } catch (error) {
    console.error('Failed to initialize knowledge base from files:', error);
    return false;
  }
}

/**
 * Initialize the knowledge base for the chatbot (legacy method)
 * @param {string} directoryPath - Path to the Obsidian vault directory
 * @returns {Promise<boolean>} - True if initialization was successful
 */
export async function initializeKnowledgeBase(directoryPath) {
  try {
    if (!directoryPath) {
      return false;
    }
    
    try {
      await initializeFromDirectory(directoryPath);
      return true;
    } catch (error) {
      console.error('Failed to initialize from directory, this may not be supported in browser:', error);
      // If we're in development and using a local path, we could try to handle this with a special server endpoint
      return false;
    }
  } catch (error) {
    console.error('Failed to initialize knowledge base:', error);
    return false;
  }
}

/**
 * Check if the knowledge base is ready to use
 * @returns {boolean} - True if the knowledge base is initialized
 */
export function isKnowledgeBaseReady() {
  return isKnowledgeBaseInitialized();
}

/**
 * Find knowledge base entries relevant to the user's query and context
 * @param {string} query - The user's question
 * @param {Object} userContext - Context information about the user
 * @param {number} limit - Maximum number of results to return
 * @returns {Array} - Array of relevant knowledge base entries
 */
function findRelevantKnowledge(query, userContext = {}, limit = 3) {
  // Search knowledge base using the query
  const searchResults = searchKnowledge(query, limit);
  
  // If no results or knowledge base is empty, return empty array
  if (!searchResults || searchResults.length === 0) {
    return [];
  }
  
  // Add relevance score based on user context
  const enhancedResults = searchResults.map(result => {
    let contextualScore = result.score;
    
    // Enhance score based on user's health metrics
    if (userContext.enhancementMetrics) {
      // Higher priority for cardiac-related entries if user has poor cardiac health
      if (userContext.enhancementMetrics.cardiacEfficiency?.score < 70 && 
          (result.title.toLowerCase().includes('cardio') || 
           result.title.toLowerCase().includes('heart'))) {
        contextualScore += 20;
      }
      
      // Higher priority for endurance-related entries if user has poor endurance
      if (userContext.enhancementMetrics.enduranceMatrix?.score < 70 && 
          (result.title.toLowerCase().includes('endurance') || 
           result.title.toLowerCase().includes('stamina'))) {
        contextualScore += 20;
      }
      
      // Higher priority for strength-related entries if user has poor strength
      if (userContext.enhancementMetrics.forceOutput?.score < 70 && 
          (result.title.toLowerCase().includes('strength') || 
           result.title.toLowerCase().includes('muscle'))) {
        contextualScore += 20;
      }
    }
    
    // Enhance score based on sleep data
    if (userContext.sleep && userContext.sleep.quality === 'SUBOPTIMAL' && 
        (result.title.toLowerCase().includes('sleep') || 
         result.title.toLowerCase().includes('recovery'))) {
      contextualScore += 20;
    }
    
    // Enhance score based on nutrition data
    if (userContext.nutrition) {
      const proteinPercentage = userContext.nutrition.protein?.consumed / userContext.nutrition.protein?.goal * 100 || 0;
      
      if (proteinPercentage < 80 && 
          (result.title.toLowerCase().includes('protein') || 
           result.title.toLowerCase().includes('nutrition'))) {
        contextualScore += 20;
      }
    }
    
    // Enhance score based on user goals
    if (userContext.goals) {
      Object.values(userContext.goals).forEach(goal => {
        if (goal.type && result.title.toLowerCase().includes(goal.type.toLowerCase())) {
          contextualScore += 15;
        }
        
        if (goal.name && result.title.toLowerCase().includes(goal.name.toLowerCase())) {
          contextualScore += 25;
        }
      });
    }
    
    return {
      ...result,
      contextualScore
    };
  });
  
  // Sort by contextual score
  enhancedResults.sort((a, b) => b.contextualScore - a.contextualScore);
  
  // Get the knowledge base entries for the top results
  const knowledgeBase = getKnowledgeBase();
  
  return enhancedResults.slice(0, limit).map(result => ({
    ...knowledgeBase[result.id],
    score: result.contextualScore
  }));
}

/**
 * Generate personalized insights based on user health data and the query
 * @param {string} query - The user's question
 * @param {Object} userData - User health data
 * @returns {string} - Personalized insights for the user
 */
function generatePersonalizedInsights(query, userData) {
  if (!userData) {
    return '';
  }
  
  let insights = '';
  
  // Add health metric insights if relevant to the query
  if (userData.enhancementMetrics) {
    if (query.toLowerCase().includes('cardio') || query.toLowerCase().includes('heart')) {
      const cardiacScore = userData.enhancementMetrics.cardiacEfficiency?.score || 0;
      insights += `\n\nYour cardiac efficiency score of ${cardiacScore} indicates ${cardiacScore > 70 ? 'good' : 'room for improvement in'} heart health. `;
    }
    
    if (query.toLowerCase().includes('endurance') || query.toLowerCase().includes('stamina')) {
      const enduranceScore = userData.enhancementMetrics.enduranceMatrix?.score || 0;
      insights += `\n\nYour endurance matrix score of ${enduranceScore} shows ${enduranceScore > 70 ? 'strong' : 'developing'} cardiovascular capacity. `;
    }
    
    if (query.toLowerCase().includes('strength') || query.toLowerCase().includes('muscle')) {
      const strengthScore = userData.enhancementMetrics.forceOutput?.score || 0;
      insights += `\n\nYour current force output score of ${strengthScore} indicates ${strengthScore > 70 ? 'good' : 'room for improvement in'} muscular capacity. `;
    }
  }
  
  // Add sleep insights if relevant
  if (userData.sleepAnalysis && (query.toLowerCase().includes('sleep') || query.toLowerCase().includes('recovery'))) {
    const sleepQuality = userData.sleepAnalysis.quality || 'UNKNOWN';
    const sleepEfficiency = userData.sleepAnalysis.efficiency || 0;
    insights += `\n\nSleep quality: ${sleepQuality}. Your sleep efficiency is ${sleepEfficiency}%, which ${sleepEfficiency > 85 ? 'supports optimal recovery' : 'could be improved for better recovery'}. `;
  }
  
  // Add nutrition insights if relevant
  if (userData.nutritionData && 
     (query.toLowerCase().includes('nutrition') || 
      query.toLowerCase().includes('diet') || 
      query.toLowerCase().includes('food') || 
      query.toLowerCase().includes('eat'))) {
    const proteinPercentage = userData.nutritionData.protein?.consumed / userData.nutritionData.protein?.goal * 100 || 0;
    insights += `\n\nYour current protein intake is at ${Math.round(proteinPercentage)}% of your daily target, which ${proteinPercentage > 80 ? 'supports optimal recovery' : 'could be increased to improve recovery and adaptation'}. `;
    
    const caloriePercentage = userData.nutritionData.calories?.consumed / userData.nutritionData.calories?.goal * 100 || 0;
    if (caloriePercentage < 80) {
      insights += `Your caloric intake is at ${Math.round(caloriePercentage)}% of your target, which may impact energy levels and recovery. `;
    } else if (caloriePercentage > 120) {
      insights += `Your caloric intake is at ${Math.round(caloriePercentage)}% of your target, which may lead to unwanted weight gain. `;
    }
  }
  
  // Add habit consistency insights if available
  if (userData.habitData && userData.habitData.streakData) {
    const streak = userData.habitData.streakData.currentStreak || 0;
    
    if (query.toLowerCase().includes('habit') || query.toLowerCase().includes('consistency')) {
      insights += `\n\nYour current habit streak is ${streak} days. ${streak >= 5 ? 'Great job maintaining consistency!' : 'Focusing on consistency can significantly improve your results.'} `;
    }
  }
  
  return insights;
}

/**
 * Extract references from knowledge base content
 * @param {string} content - Content to extract references from
 * @returns {Array} - Array of reference strings
 */
function extractReferences(content) {
  const references = [];
  
  // Extract references in the format (Author, Year)
  const citationRegex = /\(([^)]+\s*\d{4}[a-z]?)\)/g;
  let citationMatch;
  
  while ((citationMatch = citationRegex.exec(content)) !== null) {
    references.push(citationMatch[1].trim());
  }
  
  // Extract references in the format [Author et al., Year]
  const bracketRegex = /\[([^[\]]+\s*\d{4}[a-z]?)\]/g;
  let bracketMatch;
  
  while ((bracketMatch = bracketRegex.exec(content)) !== null) {
    references.push(bracketMatch[1].trim());
  }
  
  // Remove duplicates
  return [...new Set(references)];
}

/**
 * Generate a response based on the knowledge base and user context
 * @param {string} query - The user's question
 * @param {Object} userData - User health data
 * @param {Object} userGoals - User goals data
 * @returns {Object} - Response object with content and references
 */
function generateKnowledgeBasedResponse(query, userData, userGoals) {
  // Initialize user context
  const userContext = {
    enhancementMetrics: userData?.enhancementMetrics,
    sleep: userData?.sleepAnalysis,
    nutrition: userData?.nutritionData,
    goals: userGoals,
    habitData: userData?.habitData
  };
  
  // Find relevant knowledge
  const relevantEntries = findRelevantKnowledge(query, userContext);
  
  // If no relevant entries found, use fallback responses
  if (relevantEntries.length === 0) {
    // Use pattern matching for fallback responses
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('handstand') || lowerQuery.includes('push')) {
      return fallbackResponses.handstand;
    } else if (lowerQuery.includes('run') || lowerQuery.includes('mile') || lowerQuery.includes('cardio')) {
      return fallbackResponses.run;
    } else if (lowerQuery.includes('diet') || lowerQuery.includes('nutrition') || lowerQuery.includes('food') || lowerQuery.includes('eat')) {
      return fallbackResponses.diet;
    } else {
      // Try to get personalized recommendations
      const recommendations = getPersonalizedRecommendations(userData, 3);
      
      if (recommendations.length > 0) {
        const recommendationText = recommendations.map(rec => 
          `• ${rec.title} - ${rec.reason}`
        ).join('\n');
        
        return {
          content: `Based on your health data, I've identified some areas for improvement. Here are some recommendations:\n\n${recommendationText}`,
          references: []
        };
      }
      
      return fallbackResponses.default;
    }
  }
  
  // Use the most relevant entry as the primary response
  const primaryEntry = relevantEntries[0];
  
  // Get related entries
  const relatedEntries = getRelatedEntries(primaryEntry.id, 2);
  
  // Generate personalized insights
  const personalizedInsights = generatePersonalizedInsights(query, userData);
  
  // Extract references
  const references = extractReferences(primaryEntry.content);
  
  // Format content for response
  let formattedContent = primaryEntry.content;
  
  // Add related topics if available
  if (relatedEntries.length > 0) {
    formattedContent += '\n\nRelated topics: ';
    relatedEntries.forEach(entry => {
      formattedContent += `${entry.title}, `;
    });
    formattedContent = formattedContent.slice(0, -2); // Remove trailing comma and space
  }
  
  // Add personalized insights
  formattedContent += personalizedInsights;
  
  // Return formatted response
  return {
    content: formattedContent,
    references: references.length > 0 ? references : undefined,
    sourceEntryId: primaryEntry.id,
    sourceEntryTitle: primaryEntry.title
  };
}

const DEEP_QUERY_REGEX =
  /\b(program|plan|week|periodiz|progression|skill|rung|handstand|muscle[- ]?up|deload|injury|pain|plateau|recomp|macro|protocol)\b/i;

/**
 * Resolve the cheapest capable Gemini model for a query when set to 'auto'.
 */
export function resolveGeminiModel(requestedModel = 'gemini-2.5-flash-lite', query = '') {
  if (requestedModel && requestedModel !== 'auto') {
    return requestedModel;
  }
  return query.length > 160 || DEEP_QUERY_REGEX.test(query)
    ? 'gemini-2.5-flash'
    : 'gemini-2.5-flash-lite';
}

/**
 * Build a token-budgeted system prompt combining compact physiological telemetry,
 * active skill rungs, WOOP obstacle plans, and verified FitLib Vault excerpts.
 */
export function buildSystemPrompt(userData, userGoals, relevantEntries = []) {
  const systemState = userData?.systemState || getSystemState();
  const readiness =
    userData?.readiness ||
    computeReadinessAssessment(userData?.healthData, userData?.nutritionData, systemState);
  const progression = userData?.progression || computeProgressionSummary(systemState);

  const telemetryBrief = buildAITelemetryBrief({
    healthData: userData?.healthData,
    nutritionData: userData?.nutritionData,
    goals: userGoals,
    readiness,
    progression,
  });

  const aerobicAnalysis =
    userData?.aerobicAnalysis ||
    (userData?.healthData ? analyzeAerobicGoalProgress(userData.healthData) : null);
  const aerobicBrief = aerobicAnalysis ? buildAerobicCoachBrief(aerobicAnalysis) : null;
  if (aerobicBrief) {
    telemetryBrief.aerobicCardioGoal = aerobicBrief;
  }

  const kbContext =
    relevantEntries.length > 0
      ? relevantEntries
          .map((entry) => {
            const cites =
              Array.isArray(entry.citations) && entry.citations.length > 0
                ? `\nVerified citations: ${entry.citations
                    .slice(0, 3)
                    .map((c) => `${c.author || 'Study'} (${c.year || 'n.d.'})${c.doi ? ` ${c.doi}` : ''}`)
                    .join('; ')}`
                : '';
            const keyPts =
              Array.isArray(entry.keyPoints) && entry.keyPoints.length > 0
                ? `\nKey points: ${entry.keyPoints.slice(0, 4).join(' | ')}`
                : '';
            return `[${entry.id}] ${entry.title}${keyPts}\n${trimToTokenBudget(
              entry.summary || entry.content || '',
              240
            )}${cites}`;
          })
          .join('\n\n')
      : 'No matching FitLib Vault entries found.';

  return trimToTokenBudget(
    `You are NEO•VITRU's evidence-based performance coach (Solo-Leveling System Mentor).
RULES:
1. Be direct, crisp, and actionable so the user understands what to do in under 30 seconds.
2. Always anchor recommendations to the user's READINESS ZONE (PEAK = progress, CALIBRATE = -25% volume technical work, RECOVER = deload/Zone 2) and their ACTIVE SKILL RUNG exit criteria.
3. Ground advice in the VERIFIED FITLIB VAULT CONTEXT below; cite node IDs like [X9-GYMNASTICS-CALISTHENICS] when relevant. Never fabricate studies or biometric readings that are null.
4. Structure answers clearly: Verdict -> Exact Next Steps -> Why (Physiology/FitLib citation).

USER TELEMETRY BRIEF (APPLE HEALTH + GOALS + READINESS):
${JSON.stringify(telemetryBrief)}

VERIFIED FITLIB VAULT CONTEXT:
${kbContext}`,
    1900
  );
}

/**
 * Call configured external AI provider (Google Gemini, Production Proxy, OpenAI, or Anthropic)
 */
async function callAIProvider(config, systemPrompt, history, query) {
  const recentHistory = history.slice(-6).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: trimToTokenBudget(m.content, 200),
  }));

  if (config.provider === 'proxy') {
    const response = await fetch(config.endpoint || '/api/coach', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        query,
        systemPrompt,
        history: recentHistory,
        model: config.model || 'auto',
        mode: DEEP_QUERY_REGEX.test(query) ? 'deep' : 'auto',
      }),
    });

    if (!response.ok) {
      throw new Error(`Coach Proxy error (${response.status})`);
    }
    const data = await response.json();
    if (!data?.content) throw new Error('Empty response from Coach Proxy');
    return { content: data.content, modelUsed: data.model || config.model };
  }

  if (config.provider === 'gemini') {
    const model = resolveGeminiModel(config.model, query);
    const baseUrl = (config.endpoint || DEFAULT_PROVIDER_SETTINGS.gemini.endpoint).replace(/\/$/, '');
    const url = `${baseUrl}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(
      config.apiKey
    )}`;

    const contents = [
      ...recentHistory.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: query }] },
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 750,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error (${response.status})`);
    }
    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error('Empty response from Gemini API');
    return { content, modelUsed: model };
  }

  if (config.provider === 'anthropic') {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 700,
        system: systemPrompt,
        messages: [...recentHistory, { role: 'user', content: query }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error (${response.status})`);
    }
    const data = await response.json();
    const content = data?.content?.[0]?.text;
    if (!content) throw new Error('Empty response from Anthropic API');
    return { content, modelUsed: config.model };
  }

  // OpenAI-compatible chat completions endpoint
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...recentHistory,
        { role: 'user', content: query },
      ],
      max_tokens: 700,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error (${response.status})`);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI API');
  return { content, modelUsed: config.model };
}

/**
 * Enrich search results with any directly linked FitLib node IDs from the user's active goal rung.
 */
function collectRelevantWithGoalRefs(query, userContext, userGoals, limit = 4) {
  const searched = findRelevantKnowledge(query, userContext, limit);
  const kb = getKnowledgeBase();
  const seen = new Set(searched.map((e) => e.id));
  const combined = [...searched];

  if (userGoals && typeof userGoals === 'object' && combined.length < limit) {
    Object.values(userGoals).forEach((goal) => {
      const rung = goal?.rungs?.[goal?.currentRungIndex];
      const refs = Array.isArray(rung?.kbRefs) ? rung.kbRefs : [];
      refs.forEach((refId) => {
        if (combined.length < limit && !seen.has(refId) && kb[refId]) {
          seen.add(refId);
          combined.push(kb[refId]);
        }
      });
    });
  }

  return combined.slice(0, limit);
}

/**
 * Generate fitness advice based on user's query, health data, goals, and knowledge base.
 * Uses configured AI provider (Gemini, Proxy, OpenAI, Anthropic) and falls back cleanly to local FitLib RAG.
 * @param {string} query - The user's question
 * @param {Object} userData - User health data
 * @param {Object} userGoals - User goals data
 * @returns {Promise<Object>} - Response object with role, content, references, and source metadata
 */
export const generateFitnessAdvice = async (query, userData, userGoals) => {
  const rateCheck = checkRateLimit();
  if (!rateCheck.allowed) {
    const seconds = Math.max(1, Math.ceil(rateCheck.retryAfterMs / 1000));
    return {
      role: 'assistant',
      content: `Rate limit reached. Please wait ${seconds}s before sending another query.`,
    };
  }

  if (!isKnowledgeBaseReady()) {
    await loadDefaultKnowledgeBase();
  }

  const processedUserData = { ...(userData || {}) };
  if (userData?.healthData && !userData.enhancementMetrics) {
    processedUserData.enhancementMetrics = processEnhancementMetrics(userData.healthData);
  }

  const userContext = {
    enhancementMetrics: processedUserData.enhancementMetrics,
    sleep: processedUserData.sleepAnalysis,
    nutrition: processedUserData.nutritionData,
    goals: userGoals,
    habitData: processedUserData.habitData,
  };

  const relevantEntries = isKnowledgeBaseReady()
    ? collectRelevantWithGoalRefs(query, userContext, userGoals, 4)
    : [];

  const history = getConversationHistory();
  appendConversationHistory('user', query);

  const aiConfig = getAIConfig();
  const canCallRemote =
    (aiConfig.provider === 'proxy' && Boolean(aiConfig.endpoint)) ||
    (aiConfig.provider !== 'local' && aiConfig.provider !== 'proxy' && Boolean(aiConfig.apiKey));

  if (canCallRemote) {
    try {
      const systemPrompt = buildSystemPrompt(processedUserData, userGoals, relevantEntries);
      const { content: aiText, modelUsed } = await callAIProvider(
        aiConfig,
        systemPrompt,
        history,
        query
      );
      const extractedRefs = extractReferences(aiText);
      const kbRefs = relevantEntries.map((e) => `${e.id}: ${e.title}`).filter(Boolean);
      const references = [...new Set([...extractedRefs, ...kbRefs])].slice(0, 5);

      appendConversationHistory('assistant', aiText);
      return {
        role: 'assistant',
        content: aiText,
        references: references.length > 0 ? references : undefined,
        sourceEntryId: relevantEntries[0]?.id,
        sourceEntryTitle: relevantEntries[0]?.title,
        provider: aiConfig.provider,
        model: modelUsed,
      };
    } catch (error) {
      console.warn('External AI API unavailable, falling back to local knowledge base:', error);
    }
  }

  // Local Knowledge Base RAG fallback (enriched with readiness context)
  const readiness =
    processedUserData.readiness ||
    computeReadinessAssessment(
      processedUserData.healthData,
      processedUserData.nutritionData,
      processedUserData.systemState || getSystemState()
    );

  const response = isKnowledgeBaseReady()
    ? generateKnowledgeBasedResponse(query, processedUserData, userGoals)
    : (() => {
        const lowerQuery = query.toLowerCase();
        if (lowerQuery.includes('handstand') || lowerQuery.includes('push')) {
          return fallbackResponses.handstand;
        }
        if (lowerQuery.includes('run') || lowerQuery.includes('mile') || lowerQuery.includes('cardio')) {
          return fallbackResponses.run;
        }
        if (lowerQuery.includes('diet') || lowerQuery.includes('nutrition') || lowerQuery.includes('food')) {
          return fallbackResponses.diet;
        }
        return fallbackResponses.default;
      })();

  const readinessPrefix =
    readiness.score !== null
      ? `[System Readiness: ${readiness.score}/100 · ${readiness.zone}] ${readiness.intensityGuidance}\n\n`
      : '';
  const finalContent = `${readinessPrefix}${response.content}`;

  appendConversationHistory('assistant', finalContent);

  return {
    role: 'assistant',
    content: finalContent,
    references: response.references,
    sourceEntryId: response.sourceEntryId,
    sourceEntryTitle: response.sourceEntryTitle,
    provider: 'local',
  };
};