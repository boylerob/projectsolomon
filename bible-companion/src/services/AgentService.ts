import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import KnowledgeEnhancementService from './KnowledgeEnhancementService';
import LexiconService, { LexiconResponse } from './LexiconService';
import QuestionParserService, { ParsedQuestion, QuestionAnalysis } from './QuestionParserService';
import { LocalLLMService, ClarificationContext } from './LocalLLMService';
import JesusQuotesService, { JesusQuoteSearchResult } from './JesusQuotesService';

// Cloud data interfaces
export interface CloudBibleSearchResult {
  verses: Array<{
    reference: string;
    text: string;
    book: string;
    chapter: number;
    verse: number;
  }>;
  totalResults: number;
  searchTerm: string;
  processingTime: number;
}

export interface CloudLemmatizationResult {
  baseForm: string;
  variations: string[];
  biblicalForms: string[];
  searchResults: CloudBibleSearchResult;
}

export interface CloudCacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// Learning system interfaces
export interface LearningQuery {
  originalQuery: string;
  aiResponse: string;
  biblicalReferences: ScriptureReference[];
  userContext: UserContext;
  patternHash: string;
  successMetrics?: {
    userRating?: number;
    followUpQuestions: string[];
    sessionLength: number;
  };
}

export interface SimilarQuery {
  patternHash: string;
  originalQuery: string;
  responseSummary: string;
  biblicalReferences: any;
  usageCount: number;
  category: string;
  similarity: number;
}

// Types for the enhanced agent system
export interface UserContext {
  spiritualMaturity: 'beginner' | 'intermediate' | 'advanced';
  preferredTranslation: string;
  studyTopics: string[];
  recentQuestions: string[];
  sessionHistory: ConversationSession[];
  preferredTone?: 'friendly' | 'scholarly' | 'pastoral' | 'casual';
  interactionStyle?: 'direct' | 'conversational' | 'reflective';
  recentPhrases?: string[];
}

export interface ConversationSession {
  id: string;
  timestamp: Date;
  question: string;
  response: AgentResponse;
  followUpQuestions?: string[];
  userRating?: number;
}

export interface AgentResponse {
  content: string;
  scriptureReferences: ScriptureReference[];
  personalApplication: string;
  furtherStudy?: StudyRecommendation[];
  responseType: 'teaching' | 'encouragement' | 'guidance' | 'correction';
  confidence: number;
  followUpQuestions: string[];
  immediateResponse?: ImmediateResponse;
  questionAnalysis?: QuestionAnalysis; // NEW: Include question analysis
  processingTime?: number; // NEW: Track processing time
}

export interface ImmediateResponse {
  text: string;
  type: 'factual' | 'conversational' | 'clarification';
  immediateAnswer?: any;
  isComplete: boolean;
}

export interface ScriptureReference {
  reference: string;
  text: string;
  context: string;
  relevance: string;
}

export interface StudyRecommendation {
  topic: string;
  scriptures: string[];
  resources: string[];
  estimatedTime: string;
}

export interface AgentConfig {
  apiUrl: string;
  cloudBackendUrl: string;
  contextLevel: 'minimal' | 'standard' | 'comprehensive';
  responseStyle: 'conversational' | 'scholarly' | 'pastoral';
  includePersonalApplication: boolean;
  includeFurtherStudy: boolean;
}

/**
 * Biblical Authority Ranking System
 * Assigns priority weights to biblical sources based on theological authority
 */
export interface BiblicalAuthorityRanking {
  source: string;
  authorityLevel: number; // 1-10 scale, 10 being highest
  category: 'messiah' | 'apostles' | 'prophets' | 'kings' | 'patriarchs' | 'disciples' | 'followers' | 'other';
  description: string;
}

export class BiblicalAuthorityService {
  private authorityRankings: Map<string, BiblicalAuthorityRanking> = new Map();

  constructor() {
    this.initializeAuthorityRankings();
  }

  /**
   * Initialize the biblical authority ranking system
   */
  private initializeAuthorityRankings(): void {
    // Messiah - Highest Authority (10)
    this.authorityRankings.set('Jesus', {
      source: 'Jesus',
      authorityLevel: 10,
      category: 'messiah',
      description: 'Direct words of Jesus Christ, the Son of God'
    });

    // Apostles - Very High Authority (9)
    const apostles = ['Paul', 'Peter', 'John', 'James', 'Matthew', 'Mark', 'Luke', 'Andrew', 'Philip', 'Bartholomew', 'Thomas', 'James Son of Alphaeus', 'Simon', 'Judas', 'Matthias'];
    apostles.forEach(apostle => {
      this.authorityRankings.set(apostle, {
        source: apostle,
        authorityLevel: 9,
        category: 'apostles',
        description: 'Apostolic authority - direct witnesses and commissioned by Christ'
      });
    });

    // Major Prophets - High Authority (8)
    const majorProphets = ['Moses', 'Isaiah', 'Jeremiah', 'Ezekiel', 'Daniel'];
    majorProphets.forEach(prophet => {
      this.authorityRankings.set(prophet, {
        source: prophet,
        authorityLevel: 8,
        category: 'prophets',
        description: 'Major prophets - direct revelation from God'
      });
    });

    // Minor Prophets - High Authority (7)
    const minorProphets = ['Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'];
    minorProphets.forEach(prophet => {
      this.authorityRankings.set(prophet, {
        source: prophet,
        authorityLevel: 7,
        category: 'prophets',
        description: 'Minor prophets - inspired revelation from God'
      });
    });

    // Kings and Patriarchs - Medium-High Authority (6)
    const kingsAndPatriarchs = ['David', 'Solomon', 'Abraham', 'Isaac', 'Jacob', 'Joseph', 'Joshua', 'Samuel'];
    kingsAndPatriarchs.forEach(person => {
      this.authorityRankings.set(person, {
        source: person,
        authorityLevel: 6,
        category: person.includes('David') || person.includes('Solomon') ? 'kings' : 'patriarchs',
        description: 'Kings and patriarchs - leaders with divine calling'
      });
    });

    // Disciples and Followers - Medium Authority (5)
    const disciples = ['Mary Magdalene', 'Timothy', 'Titus', 'Silas', 'Barnabas'];
    disciples.forEach(disciple => {
      this.authorityRankings.set(disciple, {
        source: disciple,
        authorityLevel: 5,
        category: 'disciples',
        description: 'Disciples and close followers - eyewitness accounts'
      });
    });

    // Other Biblical Figures - Medium Authority (4)
    const others = ['Adam', 'Noah', 'Job', 'Esther', 'Ruth', 'Nehemiah', 'Ezra'];
    others.forEach(person => {
      this.authorityRankings.set(person, {
        source: person,
        authorityLevel: 4,
        category: 'other',
        description: 'Other biblical figures - historical and narrative accounts'
      });
    });
  }

