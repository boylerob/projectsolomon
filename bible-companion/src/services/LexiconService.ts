import responseLexicon from '../../assets/response-lexicon.json';
import clarificationLexicon from '../../assets/clarification-lexicon.json';
import ImmediateAnswerService, { ImmediateAnswer } from './ImmediateAnswerService';
import { BiblicalAuthorityService } from './AgentService';

export interface LexiconResponse {
  text: string;
  type: 'immediate' | 'clarification' | 'factual';
  category: string;
  tone: string;
  maturity: string[];
  context: string[];
  immediateAnswer?: ImmediateAnswer;
  confidence?: number;
}

export interface UserContext {
  spiritualMaturity: 'beginner' | 'intermediate' | 'advanced';
  conversationHistory: string[];
  isFirstQuestion: boolean;
  recentTopics: string[];
  preferredTone?: 'friendly' | 'scholarly' | 'pastoral' | 'casual';
  interactionStyle?: 'direct' | 'conversational' | 'reflective';
  recentPhrases?: string[]; // Track recently used phrases to avoid repetition
}

interface LexiconPhrase {
  text: string;
  tone: string;
  maturity: string[];
  context: string[];
  keywords?: string[]; // Keywords that make this phrase relevant
  complexity?: 'simple' | 'moderate' | 'complex';
  emotionalTone?: 'encouraging' | 'neutral' | 'challenging' | 'comforting';
}

interface PhraseScore {
  phrase: LexiconPhrase;
  score: number;
  breakdown: {
    relevance: number;
    contextual: number;
    diversity: number;
    userPreference: number;
    temporal: number;
    biblicalAuthority: number;
  };
}

export class LexiconService {
  private responseLexicon: any;
  private clarificationLexicon: any;
  private immediateAnswerService: ImmediateAnswerService;
  private biblicalAuthorityService: BiblicalAuthorityService;
  private recentPhrases: string[] = []; // Track recent phrases across sessions

  constructor() {
    this.responseLexicon = responseLexicon;
    this.clarificationLexicon = clarificationLexicon;
    this.immediateAnswerService = new ImmediateAnswerService();
    this.biblicalAuthorityService = new BiblicalAuthorityService();
  }

  /**
   * Main method to get the best response for a user question
   */
  public getResponse(userQuestion: string, userContext: UserContext): LexiconResponse {
    // First, check if we can provide an immediate factual answer
    const immediateAnswer = this.immediateAnswerService.getImmediateAnswer(userQuestion);
    if (immediateAnswer) {
      return this.getFactualResponse(userQuestion, userContext, immediateAnswer);
    }

    // Then, determine if we should use clarification or immediate response
    const shouldClarify = this.shouldUseClarification(userQuestion);
    
    if (shouldClarify) {
      return this.getClarificationResponse(userQuestion, userContext);
    } else {
      return this.getImmediateResponse(userQuestion, userContext);
    }
  }

  /**
   * Gets a factual response with immediate answer
   */
  private getFactualResponse(userQuestion: string, userContext: UserContext, immediateAnswer: ImmediateAnswer): LexiconResponse {
    // Get appropriate acknowledgment text for factual questions
    const acknowledgmentText = this.getFactualAcknowledgment(userQuestion, immediateAnswer);
    
    return {
      text: acknowledgmentText,
      type: 'factual',
      category: 'factual',
      tone: 'helpful',
      maturity: ['beginner', 'intermediate', 'advanced'],
      context: ['factual'],
      immediateAnswer: immediateAnswer,
      confidence: 1.0
    };
  }

  /**
   * Gets appropriate acknowledgment text for factual questions
   */
  private getFactualAcknowledgment(question: string, answer: ImmediateAnswer): string {
    const lowerQuestion = question.toLowerCase();
    
    // Different acknowledgments based on question type
    if (answer.type === 'verse') {
      return "Here's that verse for you:";
    }
    
    if (answer.type === 'wordCount') {
      return "I can tell you that right away:";
    }
    
    if (answer.type === 'author') {
      return "Here's what I know about that:";
    }
    
    if (answer.type === 'metadata') {
      return "Here's the information you're looking for:";
    }
    
    // Default acknowledgment
    return "Here's what I found:";
  }

