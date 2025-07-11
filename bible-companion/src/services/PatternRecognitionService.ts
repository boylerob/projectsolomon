/**
 * Pattern Recognition Service
 * Handles query normalization, keyword extraction, and similarity calculations
 * for the learning system
 */
export class PatternRecognitionService {
  private static instance: PatternRecognitionService;
  private stopWords: Set<string>;
  
  constructor() {
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'what', 'when', 'where', 'why', 'how',
      'who', 'which', 'that', 'this', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
    ]);
  }
  
  static getInstance(): PatternRecognitionService {
    if (!PatternRecognitionService.instance) {
      PatternRecognitionService.instance = new PatternRecognitionService();
    }
    return PatternRecognitionService.instance;
  }

  /**
   * Normalize a query for pattern matching
   */
  normalizeQuery(query: string): string {
    return query.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word))
      .join(' ');
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word))
      .slice(0, 10); // Limit to top 10 keywords
  }

  /**
   * Calculate similarity between two queries
   */
  calculateSimilarity(query1: string, query2: string): number {
    const keywords1 = new Set(this.extractKeywords(query1));
    const keywords2 = new Set(this.extractKeywords(query2));
    
    const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
    const union = new Set([...keywords1, ...keywords2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Categorize a query based on content
   */
  categorizeQuery(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('pray') || lowerQuery.includes('prayer')) return 'prayer';
    if (lowerQuery.includes('bible') || lowerQuery.includes('scripture')) return 'interpretation';
    if (lowerQuery.includes('how') || lowerQuery.includes('what') || lowerQuery.includes('why')) return 'guidance';
    if (lowerQuery.includes('jesus') || lowerQuery.includes('christ')) return 'christology';
    if (lowerQuery.includes('love') || lowerQuery.includes('forgive')) return 'relationships';
    if (lowerQuery.includes('faith') || lowerQuery.includes('believe')) return 'faith';
    if (lowerQuery.includes('sin') || lowerQuery.includes('wrong')) return 'sin';
    if (lowerQuery.includes('hope') || lowerQuery.includes('joy')) return 'emotions';
    
    return 'general';
  }

  /**
   * Analyze sentiment of text
   */
  analyzeSentiment(text: string): number {
    const positiveWords = ['love', 'joy', 'peace', 'hope', 'faith', 'bless', 'good', 'great', 'wonderful', 'amazing'];
    const negativeWords = ['sin', 'evil', 'sad', 'bad', 'wrong', 'hate', 'anger', 'fear', 'worry', 'anxiety'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    return (positiveCount - negativeCount) / Math.max(words.length, 1);
  }

  /**
   * Calculate complexity level of text
   */
  calculateComplexity(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 1;
    
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
    
    if (avgSentenceLength < 10) return 1;
    if (avgSentenceLength < 15) return 2;
    if (avgSentenceLength < 20) return 3;
    if (avgSentenceLength < 25) return 4;
    return 5;
  }

  /**
   * Generate pattern hash for query
   */
  generatePatternHash(query: string): string {
    const crypto = require('crypto');
    const normalized = this.normalizeQuery(query);
    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  /**
   * Find the best matching pattern from a list
   */
  findBestMatch(query: string, patterns: Array<{ pattern: string; category: string }>): { pattern: string; similarity: number; category: string } | null {
    if (patterns.length === 0) return null;
    
    let bestMatch = null;
    let bestSimilarity = 0;
    
    for (const pattern of patterns) {
      const similarity = this.calculateSimilarity(query, pattern.pattern);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = { ...pattern, similarity };
      }
    }
    
    return bestMatch;
  }

  /**
   * Extract biblical references from text
   */
  extractBiblicalReferences(text: string): string[] {
    const referenceRegex = /([1-3]?\s*[A-Za-z]+\s+\d+:\d+)/gi;
    const matches = text.match(referenceRegex);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Get query intent (what type of question is this?)
   */
  getQueryIntent(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('how do i') || lowerQuery.includes('how can i')) return 'how_to';
    if (lowerQuery.includes('what does') || lowerQuery.includes('what is')) return 'what_is';
    if (lowerQuery.includes('why does') || lowerQuery.includes('why is')) return 'why';
    if (lowerQuery.includes('tell me about') || lowerQuery.includes('explain')) return 'explanation';
    if (lowerQuery.includes('help') || lowerQuery.includes('struggle')) return 'help';
    
    return 'general';
  }
}

export default PatternRecognitionService.getInstance(); 