  /**
   * Get authority ranking for a biblical source
   */
  public getAuthorityRanking(source: string): BiblicalAuthorityRanking | null {
    return this.authorityRankings.get(source) || null;
  }

  /**
   * Calculate authority weight for a response based on biblical sources
   */
  public calculateAuthorityWeight(sources: string[]): number {
    if (!sources || sources.length === 0) {
      return 0.5; // Default weight for non-biblical sources
    }

    let totalWeight = 0;
    let validSources = 0;

    for (const source of sources) {
      const ranking = this.getAuthorityRanking(source);
      if (ranking) {
        totalWeight += ranking.authorityLevel;
        validSources++;
      }
    }

    if (validSources === 0) {
      return 0.5; // Default weight
    }

    // Normalize to 0-1 scale (divide by 10)
    return (totalWeight / validSources) / 10;
  }

  /**
   * Get the highest authority source from a list
   */
  public getHighestAuthoritySource(sources: string[]): string | null {
    if (!sources || sources.length === 0) {
      return null;
    }

    let highestSource: string | null = null;
    let highestLevel = 0;

    for (const source of sources) {
      const ranking = this.getAuthorityRanking(source);
      if (ranking && ranking.authorityLevel > highestLevel) {
        highestLevel = ranking.authorityLevel;
        highestSource = source;
      }
    }

    return highestSource;
  }

  /**
   * Check if a source has high authority (level 8+)
   */
  public isHighAuthority(source: string): boolean {
    const ranking = this.getAuthorityRanking(source);
    return ranking ? ranking.authorityLevel >= 8 : false;
  }

  /**
   * Get all sources by authority level
   */
  public getSourcesByAuthorityLevel(level: number): string[] {
    const sources: string[] = [];
    for (const [source, ranking] of this.authorityRankings) {
      if (ranking.authorityLevel === level) {
        sources.push(source);
      }
    }
    return sources;
  }
}

class AgentService {
  private questionParser: typeof QuestionParserService;
  private userContext: UserContext | null = null;
  private lexiconService: LexiconService;
  private localLLM: LocalLLMService;
  private jesusQuotesService: JesusQuotesService;
  private pendingClarification: {
    originalQuestion: string;
    originalResponse: string;
  } | null = null;
  private config: AgentConfig = {
    apiUrl: 'https://us-central1-book-guide-7ef1e.cloudfunctions.net/api/ask',
    cloudBackendUrl: 'https://solomon-backend-vjwn7wltcq-uc.a.run.app',
    contextLevel: 'comprehensive',
    responseStyle: 'pastoral',
    includePersonalApplication: true,
    includeFurtherStudy: true,
  };

