// src/services/knowledgeBaseService.js
import { 
  searchKnowledgeBase, 
  processObsidianFiles,
  getCategories, 
  getTopics,
  findEntriesByCategory
} from './obsidianParser';

// In-memory storage for the knowledge base
let fitnessKnowledgeBase = {};
let knowledgeBaseMeta = null;
let isInitialized = false;
const MAX_LOCALSTORAGE_BYTES = 1500000;

/**
 * Store the processed knowledge base in memory (and localStorage only when small enough)
 * @param {Object} processedContent - Processed knowledge base content
 */
export function storeKnowledgeBase(processedContent) {
  fitnessKnowledgeBase = processedContent;
  isInitialized = true;

  try {
    const serialized = JSON.stringify(processedContent);
    if (serialized.length <= MAX_LOCALSTORAGE_BYTES) {
      localStorage.setItem('fitnessKnowledgeBase', serialized);
    } else {
      // Remove stale oversized cache so iOS/Safari WebView storage quota stays healthy
      localStorage.removeItem('fitnessKnowledgeBase');
    }
  } catch (error) {
    console.warn('Skipping localStorage persistence for large knowledge base:', error);
  }
}

/**
 * Get the current knowledge base
 * @returns {Object} The knowledge base content
 */
export function getKnowledgeBase() {
  if (Object.keys(fitnessKnowledgeBase).length === 0) {
    try {
      const stored = localStorage.getItem('fitnessKnowledgeBase');
      if (stored) {
        fitnessKnowledgeBase = JSON.parse(stored);
        isInitialized = true;
      }
    } catch (error) {
      console.error('Failed to load knowledge base from localStorage:', error);
    }
  }
  return fitnessKnowledgeBase;
}

/**
 * Check if the knowledge base is initialized
 * @returns {boolean} True if initialized
 */
export function isKnowledgeBaseInitialized() {
  if (!isInitialized && Object.keys(fitnessKnowledgeBase).length === 0) {
    getKnowledgeBase();
  }
  return isInitialized;
}

let defaultLoadPromise = null;

/**
 * Lazily load the pre-indexed FitLib Vault knowledge base from /knowledge-base.json
 * if no custom vault has been imported yet.
 */
export async function loadDefaultKnowledgeBase() {
  if (isKnowledgeBaseInitialized()) {
    return fitnessKnowledgeBase;
  }

  if (!defaultLoadPromise) {
    defaultLoadPromise = Promise.all([
      fetch("/knowledge-base.json").then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      }),
      fetch("/knowledge-base-meta.json")
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
    ])
      .then(([data, meta]) => {
        if (data && typeof data === "object" && Object.keys(data).length > 0) {
          fitnessKnowledgeBase = data;
          knowledgeBaseMeta = meta;
          isInitialized = true;
        }
        return fitnessKnowledgeBase;
      })
      .catch((error) => {
        console.warn("Could not load default knowledge base:", error);
        defaultLoadPromise = null;
        return fitnessKnowledgeBase;
      });
  }

  return defaultLoadPromise;
}

/**
 * Get summary stats & provenance about the loaded knowledge base
 */
export function getKnowledgeBaseStats() {
  const kb = getKnowledgeBase();
  const entries = Object.values(kb);
  const categories = getCategories(kb);
  const totalCitations = entries.reduce(
    (sum, entry) => sum + (Number(entry?.citationCount) || 0),
    0
  );
  return {
    totalEntries: entries.length,
    totalCitations,
    categories,
    isInitialized,
    meta: knowledgeBaseMeta,
  };
}

/**
 * Initialize the knowledge base from files (browser-compatible)
 * @param {FileList|Array<File>} files - Array or FileList of files from an input element
 * @returns {Object} The initialized knowledge base
 */
