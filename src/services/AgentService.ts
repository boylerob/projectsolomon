import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import KnowledgeEnhancementService from './KnowledgeEnhancementService';
import LexiconService, { LexiconResponse } from './LexiconService';
import QuestionParserService, { ParsedQuestion, QuestionAnalysis } from './QuestionParserService';

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
  contextLevel: 'minimal' | 'standard' | 'comprehensive';
  responseStyle: 'conversational' | 'scholarly' | 'pastoral';
  includePersonalApplication: boolean;
  includeFurtherStudy: boolean;
}

class AgentService {
  private questionParser: typeof QuestionParserService;
  private userContext: UserContext | null = null;
  private lexiconService: LexiconService;
  private config: AgentConfig = {
    apiUrl: 'https://us-central1-book-guide-7ef1e.cloudfunctions.net/api/ask',
    contextLevel: 'comprehensive',
    responseStyle: 'pastoral',
    includePersonalApplication: true,
    includeFurtherStudy: true,
  };

  constructor() {
    this.lexiconService = new LexiconService();
    this.questionParser = QuestionParserService;
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

  // ENHANCED: Get immediate response with question analysis
  async getImmediateResponse(question: string, analysis?: QuestionAnalysis): Promise<ImmediateResponse> {
    if (!this.userContext) {
      await this.initializeUserContext();
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

  // ENHANCED: New optimal flow with immediate parsing
  async askQuestion(
    question: string,
    mode: 'chat' | 'summary' | 'deep' = 'chat',
    additionalContext?: string
  ): Promise<AgentResponse> {
    if (!this.userContext) {
      await this.initializeUserContext();
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
      return this.createCompleteResponse(question, immediateResponse, parsedQuestion);
    }

    // STEP 4: For non-factual questions, start AI processing in background
    // Return immediate acknowledgment first, then enhance with AI
    const initialResponse = this.createInitialResponse(question, immediateResponse, parsedQuestion);
    
    // Start AI processing in background (non-blocking)
    this.processWithAIInBackground(question, mode, additionalContext, immediateResponse, parsedQuestion);
    
    return initialResponse;
  }

  // ENHANCED: Create complete response with question analysis
  private createCompleteResponse(question: string, immediateResponse: ImmediateResponse, parsedQuestion?: ParsedQuestion): AgentResponse {
    const response: AgentResponse = {
      content: immediateResponse.text,
      scriptureReferences: immediateResponse.immediateAnswer ? this.extractScriptureReferences(immediateResponse.text) : [],
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
  private createInitialResponse(
    question: string,
    immediateResponse: ImmediateResponse,
    parsedQuestion: ParsedQuestion
  ): AgentResponse {
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
    const context = this.buildContext(question, mode, additionalContext);
    
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
        return this.createCompleteResponse(question, immediateResponse);
      }
      
      throw new Error('Failed to get response from Solomon. Please try again.');
    }
  }

  // Build comprehensive context for the AI
  private buildContext(question: string, mode: string, additionalContext?: string): string {
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
      scriptureReferences: this.extractScriptureReferences(rawResponse),
      personalApplication: await this.generatePersonalApplication(rawResponse, originalQuestion),

      furtherStudy: await this.generateStudyRecommendations(rawResponse, originalQuestion),
      responseType: this.determineResponseType(rawResponse, originalQuestion),
      confidence: 0.85, // This would be calculated based on response quality
      followUpQuestions: await this.generateFollowUpQuestions(rawResponse, originalQuestion),
    };

    return response;
  }

  // Extract scripture references from response
  private extractScriptureReferences(response: string): ScriptureReference[] {
    const references: ScriptureReference[] = [];
    
    // Simple regex to find Bible references (can be enhanced)
    const referenceRegex = /([1-3]?\s*[A-Za-z]+\s+\d+:\d+)/gi;
    const matches = response.match(referenceRegex);
    
    if (matches) {
      matches.forEach(ref => {
        references.push({
          reference: ref,
          text: `[Scripture text for ${ref} would be fetched]`,
          context: `Context for ${ref}`,
          relevance: `Relevance to the question`,
        });
      });
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
    const insights: string[] = [];
    
    if (this.userContext?.recentQuestions.length) {
      const recentQuestions = this.userContext.recentQuestions.length > 5 ? 
        this.userContext.recentQuestions.slice(-5) : 
        this.userContext.recentQuestions;
      insights.push(`Recent questions: ${recentQuestions.join(', ')}`);
    }
    
    return insights;
  }
}

export default new AgentService();
