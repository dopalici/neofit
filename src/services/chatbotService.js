// This service integrates the fitness advisor chatbot with the knowledge base

import { 
  getKnowledgeBase, 
  searchKnowledge, 
  getPersonalizedRecommendations,
  getRelatedEntries,
  isKnowledgeBaseInitialized,
  initializeFromDirectory
} from './knowledgeBaseService';
import { processEnhancementMetrics } from './healthDataProcessor';

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
    
    await initializeFromDirectory(files);
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

/**
 * Generate fitness advice based on user's query and health data
 * @param {string} query - The user's question
 * @param {Object} userData - User health data
 * @param {Object} userGoals - User goals data
 * @returns {Promise<Object>} - Response object with role, content, and references
 */
export const generateFitnessAdvice = async (query, userData, userGoals) => {
  // Check if knowledge base is initialized
  const isKnowledgeReady = isKnowledgeBaseReady();
  
  // Process user data if needed
  let processedUserData = { ...userData };
  
  if (userData?.healthData && !userData.enhancementMetrics) {
    processedUserData.enhancementMetrics = processEnhancementMetrics(userData.healthData);
  }
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate response based on knowledge base or fallback
      const response = isKnowledgeReady 
        ? generateKnowledgeBasedResponse(query, processedUserData, userGoals)
        : (() => {
            console.warn('Knowledge base not initialized, using fallback responses');
            const lowerQuery = query.toLowerCase();
            
            if (lowerQuery.includes('handstand') || lowerQuery.includes('push')) {
              return fallbackResponses.handstand;
            } else if (lowerQuery.includes('run') || lowerQuery.includes('mile') || lowerQuery.includes('cardio')) {
              return fallbackResponses.run;
            } else if (lowerQuery.includes('diet') || lowerQuery.includes('nutrition') || lowerQuery.includes('food')) {
              return fallbackResponses.diet;
            } else {
              return fallbackResponses.default;
            }
          })();
      
      resolve({
        role: 'assistant',
        content: response.content,
        references: response.references,
        sourceEntryId: response.sourceEntryId,
        sourceEntryTitle: response.sourceEntryTitle
      });
    }, 500); // Reduced processing delay
  });
};

// For a real OpenAI/Claude integration, you would implement something like:
/*
export const generateWithAI = async (prompt, userData, userGoals) => {
  try {
    // Find relevant knowledge entries
    const relevantEntries = findRelevantKnowledge(prompt, {
      enhancementMetrics: userData?.enhancementMetrics,
      sleep: userData?.sleepAnalysis,
      nutrition: userData?.nutritionData,
      goals: userGoals
    }, 3);
    
    // Prepare user context for the AI
    const userContext = {
      healthMetrics: userData?.enhancementMetrics ? JSON.stringify(userData.enhancementMetrics) : "No data available",
      sleepData: userData?.sleepAnalysis ? JSON.stringify(userData.sleepAnalysis) : "No data available",
      nutritionData: userData?.nutritionData ? JSON.stringify(userData.nutritionData) : "No data available",
      goals: userGoals ? JSON.stringify(userGoals) : "No specific goals set"
    };
    
    // Format knowledge base entries for context
    const knowledgeContext = relevantEntries.length > 0
      ? relevantEntries.map(entry => `Entry: ${entry.title}\nContent: ${entry.content}\n\n`).join('')
      : "No specific knowledge entries found for this query.";
    
    const systemPrompt = `You are a scientific fitness advisor for an advanced transhumanist fitness app. 
    Provide evidence-based advice with scientific references. Use technical language with a futuristic tone.
    
    The user has the following health metrics:
    ${userContext.healthMetrics}
    
    Sleep data:
    ${userContext.sleepData}
    
    Nutrition data:
    ${userContext.nutritionData}
    
    User goals:
    ${userContext.goals}
    
    Knowledge base context:
    ${knowledgeContext}
    
    Provide a personalized response that integrates the knowledge base information with the user's specific health data.
    Include scientific research support for your recommendations.
    Format each recommendation clearly and provide actionable steps.
    Cite any references at the end in [Author, Year] format.`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800
      })
    });
    
    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('Invalid response from AI service');
    }
    
    const aiResponse = data.choices[0].message.content;
    
    return {
      role: 'assistant',
      content: aiResponse,
      references: extractReferences(aiResponse),
      sourceEntryId: relevantEntries.length > 0 ? relevantEntries[0].id : undefined,
      sourceEntryTitle: relevantEntries.length > 0 ? relevantEntries[0].title : undefined
    };
  } catch (error) {
    console.error('AI API error:', error);
    // Fall back to knowledge-based response
    return generateKnowledgeBasedResponse(prompt, userData, userGoals);
  }
};
*/