export async function initializeFromFiles(files) {
  try {
    const knowledgeBase = await processObsidianFiles(files);
    storeKnowledgeBase(knowledgeBase);
    console.log(`Initialized knowledge base with ${Object.keys(knowledgeBase).length} entries`);
    return knowledgeBase;
  } catch (error) {
    console.error('Failed to initialize knowledge base from files:', error);
    throw error;
  }
}

/**
 * Legacy function - now uses the browser version when possible
 * @param {string} directoryPath - Path or identifier for the directory
 * @returns {Object} The initialized knowledge base 
 */
export async function initializeFromDirectory(directoryPath) {
  // In the browser, this function will need to be replaced by a file picker
  // or server-side implementation. This is just a stub.
  console.warn('initializeFromDirectory is not fully supported in browser environments');
  
  // If running on a server with special permissions, you might fetch from the server
  try {
    // Try to fetch files from a server endpoint that can access the filesystem
    const response = await fetch(`/api/obsidian-files?directory=${encodeURIComponent(directoryPath)}`);
    if (response.ok) {
      const files = await response.json();
      return await initializeFromFiles(files);
    } else {
      throw new Error('Unable to access directory from browser - use file upload instead');
    }
  } catch (error) {
    console.error('Directory access failed:', error);
    throw new Error('Browser cannot directly access filesystem. Please use the file upload method instead.');
  }
}

/**
 * Get a specific entry from the knowledge base by ID
 * @param {string} id - The ID of the entry to retrieve
 * @returns {Object|null} The knowledge base entry or null if not found
 */
export function getKnowledgeBaseEntry(id) {
  const knowledgeBase = getKnowledgeBase();
  return knowledgeBase[id] || null;
}

/**
 * Search the knowledge base for entries matching the given query
 * @param {string} query - The search query
 * @param {number} limit - Maximum number of results to return
 * @returns {Array} Array of search results
 */
export function searchKnowledge(query, limit = 5) {
  const knowledgeBase = getKnowledgeBase();
  return searchKnowledgeBase(knowledgeBase, query, limit);
}

/**
 * Get all categories from the knowledge base
 * @returns {Array} Array of category names
 */
export function getAllCategories() {
  const knowledgeBase = getKnowledgeBase();
  return getCategories(knowledgeBase);
}

/**
 * Get all topics from the knowledge base
 * @returns {Array} Array of topic names
 */
export function getAllTopics() {
  const knowledgeBase = getKnowledgeBase();
  return getTopics(knowledgeBase);
}

/**
 * Get entries by category
 * @param {string} category - The category to filter by
 * @returns {Array} Array of entries in the category
 */
export function getEntriesByCategory(category) {
  const knowledgeBase = getKnowledgeBase();
  return findEntriesByCategory(knowledgeBase, category);
}

/**
 * Find related entries for a given entry ID based on linked references
 * @param {string} entryId - The ID of the entry to find related content for
 * @param {number} limit - Maximum number of related entries to return
 * @returns {Array} Array of related entries
 */