  /**
   * Determines if a question needs clarification before sending to Gemini
   */
  private shouldUseClarification(question: string): boolean {
    const lowerQuestion = question.toLowerCase();
    
    // Check for patterns that should skip clarification
    const skipPatterns = this.clarificationLexicon.clarificationTriggers.skipClarification.patterns;
    const skipKeywords = this.clarificationLexicon.clarificationTriggers.skipClarification.keywords;
    
    // If question matches skip patterns, don't clarify
    for (const pattern of skipPatterns) {
      if (this.matchesPattern(lowerQuestion, pattern)) {
        return false;
      }
    }
    
    // If question contains skip keywords, don't clarify
    for (const keyword of skipKeywords) {
      if (lowerQuestion.includes(keyword.toLowerCase())) {
        return false;
      }
    }
    
    // Check for patterns that should use clarification
    const clarifyPatterns = this.clarificationLexicon.clarificationTriggers.useClarification.patterns;
    const clarifyKeywords = this.clarificationLexicon.clarificationTriggers.useClarification.keywords;
    
    // If question matches clarify patterns, use clarification
    for (const pattern of clarifyPatterns) {
      if (this.matchesPattern(lowerQuestion, pattern)) {
        return true;
      }
    }
    
    // If question contains clarify keywords, use clarification
    for (const keyword of clarifyKeywords) {
      if (lowerQuestion.includes(keyword.toLowerCase())) {
        return true;
      }
    }
    
    // Default: use clarification for questions that seem broad or personal
    return this.isQuestionBroadOrPersonal(lowerQuestion);
  }

  /**
   * Checks if a question matches a pattern (with wildcards)
   */
  private matchesPattern(question: string, pattern: string): boolean {
    // Convert pattern to regex, treating [placeholder] as wildcards
    const regexPattern = pattern
      .replace(/\[.*?\]/g, '.*?') // Replace [placeholder] with .*?
      .replace(/\s+/g, '\\s+'); // Handle multiple spaces
    
    const regex = new RegExp(regexPattern, 'i');
    return regex.test(question);
  }

  /**
   * Determines if a question is broad or personal (default case for clarification)
   */
  private isQuestionBroadOrPersonal(question: string): boolean {
    const broadIndicators = [
      'what does the bible say about',
      'how should i',
      'what is',
      'why does',
      'how do i',
      'is it wrong to',
      'what does god think about',
      'how can i',
      'what should i do about',
      'i feel',
      'i am',
      'i have',
      'i want',
      'i need',
      'i struggle',
      'i wonder',
      'i think'
    ];
    
    return broadIndicators.some(indicator => question.includes(indicator));
  }

  /**
   * Helper to check if a phrase is a direct saying of Jesus
   * This can be improved by tagging phrases in the lexicon or by keyword/context
   */
  private isJesusSaying(phrase: LexiconPhrase): boolean {
    // Check for explicit context or tag
    if (phrase.context && phrase.context.includes('jesus') || phrase.context.includes('messiah')) {
      return true;
    }
    // Heuristic: check for red-letter keywords (e.g., "Jesus said", "Truly, truly", etc.)
    const lowerText = phrase.text.toLowerCase();
    if (lowerText.startsWith('jesus said') || lowerText.startsWith('truly, truly') || lowerText.startsWith('verily, verily')) {
      return true;
    }
    return false;
  }

  /**
   * Gets an immediate response using smart weighting system, prioritizing Jesus's words
   */
  private getImmediateResponse(question: string, userContext: UserContext): LexiconResponse {
    const availablePhrases = this.responseLexicon.responses;
    // Prioritize Jesus's words if available
    const jesusPhrases = availablePhrases.filter((phrase: LexiconPhrase) => this.isJesusSaying(phrase));
    let phrasesToScore = jesusPhrases.length > 0 ? jesusPhrases : availablePhrases;
    // Score and select the best phrase
    const scoredPhrases = this.scorePhrases(phrasesToScore, question, userContext);
    const selectedPhrase = this.selectBestPhrase(scoredPhrases);
    this.updateRecentPhrases(selectedPhrase.phrase.text);
    return {
      text: selectedPhrase.phrase.text,
      type: 'immediate',
      category: this.selectBestCategory(question, userContext),
      tone: selectedPhrase.phrase.tone,
      maturity: selectedPhrase.phrase.maturity,
      context: selectedPhrase.phrase.context,
      confidence: selectedPhrase.score
    };
  }