  // Cloud data cache
  private cloudCache: Map<string, CloudCacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.lexiconService = new LexiconService();
    this.questionParser = QuestionParserService;
    this.localLLM = new LocalLLMService();
    this.jesusQuotesService = new JesusQuotesService();
    this.initializeLocalLLM();
    this.initializeJesusQuotes();
  }

  private async initializeLocalLLM() {
    await this.localLLM.initialize();
  }

  private async initializeJesusQuotes() {
    try {
      await this.jesusQuotesService.initialize();
    } catch (error) {
      console.error('Failed to initialize Jesus Quotes Service:', error);
    }
  }

  /**
   * Check if the question can be answered with Jesus quotes
   */
  private async checkForJesusQuotes(question: string): Promise<JesusQuoteSearchResult | null> {
    if (!this.jesusQuotesService.isReady()) {
      return null;
    }

    try {
      // Try smart search first
      const result = await this.jesusQuotesService.smartSearch(question);
      
      // Only return if we found relevant quotes
      if (result.totalFound > 0) {
        return result;
      }

      // Check for specific verse references
      const verseMatch = question.match(/(\w+)\s+(\d+):(\d+)/i);
      if (verseMatch) {
        const [, book, chapter, verse] = verseMatch;
        const verseRef = `${book} ${chapter}:${verse}`;
        const verseResult = await this.jesusQuotesService.searchByVerse(verseRef);
        if (verseResult.totalFound > 0) {
          return verseResult;
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking Jesus quotes:', error);
      return null;
    }
  }

  /**
   * Get relevant Jesus quotes for AI context
   */
  private async getJesusQuotesContext(question: string): Promise<string | null> {
    if (!this.jesusQuotesService.isReady()) {
      return null;
    }

    try {
      const result = await this.jesusQuotesService.smartSearch(question);
      
      if (result.totalFound === 0) {
        return null;
      }

      // Get up to 3 most relevant quotes
      const relevantQuotes = result.quotes.slice(0, 3);
      
      let context = 'Relevant Jesus Quotes:\n';
      relevantQuotes.forEach((quote, index) => {
        context += `${index + 1}. "${quote.quote}" (${quote.reference})\n`;
      });
      
      context += '\nUse these direct quotes from Jesus as the foundation for your response. Jesus\' words carry the highest authority in Christian teaching.';
      
      return context;
    } catch (error) {
      console.error('Error getting Jesus quotes context:', error);
      return null;
    }
  }

  /**
   * Check if a question is likely a clarification response
   */
  private isClarificationQuestion(question: string): boolean {
    // Only treat as clarification if there is a pending clarification context
    if (!this.pendingClarification) return false;

    const trimmed = question.trim();
    const lower = trimmed.toLowerCase();

    // Direct, short answers (yes/no/etc.)
    if (/^(yes|no|that's right|exactly|not really|kind of|sort of|absolutely|definitely)[.!]?$/i.test(trimmed)) {
      return true;
    }

    // Very short, fragmentary responses (not a full question)
    if (trimmed.length < 40 && !trimmed.includes('?')) {
      return true;
    }

    // Starts with a clarification phrase and is not a full question
    if (/^(focus on|specifically|personally|regarding|about|in terms of|my|i want|i need|i'm asking|i am asking|i'm looking|i am looking)/i.test(trimmed) && !trimmed.includes('?') && trimmed.length < 80) {
      return true;
    }

    // Otherwise, not a clarification
    return false;
  }

  /**
   * Handle clarification using local LLM
   */
  private async handleClarification(clarification: string): Promise<AgentResponse> {
    if (!this.pendingClarification) {
      throw new Error('No pending clarification context found');
    }

    try {
      const context: ClarificationContext = {
        originalQuestion: this.pendingClarification.originalQuestion,
        originalResponse: this.pendingClarification.originalResponse,
        userClarification: clarification
      };

      // Use local LLM to refine the response
      const localLLMResponse = await this.localLLM.processClarification(context);
      
      // Create refined response
      const refinedResponse: AgentResponse = {
        content: localLLMResponse.refinedResponse,
        scriptureReferences: await this.extractScriptureReferences(localLLMResponse.refinedResponse),
        personalApplication: 'This refined response incorporates your clarification to provide more targeted guidance.',
        responseType: 'teaching',
        confidence: localLLMResponse.confidence,
        followUpQuestions: [],
        processingTime: localLLMResponse.processingTime
      };

      // Clear pending clarification
      this.pendingClarification = null;
      
      console.log('Clarification processed using Local LLM');
      return refinedResponse;
    } catch (error) {
      console.error('Error processing clarification:', error);
      
      // Fallback: return original response with clarification note
      const fallbackResponse: AgentResponse = {
        content: `${this.pendingClarification!.originalResponse}\n\nNote: I understand you want to clarify: "${clarification}". Let me provide a more focused response.`,
        scriptureReferences: await this.extractScriptureReferences(this.pendingClarification!.originalResponse),
        personalApplication: 'Consider how this clarification helps you better understand the topic.',
        responseType: 'guidance',
        confidence: 0.7,
        followUpQuestions: []
      };
      
      this.pendingClarification = null;
      return fallbackResponse;
    }
  }

  // Initialize user context
  async initializeUserContext(): Promise<UserContext> {
    try {
      const stored = await AsyncStorage.getItem('userContext');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.userContext = parsed;
        return parsed;
      }
    } catch (error) {
      console.error('Error loading user context:', error);
    }

    // Create default context
    const defaultContext: UserContext = {
      spiritualMaturity: 'beginner',
      preferredTranslation: 'ASV',
      studyTopics: [],
      recentQuestions: [],
      sessionHistory: [],
    };

    this.userContext = defaultContext;
    await this.saveUserContext();
    return defaultContext;
  }

  // Save user context
  private async saveUserContext(): Promise<void> {
    if (this.userContext) {
      await AsyncStorage.setItem('userContext', JSON.stringify(this.userContext));
    }
  }

  // Update user context
  async updateUserContext(updates: Partial<UserContext>): Promise<void> {
    if (this.userContext) {
      this.userContext = { ...this.userContext, ...updates };
      await this.saveUserContext();
    }
  }

  // ENHANCED: Get immediate response with question analysis and Jesus quotes
  async getImmediateResponse(question: string, analysis?: QuestionAnalysis): Promise<ImmediateResponse> {
    if (!this.userContext) {
      await this.initializeUserContext();
    }

    // Check for Jesus quotes first (highest priority)
    const jesusQuotesResult = await this.checkForJesusQuotes(question);
    if (jesusQuotesResult && jesusQuotesResult.quotes.length > 0) {
      const quote = jesusQuotesResult.quotes[0]; // Get the most relevant quote
      return {
        text: `Jesus said: "${quote.quote}" (${quote.reference})`,
        type: 'factual',
        immediateAnswer: {
          text: `This is a direct quote from Jesus Christ found in ${quote.reference}. Jesus' words carry the highest authority in Christian teaching.`,
          source: 'Jesus Quotes Database',
          confidence: 0.95
        },
        isComplete: true,
      };
    }

    // Convert AgentService UserContext to LexiconService UserContext
    const lexiconUserContext = {
      spiritualMaturity: this.userContext!.spiritualMaturity,
      conversationHistory: this.userContext!.recentQuestions,
      isFirstQuestion: this.userContext!.recentQuestions.length === 0,
      recentTopics: this.userContext!.studyTopics,
      preferredTone: this.userContext!.preferredTone,
      interactionStyle: this.userContext!.interactionStyle,
      recentPhrases: this.userContext!.recentPhrases,
    };

    // Get lexicon response
    const lexiconResponse = this.lexiconService.getResponse(question, lexiconUserContext);

    // Determine if this is a complete answer or needs AI processing
    let isComplete = false;
    let responseText = lexiconResponse.text;

    if (lexiconResponse.type === 'factual' && lexiconResponse.immediateAnswer) {
      // For factual responses, include the actual answer
      responseText += '\n\n' + lexiconResponse.immediateAnswer.text;
      isComplete = true;
    } else if (lexiconResponse.type === 'clarification') {
      // Clarification questions are complete responses
      isComplete = true;
    } else {
      // Conversational responses need AI processing
      isComplete = false;
    }

    return {
      text: responseText,
      type: lexiconResponse.type === 'factual' ? 'factual' : 
            lexiconResponse.type === 'clarification' ? 'clarification' : 'conversational',
      immediateAnswer: lexiconResponse.immediateAnswer,
      isComplete,
    };
  }

  // NEW: Get second immediate response (acknowledgment) for natural conversation flow
  async getSecondImmediateResponse(question: string, firstResponse?: ImmediateResponse): Promise<ImmediateResponse | null> {
    if (!this.userContext) {
      await this.initializeUserContext();
    }

    // Only provide second response if first was a welcome
    if (!firstResponse || firstResponse.type !== 'conversational') {
      return null;
    }

    // Convert AgentService UserContext to LexiconService UserContext
    const lexiconUserContext = {
      spiritualMaturity: this.userContext!.spiritualMaturity,
      conversationHistory: this.userContext!.recentQuestions,
      isFirstQuestion: false, // This is now the second response
      recentTopics: this.userContext!.studyTopics,
      preferredTone: this.userContext!.preferredTone,
      interactionStyle: this.userContext!.interactionStyle,
      recentPhrases: this.userContext!.recentPhrases,
    };

    // Get acknowledgment response
    const acknowledgmentResponse = this.lexiconService.getResponse(question, lexiconUserContext);

    // Only return if it's an acknowledgment type
    if (acknowledgmentResponse.category === 'acknowledgment') {
      return {
        text: acknowledgmentResponse.text,
        type: 'conversational',
        immediateAnswer: acknowledgmentResponse.immediateAnswer,
        isComplete: false, // This is just an acknowledgment, not a complete answer
      };
    }

    return null;
  }

  // ENHANCED: New optimal flow with immediate parsing and learning system
  async askQuestion(
    question: string,
    mode: 'chat' | 'summary' | 'deep' = 'chat',
    additionalContext?: string
  ): Promise<AgentResponse> {
    if (!this.userContext) {
      await this.initializeUserContext();
    }

    // Check if this is a clarification for a pending question
    if (this.pendingClarification && this.isClarificationQuestion(question)) {
      return this.handleClarification(question);
    }

    // NEW: Check for similar queries in learning database first
    const similarQueries = await this.findSimilarQueries(question);
    if (similarQueries.length > 0 && similarQueries[0].similarity > 0.8) {
      console.log('Found similar query in learning database:', similarQueries[0].originalQuery);
      
      // Use cached response with personalization
      const personalizedResponse = await this.personalizeResponse(similarQueries[0], this.userContext!);
      
      // Store this interaction for learning (even though we used cached response)
      await this.storeLearningQuery({
        originalQuery: question,
        aiResponse: personalizedResponse.content,
        biblicalReferences: personalizedResponse.scriptureReferences,
        userContext: this.userContext!,
        patternHash: this.generatePatternHash(question),
        successMetrics: {
          followUpQuestions: personalizedResponse.followUpQuestions,
          sessionLength: Date.now()
        }
      });
      
      return personalizedResponse;
    }

    // STEP 1: Immediately parse and categorize locally (milliseconds)
    const parsedQuestion = this.questionParser.parseQuestion(question, {
      conversationHistory: this.userContext!.recentQuestions,
      spiritualMaturity: this.userContext!.spiritualMaturity,
      recentTopics: this.userContext!.studyTopics
    });

    console.log('Question Analysis:', this.questionParser.getAnalysisSummary(parsedQuestion));

    // STEP 2: Get immediate response based on categorization
    const immediateResponse = await this.getImmediateResponse(question, parsedQuestion.analysis);

    // STEP 3: If factual question or biblical person, return complete response immediately
    if (parsedQuestion.analysis.responseStrategy === 'immediate_answer' && immediateResponse.isComplete) {
      const response = await this.createCompleteResponse(question, immediateResponse, parsedQuestion);
      
      // NEW: Store for learning
      await this.storeLearningQuery({
        originalQuery: question,
        aiResponse: response.content,
        biblicalReferences: response.scriptureReferences,
        userContext: this.userContext!,
        patternHash: this.generatePatternHash(question),
        successMetrics: {
          followUpQuestions: response.followUpQuestions,
          sessionLength: Date.now()
        }
      });
      
      return response;
    }

    // STEP 4: For non-factual questions, start AI processing in background
    // Return immediate acknowledgment first, then enhance with AI
    const initialResponse = await this.createInitialResponse(question, immediateResponse, parsedQuestion);
    
    // If this is a clarification response, set the pending context immediately
    if (immediateResponse.type === 'clarification') {
      // Store the current question as pending clarification context
      this.pendingClarification = {
        originalQuestion: question,
        originalResponse: immediateResponse.text
      };
    }
    
    // Start AI processing in background (non-blocking)
    this.processWithAIInBackground(question, mode, additionalContext, immediateResponse, parsedQuestion);
    
    return initialResponse;
  }

  // ENHANCED: Create complete response with question analysis
  private async createCompleteResponse(question: string, immediateResponse: ImmediateResponse, parsedQuestion?: ParsedQuestion): Promise<AgentResponse> {
    const response: AgentResponse = {
      content: immediateResponse.text,
      scriptureReferences: immediateResponse.immediateAnswer ? await this.extractScriptureReferences(immediateResponse.text) : [],
      personalApplication: immediateResponse.type === 'factual' ? 
        "This information comes directly from the Bible and can help you in your study." : 
        "Take time to reflect on this question and how it applies to your situation.",

      furtherStudy: [],
      responseType: immediateResponse.type === 'factual' ? 'teaching' : 'guidance',
      confidence: 1.0,
      followUpQuestions: [],
      immediateResponse,
    };

    return response;
  }

  // NEW: Create initial response for conversational questions
  private async createInitialResponse(
    question: string,
    immediateResponse: ImmediateResponse,
    parsedQuestion: ParsedQuestion
  ): Promise<AgentResponse> {
    return {
      content: immediateResponse.text,
      scriptureReferences: [],
      personalApplication: 'I\'m processing your question to provide a thoughtful response...',
      responseType: 'guidance',
      confidence: parsedQuestion.analysis.confidence,
      followUpQuestions: [],
      immediateResponse,
      questionAnalysis: parsedQuestion.analysis,
      processingTime: Date.now()
    };
  }

  // NEW: Process AI in background for enhanced responses
  private async processWithAIInBackground(
    question: string,
    mode: string,
    additionalContext: string | undefined,
    immediateResponse: ImmediateResponse,
    parsedQuestion: ParsedQuestion
  ): Promise<void> {
    try {
      const enhancedResponse = await this.processWithAI(question, mode, additionalContext, immediateResponse);
      enhancedResponse.questionAnalysis = parsedQuestion.analysis;
      enhancedResponse.processingTime = Date.now();
      
      // Store for potential clarification refinement
      this.pendingClarification = {
        originalQuestion: question,
        originalResponse: enhancedResponse.content
      };
      
      // NEW: Store for learning
      await this.storeLearningQuery({
        originalQuery: question,
        aiResponse: enhancedResponse.content,
        biblicalReferences: enhancedResponse.scriptureReferences,
        userContext: this.userContext!,
        patternHash: this.generatePatternHash(question),
        successMetrics: {
          followUpQuestions: enhancedResponse.followUpQuestions,
          sessionLength: Date.now()
        }
      });
      
      // Update session history with enhanced response
      await this.updateSessionHistory(question, enhancedResponse);
      
      // Here you could emit an event or use a callback to update the UI
      console.log('AI processing complete for question:', question);
    } catch (error) {
      console.error('Error in background AI processing:', error);
    }
  }

  // Process question with AI (for conversational responses)
  private async processWithAI(
    question: string, 
    mode: string, 
    additionalContext?: string,
    immediateResponse?: ImmediateResponse
  ): Promise<AgentResponse> {
    // Build comprehensive context for the AI
    const context = await this.buildContext(question, mode, additionalContext);
    
    // Create enhanced prompt
    const enhancedPrompt = await this.createEnhancedPrompt(question, context, mode);

    try {
      const response = await axios.post(this.config.apiUrl, {
        prompt: enhancedPrompt,
        contextLevel: mode === 'deep' ? 'comprehensive' : mode === 'summary' ? 'standard' : 'minimal',
        userContext: this.userContext,
        responseFormat: 'structured',
      });

      // Parse and enhance the response
      const agentResponse = await this.parseAndEnhanceResponse(response.data.response, question);
      
      // Include the immediate response if we had one
      if (immediateResponse) {
        agentResponse.immediateResponse = immediateResponse;
      }
      
      // Update user context with this interaction
      await this.updateSessionHistory(question, agentResponse);
      
      return agentResponse;
    } catch (error) {
      console.error('Error asking question:', error);
      
      // If AI fails, return the immediate response as fallback
      if (immediateResponse) {
        return await this.createCompleteResponse(question, immediateResponse);
      }
      
      throw new Error('Failed to get response from Solomon. Please try again.');
    }
  }

  // Build comprehensive context for the AI
  private async buildContext(question: string, mode: string, additionalContext?: string): Promise<string> {
    let context = `User Question: ${question}\n`;
    
    if (this.userContext) {
      context += `\nUser Profile:\n`;
      context += `- Spiritual Maturity: ${this.userContext.spiritualMaturity}\n`;
      context += `- Preferred Translation: ${this.userContext.preferredTranslation}\n`;
      
      if (this.userContext.studyTopics.length > 0) {
        context += `- Recent Study Topics: ${this.userContext.studyTopics.join(', ')}\n`;
      }
      
      if (this.userContext.recentQuestions.length > 0) {
        context += `- Recent Questions: ${this.userContext.recentQuestions.slice(-3).join('; ')}\n`;
      }
    }

    if (additionalContext) {
      context += `\nAdditional Context: ${additionalContext}\n`;
    }

    // Add Jesus quotes context if available
    const jesusQuotesContext = await this.getJesusQuotesContext(question);
    if (jesusQuotesContext) {
      context += `\n${jesusQuotesContext}\n`;
    }

    // Add cloud biblical data context for comprehensive mode
    if (this.config.contextLevel === 'comprehensive') {
      try {
        const cloudContext = await this.buildCloudContext(question, mode);
        if (cloudContext) {
          context += `\nCloud Biblical Data Context:${cloudContext}\n`;
        }
      } catch (error) {
        console.warn('Failed to build cloud context:', error);
        // Continue without cloud context if it fails
      }
    }

    context += `\nResponse Mode: ${mode}\n`;
    context += `Response Style: ${this.config.responseStyle}\n`;
    
    return context;
  }

  // Create enhanced prompt with structured instructions
  private async createEnhancedPrompt(question: string, context: string, mode: string): Promise<string> {
    // Use the KnowledgeEnhancementService to generate a much more sophisticated prompt
    return KnowledgeEnhancementService.generateEnhancedPrompt(question, this.userContext, mode);
  }

  // Parse and enhance the AI response
  private async parseAndEnhanceResponse(rawResponse: string, originalQuestion: string): Promise<AgentResponse> {
    // For now, we'll create a structured response from the raw text
    // In a full implementation, the AI would return structured JSON
    
    const response: AgentResponse = {
      content: rawResponse,
      scriptureReferences: await this.extractScriptureReferences(rawResponse),
      personalApplication: await this.generatePersonalApplication(rawResponse, originalQuestion),

      furtherStudy: await this.generateStudyRecommendations(rawResponse, originalQuestion),
      responseType: this.determineResponseType(rawResponse, originalQuestion),
      confidence: 0.85, // This would be calculated based on response quality
      followUpQuestions: await this.generateFollowUpQuestions(rawResponse, originalQuestion),
    };

    return response;
  }

  // Extract scripture references from response
  private async extractScriptureReferences(response: string): Promise<ScriptureReference[]> {
    const references: ScriptureReference[] = [];
    
    // Simple regex to find Bible references (can be enhanced)
    const referenceRegex = /([1-3]?\s*[A-Za-z]+)\s+(\d+):(\d+)/gi;
    const matches = response.match(referenceRegex);
    
    if (matches) {
      for (const ref of matches) {
        try {
          // Parse the reference to extract book, chapter, verse
          const match = ref.match(/([1-3]?\s*[A-Za-z]+)\s+(\d+):(\d+)/i);
          if (match) {
            const [, book, chapter, verse] = match;
            
            // Use the search endpoint with specific book, chapter, verse
            const response = await axios.get(`${this.config.cloudBackendUrl}/api/search`, {
              params: {
                book: book.trim(),
                chapter: parseInt(chapter),
                verse: parseInt(verse),
                limit: 1
              },
              timeout: 5000
            });
            
            if (response.data.success && response.data.results && response.data.results.length > 0) {
              const verseData = response.data.results[0];
              references.push({
                reference: ref,
                text: verseData.text,
                context: `Scripture reference found in response`,
                relevance: `Direct biblical support for the answer`,
              });
            } else {
              // Fallback to placeholder if cloud fetch fails
              references.push({
                reference: ref,
                text: `[Scripture text for ${ref} would be fetched]`,
                context: `Context for ${ref}`,
                relevance: `Relevance to the question`,
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch scripture text for ${ref}:`, error);
          // Fallback to placeholder
          references.push({
            reference: ref,
            text: `[Scripture text for ${ref} would be fetched]`,
            context: `Context for ${ref}`,
            relevance: `Relevance to the question`,
          });
        }
      }
    }
    
    return references;
  }

  // Generate personal application suggestions
  private async generatePersonalApplication(response: string, question: string): Promise<string> {
    // Use the KnowledgeEnhancementService for personalized application
    return KnowledgeEnhancementService.generatePersonalizedApplication(question, response, this.userContext);
  }



  // Generate study recommendations
  private async generateStudyRecommendations(response: string, question: string): Promise<StudyRecommendation[]> {
    // Use the KnowledgeEnhancementService for intelligent study recommendations
    const recommendations = await KnowledgeEnhancementService.generateStudyRecommendations(question, this.userContext);
    return recommendations;
  }

  // Determine response type
  private determineResponseType(response: string, question: string): AgentResponse['responseType'] {
    const lowerResponse = response.toLowerCase();
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('help') || lowerQuestion.includes('struggle')) {
      return 'encouragement';
    } else if (lowerQuestion.includes('teach') || lowerQuestion.includes('explain')) {
      return 'teaching';
    } else if (lowerQuestion.includes('wrong') || lowerQuestion.includes('sin')) {
      return 'correction';
    } else {
      return 'guidance';
    }
  }

  // Generate follow-up questions
  private async generateFollowUpQuestions(response: string, question: string): Promise<string[]> {
    // Use the KnowledgeEnhancementService for contextually relevant follow-up questions
    return KnowledgeEnhancementService.generateFollowUpQuestions(question, response, this.userContext);
  }

  // Update session history
  private async updateSessionHistory(question: string, response: AgentResponse): Promise<void> {
    if (!this.userContext) return;

    const session: ConversationSession = {
      id: Date.now().toString(),
      timestamp: new Date(),
      question,
      response,
      followUpQuestions: response.followUpQuestions,
    };

    this.userContext.sessionHistory.push(session);
    this.userContext.recentQuestions.push(question);
    
    // Keep only recent questions
    if (this.userContext.recentQuestions.length > 10) {
      this.userContext.recentQuestions = this.userContext.recentQuestions.slice(-10);
    }

    await this.saveUserContext();
  }

  // Get conversation history
  async getConversationHistory(): Promise<ConversationSession[]> {
    if (!this.userContext) {
      await this.initializeUserContext();
    }
    return this.userContext?.sessionHistory || [];
  }

  // Rate a response
  async rateResponse(sessionId: string, rating: number): Promise<void> {
    if (!this.userContext) return;

    const session = this.userContext.sessionHistory.find(s => s.id === sessionId);
    if (session) {
      session.userRating = rating;
      await this.saveUserContext();
    }
  }

  // Get personalized insights
  async getPersonalizedInsights(): Promise<string[]> {
    if (!this.userContext) {
      await this.initializeUserContext();
    }

    // Use the KnowledgeEnhancementService for sophisticated insights
    return KnowledgeEnhancementService.analyzeGrowthPatterns(this.userContext);
  }

  // Update configuration
  async updateConfig(newConfig: Partial<AgentConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await AsyncStorage.setItem('agentConfig', JSON.stringify(this.config));
  }

  // Get current configuration
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  // NEW: Get question analysis for debugging and insights
  async analyzeQuestion(question: string): Promise<QuestionAnalysis> {
    if (!this.userContext) {
      await this.initializeUserContext();
    }

    const parsedQuestion = this.questionParser.parseQuestion(question, {
      conversationHistory: this.userContext!.recentQuestions,
      spiritualMaturity: this.userContext!.spiritualMaturity,
      recentTopics: this.userContext!.studyTopics
    });

    return parsedQuestion.analysis;
  }

  // NEW: Get processing insights
  getProcessingInsights(): string[] {
    const insights = [
      'Enhanced question analysis with multiple parsing strategies',
      'Immediate response system for instant feedback',
      'Background AI processing for comprehensive answers',
      'Local LLM integration for clarification refinement',
      'Biblical authority ranking system',
      'Personalized response adaptation'
    ];

    // Add Jesus quotes insights if available
    if (this.jesusQuotesService.isReady()) {
      const stats = this.jesusQuotesService.getDatabaseStats();
      if (stats) {
        insights.push(`Jesus Quotes Database: ${stats.totalQuotes} quotes from ${stats.books.length} books`);
        insights.push(`Available topics: ${stats.commonTopics} common themes`);
      }
    }

    // Add recent questions if available
    if (this.userContext?.recentQuestions.length) {
      const recentQuestions = this.userContext.recentQuestions.length > 5 ? 
        this.userContext.recentQuestions.slice(-5) : 
        this.userContext.recentQuestions;
      insights.push(`Recent questions: ${recentQuestions.join(', ')}`);
    }
    
    return insights;
  }

  // ===== CLOUD DATA METHODS =====

  /**
   * Search biblical data using cloud backend
   */
  async searchCloudBibleData(searchTerm: string, options?: {
    limit?: number;
    includeLemmatization?: boolean;
    useCache?: boolean;
  }): Promise<CloudBibleSearchResult> {
    const cacheKey = `bible_search_${searchTerm}_${JSON.stringify(options)}`;
    
    // Check cache first
    if (options?.useCache !== false) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached as CloudBibleSearchResult;
      }
    }

    try {
      const response = await axios.get(`${this.config.cloudBackendUrl}/api/search`, {
        params: {
          query: searchTerm,
          limit: options?.limit || 20
        },
        timeout: 10000
      });

      // Transform the response to match our interface
      const result: CloudBibleSearchResult = {
        verses: response.data.results?.map((item: any) => ({
          reference: `${item.book} ${item.chapter}:${item.verse}`,
          text: item.text,
          book: item.book,
          chapter: item.chapter,
          verse: item.verse
        })) || [],
        totalResults: response.data.count || 0,
        searchTerm,
        processingTime: 0 // Not provided by this backend
      };

      // Cache the result
      this.setCache(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Cloud Bible search failed:', error);
      throw new Error(`Failed to search biblical data: ${error}`);
    }
  }

  /**
   * Get lemmatization data from cloud backend
   */
  async getCloudLemmatization(word: string): Promise<CloudLemmatizationResult> {
    const cacheKey = `lemmatization_${word}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached as CloudLemmatizationResult;
    }

    try {
      // First, search for the word to get biblical forms
      const searchResult = await this.searchCloudBibleData(word, { limit: 10 });
      
      // Extract unique words from search results for lemmatization
      const biblicalForms = new Set<string>();
      searchResult.verses.forEach(verse => {
        const words = verse.text.toLowerCase().split(/\s+/);
        words.forEach(w => {
          if (w.includes(word.toLowerCase()) || word.toLowerCase().includes(w)) {
            biblicalForms.add(w);
          }
        });
      });

      // Get word variations using local verb forms (fallback)
      const variations = this.getWordVariations(word);
      
      const result: CloudLemmatizationResult = {
        baseForm: word,
        variations: Array.from(new Set([word, ...variations])),
        biblicalForms: Array.from(biblicalForms),
        searchResults: searchResult
      };

      // Cache the result
      this.setCache(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Cloud lemmatization failed:', error);
      throw new Error(`Failed to get lemmatization data: ${error}`);
    }
  }

  /**
   * Get word variations using local verb forms dictionary
   */
  private getWordVariations(word: string): string[] {
    // This is a simplified version - in production, you'd use a proper lemmatization library
    const verbForms: { [key: string]: string[] } = {
      'love': ['love', 'loves', 'loved', 'loving'],
      'pray': ['pray', 'prays', 'prayed', 'praying'],
      'believe': ['believe', 'believes', 'believed', 'believing'],
      'trust': ['trust', 'trusts', 'trusted', 'trusting'],
      'serve': ['serve', 'serves', 'served', 'serving'],
      'worship': ['worship', 'worships', 'worshiped', 'worshipping'],
      'praise': ['praise', 'praises', 'praised', 'praising'],
      'bless': ['bless', 'blesses', 'blessed', 'blessing'],
      'forgive': ['forgive', 'forgives', 'forgave', 'forgiving', 'forgiven'],
      'repent': ['repent', 'repents', 'repented', 'repenting'],
      'save': ['save', 'saves', 'saved', 'saving'],
      'heal': ['heal', 'heals', 'healed', 'healing'],
      'teach': ['teach', 'teaches', 'taught', 'teaching'],
      'preach': ['preach', 'preaches', 'preached', 'preaching'],
      'baptize': ['baptize', 'baptizes', 'baptized', 'baptizing'],
      'fast': ['fast', 'fasts', 'fasted', 'fasting'],
      'meditate': ['meditate', 'meditates', 'meditated', 'meditating']
    };

    const lowerWord = word.toLowerCase();
    
    // Direct match
    if (verbForms[lowerWord]) {
      return verbForms[lowerWord];
    }
    
    // Check if word is a variation
    for (const [base, forms] of Object.entries(verbForms)) {
      if (forms.includes(lowerWord)) {
        return forms;
      }
    }
    
    return [word];
  }

  /**
   * Build enhanced context using cloud biblical data
   */
  async buildCloudContext(question: string, mode: string): Promise<string> {
    const contextParts: string[] = [];
    
    try {
      // Extract key terms from the question
      const keyTerms = this.extractKeyTerms(question);
      
      // Search for relevant biblical data for each key term
      for (const term of keyTerms.slice(0, 3)) { // Limit to 3 terms to avoid too many requests
        try {
          const searchResult = await this.searchCloudBibleData(term, { 
            limit: 5, 
            useCache: true 
          });
          
          if (searchResult.verses.length > 0) {
            contextParts.push(`\nRelevant verses for "${term}":`);
            searchResult.verses.slice(0, 3).forEach((verse, index) => {
              contextParts.push(`${index + 1}. ${verse.reference}: "${verse.text}"`);
            });
          }
        } catch (error) {
          console.warn(`Failed to search for term "${term}":`, error);
        }
      }
      
      // Add lemmatization context for important terms
      if (keyTerms.length > 0) {
        try {
          const lemmatization = await this.getCloudLemmatization(keyTerms[0]);
          if (lemmatization.biblicalForms.length > 0) {
            contextParts.push(`\nBiblical word forms for "${keyTerms[0]}": ${lemmatization.biblicalForms.join(', ')}`);
          }
        } catch (error) {
          console.warn(`Failed to get lemmatization for "${keyTerms[0]}":`, error);
        }
      }
      
    } catch (error) {
      console.error('Failed to build cloud context:', error);
    }
    
    return contextParts.join('\n');
  }

  /**
   * Extract key terms from a question for biblical search
   */
  private extractKeyTerms(question: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'what', 'when', 'where', 'why', 'how',
      'who', 'which', 'that', 'this', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
    ]);
    
    const words = question.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
    
    // Remove duplicates and return unique terms
    return Array.from(new Set(words));
  }

  /**
   * Cache management methods
   */
  private setCache(key: string, data: any, ttl?: number): void {
    const entry: CloudCacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      ttl: ttl || this.CACHE_TTL
    };
    
    this.cloudCache.set(key, entry);
    
    // Clean up expired entries
    this.cleanupCache();
  }

  private getFromCache(key: string): any | null {
    const entry = this.cloudCache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cloudCache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cloudCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cloudCache.delete(key);
      }
    }
  }

  /**
   * Clear all cached data
   */
  clearCloudCache(): void {
    this.cloudCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cloudCache.size,
      entries: Array.from(this.cloudCache.keys())
    };
  }

  // ===== LEARNING SYSTEM METHODS =====

  /**
   * Store learning query and response for collective intelligence
   */
  async storeLearningQuery(query: LearningQuery): Promise<void> {
    try {
      await axios.post(`${this.config.cloudBackendUrl}/api/learning/store`, {
        originalQuery: query.originalQuery,
        aiResponse: query.aiResponse,
        biblicalReferences: query.biblicalReferences,
        userContext: query.userContext,
        patternHash: query.patternHash,
        successMetrics: query.successMetrics
      });
      console.log('Learning query stored successfully');
    } catch (error) {
      console.error('Failed to store learning query:', error);
    }
  }

  /**
   * Find similar queries from the learning database
   */
  async findSimilarQueries(query: string): Promise<SimilarQuery[]> {
    try {
      const response = await axios.get(`${this.config.cloudBackendUrl}/api/learning/find-similar`, {
        params: { query, limit: 5 }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Failed to find similar queries:', error);
      return [];
    }
  }

  /**
   * Generate pattern hash for query normalization
   */
  private generatePatternHash(query: string): string {
    const crypto = require('crypto');
    const normalized = query.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .sort()
      .join(' ');
    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  /**
   * Personalize a cached response for the current user context
   */
  private async personalizeResponse(cachedResponse: SimilarQuery, userContext: UserContext): Promise<AgentResponse> {
    // Create a personalized response based on cached data
    const response: AgentResponse = {
      content: cachedResponse.responseSummary,
      scriptureReferences: cachedResponse.biblicalReferences || [],
      personalApplication: `This response is based on similar questions from our learning database. Consider how this applies to your specific situation.`,
      responseType: 'teaching',
      confidence: Math.min(0.9, cachedResponse.similarity),
      followUpQuestions: [],
      processingTime: Date.now()
    };

    // Add personalization based on user context
    if (userContext.spiritualMaturity === 'beginner') {
      response.content += '\n\nAs a beginner, focus on understanding the basic principles here.';
    } else if (userContext.spiritualMaturity === 'advanced') {
      response.content += '\n\nFor deeper study, consider exploring the biblical references provided.';
    }

    return response;
  }
}

export default new AgentService();