export function getRelatedEntries(entryId, limit = 3) {
  const knowledgeBase = getKnowledgeBase();
  const entry = knowledgeBase[entryId];
  
  if (!entry) return [];
  
  const related = [];
  
  // Check entries that link to this entry
  Object.entries(knowledgeBase).forEach(([id, otherEntry]) => {
    if (id === entryId) return;
    
    // Check if this entry links to the target entry
    if (otherEntry.links && otherEntry.links.includes(entryId)) {
      related.push({
        id: id,
        title: otherEntry.title,
        relationship: 'links to this'
      });
    }
    
    // Check if target entry links to this entry
    if (entry.links && entry.links.includes(id)) {
      related.push({
        id: id,
        title: otherEntry.title,
        relationship: 'linked from this'
      });
    }
  });
  
  // If we don't have enough related entries by links, add some that share tags
  if (related.length < limit && entry.tags && entry.tags.length > 0) {
    Object.entries(knowledgeBase).forEach(([id, otherEntry]) => {
      if (id === entryId || related.some(r => r.id === id)) return;
      
      // Check for shared tags
      if (otherEntry.tags) {
        const sharedTags = entry.tags.filter(tag => otherEntry.tags.includes(tag));
        if (sharedTags.length > 0) {
          related.push({
            id: id,
            title: otherEntry.title,
            relationship: `shares tags: ${sharedTags.join(', ')}`
          });
        }
      }
    });
  }
  
  // If we still don't have enough, check entries in the same category
  if (related.length < limit && entry.category) {
    Object.entries(knowledgeBase).forEach(([id, otherEntry]) => {
      if (id === entryId || related.some(r => r.id === id)) return;
      
      if (otherEntry.category === entry.category) {
        related.push({
          id: id,
          title: otherEntry.title,
          relationship: `same category: ${entry.category}`
        });
      }
    });
  }
  
  // Sort by relationship type (links first, then shared tags, then category)
  related.sort((a, b) => {
    if (a.relationship.includes('links') && !b.relationship.includes('links')) return -1;
    if (!a.relationship.includes('links') && b.relationship.includes('links')) return 1;
    if (a.relationship.includes('tags') && !b.relationship.includes('tags')) return -1;
    if (!a.relationship.includes('tags') && b.relationship.includes('tags')) return 1;
    return 0;
  });
  
  return related.slice(0, limit);
}

/**
 * Get personalized knowledge recommendations based on user health data
 * @param {Object} userData - User health and fitness data
 * @param {number} limit - Maximum number of recommendations to return
 * @returns {Array} Array of recommended knowledge entries
 */
