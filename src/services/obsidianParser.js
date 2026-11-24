// src/services/obsidianParser.js
// Browser-compatible version (no Node.js fs/path modules)

export function parseObsidianContent(markdownText) {
  // Handle internal links [[Page Name]]
  let processedText = markdownText.replace(
    /\[\[(.*?)\]\]/g,
    (match, pageName) => {
      // Convert to a format your app can use
      return `<a href="#/knowledge/${encodeURIComponent(pageName)}">${pageName}</a>`;
    }
  );

  // Convert headers to HTML headers for better presentation
  processedText = processedText.replace(/^#\s+(.*?)$/gm, '<h1>$1</h1>');
  processedText = processedText.replace(/^##\s+(.*?)$/gm, '<h2>$1</h2>');
  processedText = processedText.replace(/^###\s+(.*?)$/gm, '<h3>$1</h3>');
  
  // Process bold and italic text
  processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  processedText = processedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Process bullet points
  processedText = processedText.replace(/^-\s+(.*?)$/gm, '<li>$1</li>');
  
  return processedText;
}

// Extract internal links from Obsidian content
export function extractLinks(markdownText) {
  const links = [];
  const linkRegex = /\[\[(.*?)\]\]/g;
  let match;
  
  while ((match = linkRegex.exec(markdownText)) !== null) {
    links.push(match[1]);
  }
  
  return [...new Set(links)]; // Remove duplicates
}

// Extract tags from Obsidian content
export function extractTags(markdownText) {
  const tags = [];
  const tagRegex = /#([a-zA-Z0-9_-]+)/g;
  let match;
  
  while ((match = tagRegex.exec(markdownText)) !== null) {
    tags.push(match[1]);
  }
  
  return [...new Set(tags)]; // Remove duplicates
}

// Extract metadata from frontmatter
export function extractMetadata(markdownText) {
  const metadata = {};
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
  const match = markdownText.match(frontmatterRegex);
  
  if (match && match[1]) {
    const frontmatter = match[1];
    const lines = frontmatter.split('\n');
    
    lines.forEach(line => {
      const parts = line.split(':').map(part => part.trim());
      if (parts.length >= 2) {
        const key = parts[0];
        const value = parts.slice(1).join(':').trim();
        metadata[key] = value;
      }
    });
  }
  
  // Extract ID field from specially formatted headers (for your specific format)
  const idMatch = markdownText.match(/\*\*ID:\*\*\s+([A-Z0-9-]+)/);
  if (idMatch && idMatch[1]) {
    metadata.id = idMatch[1];
  }
  
  return metadata;
}

// Import and process a collection of Obsidian markdown files
export async function importObsidianVault(files) {
  const knowledgeBase = {};

  for (const file of files) {
    try {
      const content = await file.text();
      
      // Extract file name (without extension)
      const fileName = file.name.replace('.md', '');
      
      // Process metadata
      const metadata = extractMetadata(content);
      
      // Use ID from metadata if available, otherwise use filename
      const id = metadata.id || fileName;
      
      knowledgeBase[id] = {
        id: id,
        title: metadata.title || fileName,
        content: parseObsidianContent(content),
        links: extractLinks(content),
        tags: extractTags(content),
        metadata: metadata,
        originalFileName: fileName
      };
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
    }
  }

  return knowledgeBase;
}

// Browser-compatible version for processing a collection of files
// This replaces the Node.js filesystem-specific version
export async function processObsidianFiles(files) {
  try {
    const knowledgeBase = {};
    
    for (const file of files) {
      try {
        // Check if it's a markdown file
        if (!file.name.endsWith('.md')) continue;
        
        const content = await file.text();
        
        // Extract file name (without extension)
        const fileName = file.name.replace('.md', '');
        
        // Process metadata
        const metadata = extractMetadata(content);
        
        // Use ID from metadata if available, otherwise use filename
        const id = metadata.id || fileName;
        
        // Extract folder path from file.webkitRelativePath if available
        let category = '';
        if (file.webkitRelativePath) {
          const pathParts = file.webkitRelativePath.split('/');
          // Remove the file name (last part) and the root folder (first part) if present
          if (pathParts.length > 2) {
            pathParts.pop(); // Remove filename
            pathParts.shift(); // Remove root folder
            category = pathParts.join('/');
          }
        }
        
        knowledgeBase[id] = {
          id: id,
          title: metadata.title || fileName,
          content: parseObsidianContent(content),
          links: extractLinks(content),
          tags: extractTags(content),
          metadata: metadata,
          originalFileName: fileName,
          category: category,
          filePath: file.name
        };
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
    
    return knowledgeBase;
  } catch (error) {
    console.error('Error processing Obsidian files:', error);
    throw error;
  }
}

const SEARCH_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'do', 'for', 'from',
  'how', 'i', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or', 'should', 'that',
  'the', 'this', 'to', 'what', 'when', 'with', 'you', 'your'
]);

function escapeRegExp(str = '') {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Search knowledge base for relevant entries using safe multi-field weighted scoring
export function searchKnowledgeBase(knowledgeBase, query, limit = 5) {
  if (!knowledgeBase || Object.keys(knowledgeBase).length === 0 || !query) {
    return [];
  }

  const normalizedQuery = String(query).toLowerCase().trim();
  if (!normalizedQuery) return [];

  const rawTokens = normalizedQuery
    .split(/[^a-z0-9-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);

  const meaningfulTokens = rawTokens.filter((t) => !SEARCH_STOP_WORDS.has(t));
  const searchTerms = meaningfulTokens.length > 0 ? meaningfulTokens : rawTokens;
  if (searchTerms.length === 0) return [];

  const termRegexes = searchTerms.map((term) => new RegExp(escapeRegExp(term), 'g'));
  const results = [];

  Object.values(knowledgeBase).forEach((entry) => {
    if (!entry || typeof entry !== 'object') return;
    const content = String(entry.content || '').toLowerCase();
    const title = String(entry.title || '').toLowerCase();
    const summary = String(entry.summary || '').toLowerCase();
    const id = String(entry.id || '').toLowerCase();
    const category = String(entry.category || '').toLowerCase();
    const keyPointsText = Array.isArray(entry.keyPoints)
      ? entry.keyPoints.join(' ').toLowerCase()
      : '';
    const tags = Array.isArray(entry.tags) ? entry.tags.map((t) => String(t).toLowerCase()) : [];

    let score = 0;
    let matchedTerms = 0;

    // Exact phrase match bonus in title or summary
    if (normalizedQuery.length >= 4) {
      if (title.includes(normalizedQuery)) score += 35;
      else if (summary.includes(normalizedQuery)) score += 18;
    }

    searchTerms.forEach((term, idx) => {
      let termHit = false;
      if (title.includes(term)) {
        score += 14;
        termHit = true;
      }
      if (id.includes(term)) {
        score += 9;
        termHit = true;
      }
      if (category.includes(term)) {
        score += 7;
        termHit = true;
      }
      if (summary.includes(term) || keyPointsText.includes(term)) {
        score += 6;
        termHit = true;
      }
      if (tags.some((tag) => tag.includes(term))) {
        score += 6;
        termHit = true;
      }

      const matches = content.match(termRegexes[idx]);
      if (matches && matches.length > 0) {
        // Diminishing returns for repeated mentions (BM25-style saturation)
        score += Math.min(8, Math.round(Math.log2(matches.length + 1) * 3));
        termHit = true;
      }

      if (termHit) matchedTerms += 1;
    });

    if (score > 0) {
      // Multi-term coverage boost & evidence credibility bonus
      const coverageBoost = searchTerms.length > 1 ? (matchedTerms / searchTerms.length) * 12 : 0;
      const citationBonus = Math.min(4, Number(entry.citationCount) || 0);
      const totalScore = Number((score + coverageBoost + citationBonus).toFixed(2));

      results.push({
        id: entry.id,
        title: entry.title,
        score: totalScore,
        excerpt: entry.summary || generateExcerpt(content, searchTerms[0]),
        category: entry.category,
      });
    }
  });

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

// Generate a relevant excerpt from content based on search term
function generateExcerpt(content, searchTerm, length = 160) {
  const safeContent = String(content || '');
  const index = safeContent.toLowerCase().indexOf(String(searchTerm || '').toLowerCase());

  if (index === -1) {
    return safeContent.slice(0, length) + (safeContent.length > length ? '...' : '');
  }

  const start = Math.max(0, index - 50);
  let excerpt = safeContent.slice(start, start + length);
  if (start > 0) excerpt = '...' + excerpt;
  if (start + length < safeContent.length) excerpt += '...';
  return excerpt;
}

// Find entries by category
export function findEntriesByCategory(knowledgeBase, category) {
  if (!knowledgeBase || !category) return [];
  
  return Object.values(knowledgeBase).filter(entry => 
    entry.category && entry.category.toLowerCase() === category.toLowerCase()
  );
}

// Get categories from knowledge base
export function getCategories(knowledgeBase) {
  if (!knowledgeBase) return [];
  
  const categories = new Set();
  
  Object.values(knowledgeBase).forEach(entry => {
    if (entry.category) {
      categories.add(entry.category);
    }
  });
  
  return Array.from(categories).sort();
}

// Get topics from knowledge base (first-level hierarchy)
export function getTopics(knowledgeBase) {
  if (!knowledgeBase) return [];
  
  // Extract topics from file structure or content organization
  const topics = new Set();
  
  Object.values(knowledgeBase).forEach(entry => {
    // Extract from filename patterns like "A. Topic" or "B. Topic"
    const topicMatch = entry.originalFileName.match(/^([A-Z])\.\s+(.*?)$/);
    if (topicMatch) {
      topics.add(topicMatch[2]);
    }
    
    // Or extract from first-level headers
    if (entry.content) {
      const headerMatch = entry.content.match(/<h1>(.*?)<\/h1>/);
      if (headerMatch) {
        topics.add(headerMatch[1]);
      }
    }
  });
  
  return Array.from(topics).sort();
}

// Helper function to get file extension (replacing path.extname)
export function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

// Helper function to get base name (replacing path.basename)
export function getBaseName(filepath, extension) {
  let base = filepath.split('/').pop();
  if (extension && base.endsWith(extension)) {
    base = base.slice(0, -extension.length);
  }
  return base;
}