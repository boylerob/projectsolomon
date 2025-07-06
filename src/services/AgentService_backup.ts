import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import KnowledgeEnhancementService from './KnowledgeEnhancementService';
import LexiconService, { LexiconResponse } from './LexiconService';

// Types for the enhanced agent system
export interface UserContext {
  spiritualMaturity: 'beginner' | 'intermediate' | 'advanced';
  preferredTranslation: string;
  studyTopics: string[];
  prayerRequests: string[];
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
  prayerPrompt?: string;
  furtherStudy?: StudyRecommendation[];
  responseType: 'teaching' | 'encouragement' | 'guidance' | 'correction' | 'prayer';
  confidence: number;
  followUpQuestions: string[];
  immediateResponse?: ImmediateResponse;
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
  includePrayerPrompts: boolean;
  includePersonalApplication: boolean;
  includeFurtherStudy: boolean;
}

class AgentService {
  private userContext: UserContext | null = null;
  private lexiconService: LexiconService;
  private config: AgentConfig = {
    apiUrl: 'https://us-central1-book-guide-7ef1e.cloudfunctions.net/api/ask',
    contextLevel: 'comprehensive',
    responseStyle: 'pastoral',
    includePrayerPrompts: true,
    includePersonalApplication: true,
    includeFurtherStudy: true,
  };

  constructor() {
    this.lexiconService = new LexiconService();
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
      prayerRequests: [],
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

  // NEW: Get immediate response using the three-tier lexicon system
  async getImmediateResponse(question: string): Promise<ImmediateResponse> {
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

  // Enhanced question asking with immediate response + AI processing
  async askQuestion(
    question: string,
    mode: 'chat' | 'summary' | 'deep' = 'chat',
    additionalContext?: string
  ): Promise<AgentResponse> {
    if (!this.userContext) {
      await this.initializeUserContext();
    }

    // Get immediate response first
    const immediateResponse = await this.getImmediateResponse(question);

    // If the immediate response is complete (factual or clarification), 
    // we can return early or provide a simplified AI response
    if (immediateResponse.isComplete) {
      return this.createCompleteResponse(question, immediateResponse);
    }

    // Otherwise, proceed with full AI processing
    return this.processWithAI(question, mode, additionalContext, immediateResponse);
  }

  // Create a complete response for factual/clarification questions
  private createCompleteResponse(question: string, immediateResponse: ImmediateResponse): AgentResponse {
    const response: AgentResponse = {
      content: immediateResponse.text,
      scriptureReferences: immediateResponse.immediateAnswer ? this.extractScriptureReferences(immediateResponse.text) : [],
      personalApplication: immediateResponse.type === 'factual' ? 
        "This information comes directly from the Bible and can help you in your study." : 
        "Take time to reflect on this question and how it applies to your situation.",
      prayerPrompt: immediateResponse.type === 'factual' ? 
        "Thank you, Lord, for Your Word and the wisdom it provides." :
        "Lord, help me to understand what You want me to learn from this question.",
      furtherStudy: [],
      responseType: immediateResponse.type === 'factual' ? 'teaching' : 'guidance',
      confidence: 1.0,
      followUpQuestions: [],
      immediateResponse,
    };

    return response;
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
      prayerPrompt: this.generatePrayerPrompt(rawResponse, originalQuestion),
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

  // Generate prayer prompts
  private generatePrayerPrompt(response: string, question: string): string {
    return "Lord, help me to understand and apply Your truth in my life. Give me wisdom and strength to live according to Your Word. Amen.";
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
    
    if (lowerQuestion.includes('pray') || lowerResponse.includes('pray')) {
      return 'prayer';
    } else if (lowerQuestion.includes('help') || lowerQuestion.includes('struggle')) {
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
}

export default new AgentService();