export function getPersonalizedRecommendations(userData, limit = 3) {
  const knowledgeBase = getKnowledgeBase();
  
  if (!userData || Object.keys(knowledgeBase).length === 0) {
    return [];
  }
  
  const recommendations = [];
  
  // Check for specific health metrics that need improvement
  if (userData.enhancementMetrics) {
    // Cardiac health recommendations
    if (userData.enhancementMetrics.cardiacEfficiency?.score < 70) {
      // Search for cardiovascular health entries
      const cardioEntries = Object.entries(knowledgeBase)
        .filter(([_, entry]) => {
          const content = entry.content.toLowerCase();
          return content.includes('cardio') || 
                 content.includes('heart') || 
                 content.includes('cardiovascular');
        })
        .map(([id, entry]) => ({
          id,
          title: entry.title,
          reason: 'May help improve your cardiac efficiency'
        }));
      
      recommendations.push(...cardioEntries);
    }
    
    // Endurance recommendations
    if (userData.enhancementMetrics.enduranceMatrix?.score < 70) {
      // Search for endurance-related entries
      const enduranceEntries = Object.entries(knowledgeBase)
        .filter(([_, entry]) => {
          const content = entry.content.toLowerCase();
          return content.includes('endurance') || 
                 content.includes('stamina') ||
                 content.includes('vo2max');
        })
        .map(([id, entry]) => ({
          id,
          title: entry.title,
          reason: 'Could help improve your endurance metrics'
        }));
      
      recommendations.push(...enduranceEntries);
    }
    
    // Strength recommendations
    if (userData.enhancementMetrics.forceOutput?.score < 70) {
      // Search for strength-related entries
      const strengthEntries = Object.entries(knowledgeBase)
        .filter(([_, entry]) => {
          const content = entry.content.toLowerCase();
          return content.includes('strength') || 
                 content.includes('resistance') ||
                 content.includes('muscle');
        })
        .map(([id, entry]) => ({
          id,
          title: entry.title,
          reason: 'Could help improve your strength metrics'
        }));
      
      recommendations.push(...strengthEntries);
    }
  }
  
  // Sleep recommendations
  if (userData.sleepAnalysis && userData.sleepAnalysis.quality === 'SUBOPTIMAL') {
    const sleepEntries = Object.entries(knowledgeBase)
      .filter(([_, entry]) => {
        const content = entry.content.toLowerCase();
        return content.includes('sleep') || 
               content.includes('recovery') ||
               content.includes('circadian');
      })
      .map(([id, entry]) => ({
        id,
        title: entry.title,
        reason: 'May help improve your sleep quality'
      }));
    
    recommendations.push(...sleepEntries);
  }
  
  // Nutrition recommendations based on deficits
  if (userData.nutritionData) {
    const proteinPercentage = userData.nutritionData.protein?.consumed / userData.nutritionData.protein?.goal * 100 || 0;
    
    if (proteinPercentage < 80) {
      const proteinEntries = Object.entries(knowledgeBase)
        .filter(([_, entry]) => {
          const content = entry.content.toLowerCase();
          return content.includes('protein') || 
                 (content.includes('nutrition') && content.includes('muscle'));
        })
        .map(([id, entry]) => ({
          id,
          title: entry.title,
          reason: 'Could help optimize your protein intake'
        }));
      
      recommendations.push(...proteinEntries);
    }
    
    // Check for calorie deficit/surplus issues
    const caloriePercentage = userData.nutritionData.calories?.consumed / userData.nutritionData.calories?.goal * 100 || 0;
    if (caloriePercentage < 80 || caloriePercentage > 120) {
      const calorieEntries = Object.entries(knowledgeBase)
        .filter(([_, entry]) => {
          const content = entry.content.toLowerCase();
          return content.includes('calorie') || 
                 content.includes('energy balance') ||
                 content.includes('metabolic');
        })
        .map(([id, entry]) => ({
          id,
          title: entry.title,
          reason: caloriePercentage < 80 
            ? 'Could help with optimal calorie intake'
            : 'May help with managing calorie surplus'
        }));
      
      recommendations.push(...calorieEntries);
    }
  }
  
  // Check for habit-related recommendations
  if (userData.habitData && userData.habitData.streakData) {
    const currentStreak = userData.habitData.streakData.currentStreak || 0;
    
    if (currentStreak < 3) {
      // Recommend habit formation content
      const habitEntries = Object.entries(knowledgeBase)
        .filter(([_, entry]) => {
          const content = entry.content.toLowerCase();
          return content.includes('habit') || 
                 content.includes('consistency') ||
                 content.includes('adherence');
        })
        .map(([id, entry]) => ({
          id,
          title: entry.title,
          reason: 'May help establish consistent fitness habits'
        }));
      
      recommendations.push(...habitEntries);
    }
  }
  
  // User goals-specific recommendations
  if (userData.userGoals) {
    Object.entries(userData.userGoals).forEach(([goalId, goal]) => {
      // Based on goal type, recommend relevant content
      if (goal.type === 'strength') {
        const strengthEntries = Object.entries(knowledgeBase)
          .filter(([_, entry]) => {
            const content = entry.content.toLowerCase();
            // More specific to the actual goal
            return content.includes(goal.name.toLowerCase()) || 
                   (content.includes('strength') && content.includes('progression'));
          })
          .slice(0, 2) // Limit to top 2 for each goal
          .map(([id, entry]) => ({
            id,
            title: entry.title,
            reason: `Relevant to your ${goal.name} goal`
          }));
        
        recommendations.push(...strengthEntries);
      } else if (goal.type === 'endurance') {
        const enduranceEntries = Object.entries(knowledgeBase)
          .filter(([_, entry]) => {
            const content = entry.content.toLowerCase();
            return content.includes('endurance') || 
                   content.includes('cardio') ||
                   content.includes('running');
          })
          .slice(0, 2)
          .map(([id, entry]) => ({
            id,
            title: entry.title,
            reason: `Relevant to your ${goal.name} goal`
          }));
        
        recommendations.push(...enduranceEntries);
      }
    });
  }
  
  // Remove duplicates by ID
  const uniqueRecommendations = recommendations.filter((rec, index, self) => 
    index === self.findIndex(r => r.id === rec.id)
  );
  
  // Return limited number of recommendations
  return uniqueRecommendations.slice(0, limit);
}