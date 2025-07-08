import axios from 'axios';
import LexiconService from './LexiconService';
import QuestionParserService from './QuestionParserService';

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
  questionAnalysis?: any;
  processingTime?: number;
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

class AgentServiceWeb {
  private questionParser: any;
  private userContext: UserContext | null = null;
  private lexiconService: any;
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
    this.questionParser = QuestionParserService;
  }

  // Initialize user context (simplified for web)
  async initializeUserContext(): Promise<UserContext> {
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
    return defaultContext;
  }

  // Update user context
  async updateUserContext(updates: Partial<UserContext>): Promise<void> {
    if (this.userContext) {
      this.userContext = { ...this.userContext, ...updates };
    }
  }

  // Get immediate response with question analysis
  async getImmediateResponse(question: string, analysis?: any): Promise<ImmediateResponse> {
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

  // Main question processing flow
  async askQuestion(
    question: string,
    mode: 'chat' | 'summary' | 'deep' = 'chat',
    additionalContext?: string
  ): Promise<AgentResponse> {
    if (!this.userContext) {
      await this.initializeUserContext();
    }

    const startTime = Date.now();

    // STEP 1: Immediately parse and categorize locally (milliseconds)
    const parsedQuestion = this.questionParser.parseQuestion(question, {
      conversationHistory: this.userContext!.recentQuestions,
      spiritualMaturity: this.userContext!.spiritualMaturity,
      recentTopics: this.userContext!.studyTopics
    });

    console.log('Question Analysis:', this.questionParser.getAnalysisSummary(parsedQuestion));

    // STEP 2: Get immediate response based on categorization
    const immediateResponse = await this.getImmediateResponse(question, parsedQuestion.analysis);

    // STEP 3: If immediate response is complete, return it
    if (immediateResponse.isComplete) {
      const response = this.createCompleteResponse(question, immediateResponse, parsedQuestion);
      response.processingTime = Date.now() - startTime;
      
      // Update context
      if (this.userContext) {
        this.userContext.recentQuestions.push(question);
        await this.updateSessionHistory(question, response);
      }
      
      return response;
    }

    // STEP 4: Process with AI for enhanced response
    const enhancedResponse = await this.processWithAI(question, mode, additionalContext, immediateResponse);
    enhancedResponse.processingTime = Date.now() - startTime;
    
    // Update context
    if (this.userContext) {
      this.userContext.recentQuestions.push(question);
      await this.updateSessionHistory(question, enhancedResponse);
    }
    
    return enhancedResponse;
  }

  private createCompleteResponse(question: string, immediateResponse: ImmediateResponse, parsedQuestion?: any): AgentResponse {
    return {
      content: immediateResponse.text,
      scriptureReferences: [],
      personalApplication: "Consider how this applies to your life today.",
      responseType: immediateResponse.type === 'factual' ? 'teaching' : 'guidance',
      confidence: 0.9,
      followUpQuestions: [
        "What questions do you have about this?",
        "How does this relate to your faith journey?",
        "Would you like to explore this topic further?"
      ],
      immediateResponse,
      questionAnalysis: parsedQuestion?.analysis
    };
  }

  private async processWithAI(
    question: string, 
    mode: string, 
    additionalContext?: string,
    immediateResponse?: ImmediateResponse
  ): Promise<AgentResponse> {
    try {
      const context = this.buildContext(question, mode, additionalContext);
      const prompt = await this.createEnhancedPrompt(question, context, mode);
      
      const response = await axios.post(this.config.apiUrl, {
        question: prompt,
        context: context,
        mode: mode
      });

      const rawResponse = response.data?.response || response.data;
      return await this.parseAndEnhanceResponse(rawResponse, question);

    } catch (error) {
      console.error('AI processing failed:', error);
      
      // Fallback to immediate response
      return this.createCompleteResponse(question, immediateResponse || {
        text: "I'm having trouble processing that right now. Could you rephrase your question?",
        type: 'clarification',
        isComplete: true
      });
    }
  }

  private buildContext(question: string, mode: string, additionalContext?: string): string {
    let context = `User Question: ${question}\n`;
    context += `Mode: ${mode}\n`;
    context += `User Spiritual Maturity: ${this.userContext?.spiritualMaturity}\n`;
    context += `Preferred Translation: ${this.userContext?.preferredTranslation}\n`;
    
    if (this.userContext?.recentQuestions.length > 0) {
      context += `Recent Questions: ${this.userContext.recentQuestions.slice(-3).join(', ')}\n`;
    }
    
    if (additionalContext) {
      context += `Additional Context: ${additionalContext}\n`;
    }
    
    return context;
  }

  private async createEnhancedPrompt(question: string, context: string, mode: string): Promise<string> {
    return `You are Solomon, an AI Bible companion designed to provide wise, compassionate, and biblically-sound guidance.

${context}

Please provide a response that is:
- Biblically accurate and well-reasoned
- Compassionate and encouraging
- Practical and applicable to daily life
- Appropriate for the user's spiritual maturity level

Question: ${question}`;
  }

  private async parseAndEnhanceResponse(rawResponse: string, originalQuestion: string): Promise<AgentResponse> {
    const scriptureReferences = this.extractScriptureReferences(rawResponse);
    const personalApplication = await this.generatePersonalApplication(rawResponse, originalQuestion);
    const prayerPrompt = this.generatePrayerPrompt(rawResponse, originalQuestion);
    const studyRecommendations = await this.generateStudyRecommendations(rawResponse, originalQuestion);
    const responseType = this.determineResponseType(rawResponse, originalQuestion);
    const followUpQuestions = await this.generateFollowUpQuestions(rawResponse, originalQuestion);

    return {
      content: rawResponse,
      scriptureReferences,
      personalApplication,
      prayerPrompt,
      furtherStudy: studyRecommendations,
      responseType,
      confidence: 0.85,
      followUpQuestions
    };
  }

  private extractScriptureReferences(response: string): ScriptureReference[] {
    const references: ScriptureReference[] = [];
    const versePattern = /([1-3]?\s*[A-Za-z]+\s+\d+:\d+)/g;
    const matches = response.match(versePattern);
    
    if (matches) {
      matches.forEach(ref => {
        references.push({
          reference: ref,
          text: `[Scripture reference: ${ref}]`,
          context: "Referenced in response",
          relevance: "Direct biblical support"
        });
      });
    }
    
    return references;
  }

  private async generatePersonalApplication(response: string, question: string): Promise<string> {
    return "Consider how this wisdom applies to your current situation and relationships. What steps can you take today to live out these biblical principles?";
  }

  private generatePrayerPrompt(response: string, question: string): string {
    return "Lord, help me to understand and apply Your wisdom in my daily life. Give me the strength and guidance to walk in Your ways. Amen.";
  }

  private async generateStudyRecommendations(response: string, question: string): Promise<StudyRecommendation[]> {
    return [{
      topic: "Related Bible Study",
      scriptures: ["Proverbs 1:7", "James 1:5"],
      resources: ["Bible study guide", "Commentary"],
      estimatedTime: "15-30 minutes"
    }];
  }

  private determineResponseType(response: string, question: string): AgentResponse['responseType'] {
    const lowerResponse = response.toLowerCase();
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('pray') || lowerQuestion.includes('prayer')) {
      return 'prayer';
    } else if (lowerResponse.includes('encourage') || lowerResponse.includes('hope')) {
      return 'encouragement';
    } else if (lowerQuestion.includes('how') || lowerQuestion.includes('what should')) {
      return 'guidance';
    } else {
      return 'teaching';
    }
  }

  private async generateFollowUpQuestions(response: string, question: string): Promise<string[]> {
    return [
      "How does this relate to your current situation?",
      "What questions do you still have about this topic?",
      "How can you apply this wisdom in your daily life?"
    ];
  }

  private async updateSessionHistory(question: string, response: AgentResponse): Promise<void> {
    const session: ConversationSession = {
      id: Date.now().toString(),
      timestamp: new Date(),
      question,
      response,
      followUpQuestions: response.followUpQuestions
    };

    this.userContext!.sessionHistory.push(session);
  }

  async getConversationHistory(): Promise<ConversationSession[]> {
    return this.userContext?.sessionHistory || [];
  }

  getConfig(): AgentConfig {
    return this.config;
  }
}

export { AgentServiceWeb }; 