  /**
   * Scores phrases using multiple factors
   */
  private scorePhrases(phrases: LexiconPhrase[], question: string, userContext: UserContext): PhraseScore[] {
    return phrases.map(phrase => {
      const relevance = this.calculateRelevanceScore(phrase, question);
      const contextual = this.calculateContextualScore(phrase, userContext);
      const diversity = this.calculateDiversityScore(phrase, userContext);
      const userPreference = this.calculateUserPreferenceScore(phrase, userContext);
      const temporal = this.calculateTemporalScore(phrase, userContext);
      const biblicalAuthority = this.calculateBiblicalAuthorityScore(phrase, question);
      
      const totalScore = (
        relevance * 0.30 +      // 30% weight for relevance
        contextual * 0.20 +     // 20% weight for context
        diversity * 0.15 +      // 15% weight for diversity
        userPreference * 0.15 + // 15% weight for user preference
        temporal * 0.05 +       // 5% weight for temporal factors
        biblicalAuthority * 0.15 // 15% weight for biblical authority
      );
      
      return {
        phrase,
        score: totalScore,
        breakdown: {
          relevance,
          contextual,
          diversity,
          userPreference,
          temporal,
          biblicalAuthority
        }
      };
    });
  }

  /**
   * Calculates relevance score based on keyword matching and semantic similarity
   */
  private calculateRelevanceScore(phrase: LexiconPhrase, question: string): number {
    const lowerQuestion = question.toLowerCase();
    const lowerPhrase = phrase.text.toLowerCase();
    
    let score = 0;
    
    // Keyword matching (if phrase has keywords defined)
    if (phrase.keywords) {
      const keywordMatches = phrase.keywords.filter(keyword => 
        lowerQuestion.includes(keyword.toLowerCase())
      ).length;
      score += (keywordMatches / phrase.keywords.length) * 0.6;
    }
    
    // Direct word overlap
    const questionWords = lowerQuestion.split(/\s+/);
    const phraseWords = lowerPhrase.split(/\s+/);
    const commonWords = questionWords.filter(word => 
      phraseWords.includes(word) && word.length > 3
    );
    score += (commonWords.length / Math.max(questionWords.length, phraseWords.length)) * 0.4;
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculates contextual score based on conversation flow and user context
   */
  private calculateContextualScore(phrase: LexiconPhrase, userContext: UserContext): number {
    let score = 0.5; // Base score
    
    // Topic continuity
    if (userContext.recentTopics.length > 0) {
      const recentTopic = userContext.recentTopics[userContext.recentTopics.length - 1];
      if (phrase.text.toLowerCase().includes(recentTopic.toLowerCase())) {
        score += 0.2;
      }
    }
    
    // Conversation flow
    if (userContext.conversationHistory.length > 0) {
      const lastQuestion = userContext.conversationHistory[userContext.conversationHistory.length - 1];
      if (this.isFollowUpQuestion(userContext) && phrase.text.includes('that') || phrase.text.includes('this')) {
        score += 0.15;
      }
    }
    
    // First question handling
    if (userContext.isFirstQuestion && phrase.text.toLowerCase().includes('welcome')) {
      score += 0.25;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculates diversity score to avoid repetition
   */
  private calculateDiversityScore(phrase: LexiconPhrase, userContext: UserContext): number {
    const recentPhrases = [...this.recentPhrases, ...(userContext.recentPhrases || [])];
    
    if (recentPhrases.length === 0) {
      return 1.0; // No repetition possible
    }
    
    // Check for exact repetition
    if (recentPhrases.includes(phrase.text)) {
      return 0.1; // Heavy penalty for exact repetition
    }
    
    // Check for similar phrases (same first few words)
    const phraseStart = phrase.text.toLowerCase().split(' ').slice(0, 3).join(' ');
    const recentStarts = recentPhrases.map(p => p.toLowerCase().split(' ').slice(0, 3).join(' '));
    
    if (recentStarts.includes(phraseStart)) {
      return 0.3; // Penalty for similar starts
    }
    
    // Check for same tone repetition
    const recentTones = recentPhrases.map(p => this.extractTone(p));
    const currentTone = this.extractTone(phrase.text);
    
    if (recentTones.filter(tone => tone === currentTone).length > 2) {
      return 0.5; // Penalty for tone repetition
    }
    
    return 1.0;
  }

  /**
   * Calculates user preference score based on user's interaction style
   */
  private calculateUserPreferenceScore(phrase: LexiconPhrase, userContext: UserContext): number {
    let score = 0.5; // Base score
    
    // Tone preference matching
    if (userContext.preferredTone) {
      if (phrase.tone === userContext.preferredTone) {
        score += 0.3;
      } else if (this.areTonesCompatible(phrase.tone, userContext.preferredTone)) {
        score += 0.15;
      }
    }
    
    // Interaction style matching
    if (userContext.interactionStyle) {
      if (userContext.interactionStyle === 'direct' && phrase.text.length < 50) {
        score += 0.2;
      } else if (userContext.interactionStyle === 'conversational' && phrase.text.includes('?')) {
        score += 0.2;
      } else if (userContext.interactionStyle === 'reflective' && phrase.text.includes('think') || phrase.text.includes('consider')) {
        score += 0.2;
      }
    }
    
    // Complexity matching
    if (phrase.complexity) {
      const complexityMap = { beginner: 0, intermediate: 1, advanced: 2 };
      const phraseComplexityMap = { simple: 0, moderate: 1, complex: 2 };
      const userLevel = complexityMap[userContext.spiritualMaturity];
      const phraseLevel = phraseComplexityMap[phrase.complexity] || 1;
      
      if (Math.abs(userLevel - phraseLevel) <= 1) {
        score += 0.2;
      }
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculates temporal score based on time and conversation length
   */
  private calculateTemporalScore(phrase: LexiconPhrase, userContext: UserContext): number {
    let score = 0.5; // Base score
    
    // Conversation length adaptation
    const conversationLength = userContext.conversationHistory.length;
    
    if (conversationLength === 0) {
      // First interaction - prefer welcoming, longer phrases
      if (phrase.text.length > 30) {
        score += 0.3;
      }
    } else if (conversationLength > 5) {
      // Long conversation - prefer shorter, more direct phrases
      if (phrase.text.length < 40) {
        score += 0.3;
      }
    }
    
    // Time of day consideration (if available)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      // Late night - prefer gentler, shorter responses
      if (phrase.text.length < 50 && (phrase.emotionalTone === 'comforting' || phrase.emotionalTone === 'neutral')) {
        score += 0.2;
      }
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculates biblical authority score based on sources mentioned in the phrase
   */
  private calculateBiblicalAuthorityScore(phrase: LexiconPhrase, question: string): number {
    // Extract potential biblical sources from the phrase and question
    const sources = this.extractBiblicalSources(phrase.text + ' ' + question);
    
    if (sources.length === 0) {
      return 0.5; // Default score for non-biblical content
    }
    
    // Calculate authority weight using the biblical authority service
    const authorityWeight = this.biblicalAuthorityService.calculateAuthorityWeight(sources);
    
    // Boost score for high-authority sources
    const highestSource = this.biblicalAuthorityService.getHighestAuthoritySource(sources);
    if (highestSource && this.biblicalAuthorityService.isHighAuthority(highestSource)) {
      return Math.min(authorityWeight * 1.2, 1.0); // 20% boost for high authority
    }
    
    return authorityWeight;
  }

  /**
   * Extracts biblical sources from text
   */
  private extractBiblicalSources(text: string): string[] {
    const sources: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Check for direct mentions of biblical figures
    const biblicalNames = [
      'jesus', 'christ', 'paul', 'peter', 'john', 'james', 'matthew', 'mark', 'luke',
      'moses', 'david', 'solomon', 'abraham', 'isaac', 'jacob', 'isaiah', 'jeremiah',
      'daniel', 'elijah', 'samuel', 'joshua', 'noah', 'adam', 'job'
    ];
    
    for (const name of biblicalNames) {
      if (lowerText.includes(name)) {
        sources.push(name.charAt(0).toUpperCase() + name.slice(1));
      }
    }
    
    // Check for book references (e.g., "in John", "according to Matthew")
    const bookPatterns = [
      /(?:in|according to|from)\s+(genesis|exodus|leviticus|numbers|deuteronomy|joshua|judges|ruth|samuel|kings|chronicles|ezra|nehemiah|esther|job|psalms|proverbs|ecclesiastes|song|isaiah|jeremiah|lamentations|ezekiel|daniel|hosea|joel|amos|obadiah|jonah|micah|nahum|habakkuk|zephaniah|haggai|zechariah|malachi|matthew|mark|luke|john|acts|romans|corinthians|galatians|ephesians|philippians|colossians|thessalonians|timothy|titus|philemon|hebrews|james|peter|john|jude|revelation)/gi
    ];
    
    for (const pattern of bookPatterns) {
      const matches = lowerText.match(pattern);
      if (matches) {
        // Map book names to likely authors
        const bookAuthorMap: { [key: string]: string } = {
          'genesis': 'Moses', 'exodus': 'Moses', 'leviticus': 'Moses', 'numbers': 'Moses', 'deuteronomy': 'Moses',
          'joshua': 'Joshua', 'judges': 'Samuel', 'ruth': 'Samuel', 'samuel': 'Samuel', 'kings': 'Unknown',
          'chronicles': 'Unknown', 'ezra': 'Ezra', 'nehemiah': 'Nehemiah', 'esther': 'Esther', 'job': 'Job',
          'psalms': 'David', 'proverbs': 'Solomon', 'ecclesiastes': 'Solomon', 'song': 'Solomon',
          'isaiah': 'Isaiah', 'jeremiah': 'Jeremiah', 'lamentations': 'Jeremiah', 'ezekiel': 'Ezekiel',
          'daniel': 'Daniel', 'hosea': 'Hosea', 'joel': 'Joel', 'amos': 'Amos', 'obadiah': 'Obadiah',
          'jonah': 'Jonah', 'micah': 'Micah', 'nahum': 'Nahum', 'habakkuk': 'Habakkuk', 'zephaniah': 'Zephaniah',
          'haggai': 'Haggai', 'zechariah': 'Zechariah', 'malachi': 'Malachi',
          'matthew': 'Matthew', 'mark': 'Mark', 'luke': 'Luke', 'john': 'John', 'acts': 'Luke',
          'romans': 'Paul', 'corinthians': 'Paul', 'galatians': 'Paul', 'ephesians': 'Paul',
          'philippians': 'Paul', 'colossians': 'Paul', 'thessalonians': 'Paul', 'timothy': 'Paul',
          'titus': 'Paul', 'philemon': 'Paul', 'hebrews': 'Unknown', 'james': 'James', 'peter': 'Peter',
          'jude': 'Jude', 'revelation': 'John'
        };
        
        for (const match of matches) {
          const bookName = match.replace(/(?:in|according to|from)\s+/i, '').toLowerCase();
          const author = bookAuthorMap[bookName];
          if (author && author !== 'Unknown' && !sources.includes(author)) {
            sources.push(author);
          }
        }
      }
    }
    
    return sources;
  }

  /**
   * Selects the best phrase from scored options
   */
  private selectBestPhrase(scoredPhrases: PhraseScore[]): PhraseScore {
    // Sort by score (highest first)
    scoredPhrases.sort((a, b) => b.score - a.score);
    
    // Add some randomness to top 3 scores to avoid always picking the same one
    const topPhrases = scoredPhrases.slice(0, 3);
    if (topPhrases.length > 1) {
      // Weighted random selection from top 3
      const weights = topPhrases.map((_, index) => Math.pow(0.7, index)); // 1.0, 0.7, 0.49
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      const random = Math.random() * totalWeight;
      
      let cumulativeWeight = 0;
      for (let i = 0; i < topPhrases.length; i++) {
        cumulativeWeight += weights[i];
        if (random <= cumulativeWeight) {
          return topPhrases[i];
        }
      }
    }
    
    return scoredPhrases[0];
  }

  /**
   * Updates the list of recently used phrases
   */
  private updateRecentPhrases(phraseText: string): void {
    this.recentPhrases.unshift(phraseText);
    // Keep only last 10 phrases
    if (this.recentPhrases.length > 10) {
      this.recentPhrases = this.recentPhrases.slice(0, 10);
    }
  }

  /**
   * Extracts tone from phrase text
   */
  private extractTone(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('wonderful') || lowerText.includes('amazing') || lowerText.includes('great')) {
      return 'enthusiastic';
    }
    if (lowerText.includes('think') || lowerText.includes('consider') || lowerText.includes('reflect')) {
      return 'reflective';
    }
    if (lowerText.includes('help') || lowerText.includes('support') || lowerText.includes('encourage')) {
      return 'supportive';
    }
    if (lowerText.includes('understand') || lowerText.includes('explain') || lowerText.includes('clarify')) {
      return 'explanatory';
    }
    
    return 'neutral';
  }

  /**
   * Checks if two tones are compatible
   */
  private areTonesCompatible(tone1: string, tone2: string): boolean {
    const compatibleGroups = [
      ['friendly', 'casual', 'warm'],
      ['scholarly', 'formal', 'academic'],
      ['pastoral', 'caring', 'supportive']
    ];
    
    return compatibleGroups.some(group => 
      group.includes(tone1) && group.includes(tone2)
    );
  }

  /**
   * Gets a clarification response using smart weighting system, prioritizing Jesus's words
   */
  private getClarificationResponse(question: string, userContext: UserContext): LexiconResponse {
    const availablePhrases = this.clarificationLexicon.responses;
    // Prioritize Jesus's words if available
    const jesusPhrases = availablePhrases.filter((phrase: LexiconPhrase) => this.isJesusSaying(phrase));
    let phrasesToScore = jesusPhrases.length > 0 ? jesusPhrases : availablePhrases;
    // Score and select the best phrase
    const scoredPhrases = this.scorePhrases(phrasesToScore, question, userContext);
    const selectedPhrase = this.selectBestPhrase(scoredPhrases);
    this.updateRecentPhrases(selectedPhrase.phrase.text);
    return {
      text: selectedPhrase.phrase.text,
      type: 'clarification',
      category: this.selectBestClarificationCategory(question, userContext),
      tone: selectedPhrase.phrase.tone,
      maturity: selectedPhrase.phrase.maturity,
      context: selectedPhrase.phrase.context,
      confidence: selectedPhrase.score
    };
  }

  /**
   * Selects the best category for immediate responses
   */
  private selectBestCategory(question: string, userContext: UserContext): string {
    const lowerQuestion = question.toLowerCase();
    
    // Determine question type
    if (userContext.isFirstQuestion) {
      return 'welcome';
    }
    
    if (this.isFollowUpQuestion(userContext)) {
      return 'continuation';
    }
    
    if (this.isBroadQuestion(lowerQuestion)) {
      return 'scope-narrowing';
    }
    
    if (this.isPersonalQuestion(lowerQuestion)) {
      return 'context-seeking';
    }
    
    if (this.needsClarification(lowerQuestion)) {
      return 'clarification';
    }
    
    return 'acknowledgment';
  }

  /**
   * Selects the best category for clarification responses
   */
  private selectBestClarificationCategory(question: string, userContext: UserContext): string {
    const lowerQuestion = question.toLowerCase();
    
    if (this.isBroadQuestion(lowerQuestion)) {
      return 'topicClarification';
    }
    
    if (this.isPersonalQuestion(lowerQuestion)) {
      return 'personalContext';
    }
    
    if (this.containsAbstractTerms(lowerQuestion)) {
      return 'conceptClarification';
    }
    
    if (this.isSituationSpecific(lowerQuestion)) {
      return 'situationSpecific';
    }
    
    return 'scopeRefinement';
  }

  /**
   * Helper methods for question classification
   */
  private isFollowUpQuestion(userContext: UserContext): boolean {
    return userContext.conversationHistory.length > 1;
  }

  private isBroadQuestion(question: string): boolean {
    const broadIndicators = [
      'what does the bible say about',
      'what is',
      'how should i',
      'what does god think about'
    ];
    return broadIndicators.some(indicator => question.includes(indicator));
  }

  private isPersonalQuestion(question: string): boolean {
    const personalIndicators = [
      'i feel',
      'i am',
      'i have',
      'i want',
      'i need',
      'i struggle',
      'i wonder',
      'i think',
      'my',
      'me',
      'myself'
    ];
    return personalIndicators.some(indicator => question.includes(indicator));
  }

  private needsClarification(question: string): boolean {
    const unclearIndicators = [
      'what do you mean',
      'i don\'t understand',
      'confused',
      'unclear'
    ];
    return unclearIndicators.some(indicator => question.includes(indicator));
  }

  private containsAbstractTerms(question: string): boolean {
    const abstractTerms = [
      'love', 'faith', 'grace', 'salvation', 'redemption', 'sanctification',
      'justification', 'holiness', 'righteousness', 'mercy', 'forgiveness'
    ];
    return abstractTerms.some(term => question.includes(term));
  }

  private isSituationSpecific(question: string): boolean {
    const situationIndicators = [
      'my situation',
      'what happened',
      'when this',
      'in this case',
      'my case',
      'my problem',
      'my issue'
    ];
    return situationIndicators.some(indicator => question.includes(indicator));
  }

  /**
   * Checks if phrase context matches user context
   */
  private matchesContext(phraseContexts: string[], userContext: UserContext): boolean {
    // If phrase has no specific contexts, it matches
    if (!phraseContexts || phraseContexts.length === 0) {
      return true;
    }
    
    // Check if any phrase context matches user context
    return phraseContexts.some(context => {
      switch (context) {
        case 'firstQuestion':
          return userContext.isFirstQuestion;
        case 'followUp':
          return !userContext.isFirstQuestion;
        case 'personal':
          return this.isPersonalQuestion(userContext.conversationHistory[userContext.conversationHistory.length - 1] || '');
        case 'broad':
          return this.isBroadQuestion(userContext.conversationHistory[userContext.conversationHistory.length - 1] || '');
        case 'theological':
          return this.containsAbstractTerms(userContext.conversationHistory[userContext.conversationHistory.length - 1] || '');
        case 'practical':
          return userContext.conversationHistory.some(q => q.includes('how') || q.includes('what should'));
        default:
          return true;
      }
    });
  }

  /**
   * Processes placeholders in clarification phrases
   */
  private processPlaceholders(text: string, question: string): string {
    // Extract topic from question
    const topic = this.extractTopic(question);
    
    // Extract term from question
    const term = this.extractTerm(question);
    
    return text
      .replace(/\[topic\]/g, topic)
      .replace(/\[term\]/g, term);
  }

  /**
   * Extracts the main topic from a question
   */
  private extractTopic(question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    // Common patterns for topic extraction
    const patterns = [
      /what does the bible say about (.+)/i,
      /what is (.+)/i,
      /how should i (.+)/i,
      /what does god think about (.+)/i,
      /how do i (.+)/i,
      /is it wrong to (.+)/i,
      /how can i (.+)/i,
      /what should i do about (.+)/i
    ];
    
    for (const pattern of patterns) {
      const match = question.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Fallback: extract key words
    const words = question.split(' ');
    const keyWords = words.filter(word => 
      word.length > 3 && 
      !['what', 'does', 'bible', 'say', 'about', 'how', 'should', 'think', 'wrong', 'right'].includes(word.toLowerCase())
    );
    
    return keyWords.slice(0, 2).join(' ') || 'this';
  }

  /**
   * Extracts a specific term from a question
   */
  private extractTerm(question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    // Look for quoted terms
    const quotedMatch = question.match(/"([^"]+)"/);
    if (quotedMatch) {
      return quotedMatch[1];
    }
    
    // Look for terms in brackets
    const bracketMatch = question.match(/\[([^\]]+)\]/);
    if (bracketMatch) {
      return bracketMatch[1];
    }
    
    // Fallback to topic extraction
    return this.extractTopic(question);
  }
}

export default LexiconService; 