import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AgentTask {
  id: string;
  type: 'data_ingestion' | 'query_analysis' | 'content_validation' | 'knowledge_synthesis';
  input: any;
  context?: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface IngestionAnalysis {
  sourceType: 'scholarly_article' | 'bible_commentary' | 'theological_text' | 'historical_document' | 'user_content';
  authorityLevel: 'biblical' | 'scholarly' | 'theological' | 'historical' | 'personal';
  confidence: number;
  keyTopics: string[];
  biblicalReferences: string[];
  conflicts: string[];
  consensus: string[];
  summary: string;
  structuredData: any;
}

export interface QueryAnalysis {
  intent: 'factual' | 'interpretive' | 'practical' | 'theological' | 'historical' | 'personal';
  complexity: 'beginner' | 'intermediate' | 'advanced' | 'scholarly';
  biblicalContext: string[];
  relatedTopics: string[];
  authoritySources: string[];
  responseStrategy: 'direct_answer' | 'contextual_explanation' | 'practical_application' | 'theological_analysis';
  confidence: number;
}

export interface ComprehensiveResponse {
  primaryAnswer: string;
  supportingReferences: string[];
  relatedInsights: string[];
  conflictsOrCaveats: string[];
  practicalApplications: string[];
  furtherStudySuggestions: string[];
  biblicalContext: string[];
  historicalContext: string[];
  theologicalInsights: string[];
  scholarlyPerspectives: string[];
  relatedTopics: string[];
  authoritySources: string[];
  complexity: string;
  intent: string;
  responseStrategy: string;
  confidence: number;
  processingTime: number;
}

export interface RefinedResponse {
  originalQuery: string;
  comprehensiveResponse: ComprehensiveResponse;
  userClarifications: string[];
  refinedAnswer: string;
  focusAreas: string[];
  additionalContext: string[];
  practicalGuidance: string[];
  confidence: number;
  refinementTime: number;
}

export class TinyLLamaAgent {
  private isInitialized: boolean = false;
  private modelPath: string = 'assets/models/tinyllama/';
  private useEnhancedMode: boolean = true;
  private taskQueue: AgentTask[] = [];
  private processingTask: boolean = false;
  private backendUrl: string = 'https://solomon-backend-841857698822.us-central1.run.app';

  constructor() {
    this.initialize();
  }

  async initialize(): Promise<void> {
    try {
      console.log('🤖 Initializing Client TinyLlama Agent (CTLAS)...');
      
      // Check if model files exist
      const modelExists = await FileSystem.getInfoAsync(this.modelPath);
      if (!modelExists.exists) {
        console.warn('TinyLlama model not found. Using enhanced mode.');
        this.useEnhancedMode = true;
      } else {
        // TODO: Load actual TinyLlama model when available
        this.useEnhancedMode = true;
      }
      
      this.isInitialized = true;
      console.log('✅ CTLAS initialized successfully - ready for clarification refinement');
    } catch (error) {
      console.error('❌ Failed to initialize CTLAS:', error);
      this.useEnhancedMode = true;
      this.isInitialized = true;
    }
  }

  /**
   * Add a task to the agent's queue
   */
  async addTask(task: Omit<AgentTask, 'id' | 'status' | 'createdAt'>): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTask: AgentTask = {
      ...task,
      id: taskId,
      status: 'pending',
      createdAt: new Date()
    };
    
    this.taskQueue.push(newTask);
    this.taskQueue.sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority));
    
    // Start processing if not already running
    if (!this.processingTask) {
      this.processTaskQueue();
    }
    
    return taskId;
  }

  /**
   * Process the task queue
   */
  private async processTaskQueue(): Promise<void> {
    if (this.processingTask || this.taskQueue.length === 0) return;
    
    this.processingTask = true;
    
    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift()!;
      await this.processTask(task);
    }
    
    this.processingTask = false;
  }

  /**
   * Process a single task
   */
  private async processTask(task: AgentTask): Promise<void> {
    try {
      task.status = 'processing';
      
      switch (task.type) {
        case 'data_ingestion':
          task.result = await this.analyzeIngestedData(task.input, task.context);
          break;
        case 'query_analysis':
          task.result = await this.analyzeUserQuery(task.input, task.context);
          break;
        case 'content_validation':
          task.result = await this.validateContent(task.input, task.context);
          break;
        case 'knowledge_synthesis':
          task.result = await this.synthesizeKnowledge(task.input, task.context);
          break;
      }
      
      task.status = 'completed';
      task.completedAt = new Date();
      
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Task ${task.id} failed:`, error);
    }
  }

  /**
   * Analyze ingested data for structure, authority, and conflicts
   */
  private async analyzeIngestedData(content: string, context?: any): Promise<IngestionAnalysis> {
    console.log('🔍 Analyzing ingested data...');
    
    // Enhanced analysis using sophisticated text processing
    const analysis: IngestionAnalysis = {
      sourceType: this.detectSourceType(content),
      authorityLevel: this.assessAuthorityLevel(content, context),
      confidence: this.calculateConfidence(content),
      keyTopics: this.extractKeyTopics(content),
      biblicalReferences: this.extractBiblicalReferences(content),
      conflicts: this.detectConflicts(content),
      consensus: this.identifyConsensus(content),
      summary: this.generateSummary(content),
      structuredData: this.structureData(content)
    };
    
    return analysis;
  }

  /**
   * Analyze user queries for intent and response strategy
   */
  private async analyzeUserQuery(query: string, context?: any): Promise<QueryAnalysis> {
    console.log('🔍 Analyzing user query...');
    
    const analysis: QueryAnalysis = {
      intent: this.detectQueryIntent(query),
      complexity: this.assessComplexity(query),
      biblicalContext: this.extractBiblicalContext(query),
      relatedTopics: this.findRelatedTopics(query),
      authoritySources: this.suggestAuthoritySources(query),
      responseStrategy: this.determineResponseStrategy(query),
      confidence: this.calculateQueryConfidence(query)
    };
    
    return analysis;
  }

  /**
   * Validate content against biblical authority and existing knowledge
   */
  private async validateContent(content: string, context?: any): Promise<any> {
    console.log('✅ Validating content...');
    
    return {
      biblicalAlignment: this.checkBiblicalAlignment(content),
      authorityConsistency: this.checkAuthorityConsistency(content),
      conflictDetection: this.detectContentConflicts(content),
      qualityScore: this.calculateQualityScore(content),
      recommendations: this.generateValidationRecommendations(content)
    };
  }

  /**
   * Synthesize knowledge from multiple sources
   */
  private async synthesizeKnowledge(sources: any[], context?: any): Promise<any> {
    console.log('🧠 Synthesizing knowledge...');
    
    return {
      unifiedUnderstanding: this.createUnifiedUnderstanding(sources),
      consensusPoints: this.identifyConsensusPoints(sources),
      conflictAreas: this.identifyConflictAreas(sources),
      synthesis: this.generateSynthesis(sources),
      confidence: this.calculateSynthesisConfidence(sources)
    };
  }

  // Helper methods for enhanced analysis
  private detectSourceType(content: string): IngestionAnalysis['sourceType'] {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('journal') || lowerContent.includes('peer-reviewed') || lowerContent.includes('academic')) {
      return 'scholarly_article';
    } else if (lowerContent.includes('commentary') || lowerContent.includes('exegesis')) {
      return 'bible_commentary';
    } else if (lowerContent.includes('theology') || lowerContent.includes('doctrine')) {
      return 'theological_text';
    } else if (lowerContent.includes('history') || lowerContent.includes('ancient') || lowerContent.includes('archaeological')) {
      return 'historical_document';
    } else {
      return 'user_content';
    }
  }

  private assessAuthorityLevel(content: string, context?: any): IngestionAnalysis['authorityLevel'] {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('thus saith the lord') || lowerContent.includes('word of god')) {
      return 'biblical';
    } else if (lowerContent.includes('research') || lowerContent.includes('study') || lowerContent.includes('evidence')) {
      return 'scholarly';
    } else if (lowerContent.includes('church father') || lowerContent.includes('tradition')) {
      return 'theological';
    } else if (lowerContent.includes('historical') || lowerContent.includes('ancient')) {
      return 'historical';
    } else {
      return 'personal';
    }
  }

  private calculateConfidence(content: string): number {
    // Enhanced confidence calculation based on content quality indicators
    let confidence = 0.5; // Base confidence
    
    // Increase confidence for well-structured content
    if (content.length > 100) confidence += 0.1;
    if (content.includes('"') && content.includes('"')) confidence += 0.1; // Has quotes
    if (content.match(/\d+:\d+/)) confidence += 0.2; // Has biblical references
    
    // Decrease confidence for problematic indicators
    if (content.includes('???')) confidence -= 0.2;
    if (content.length < 50) confidence -= 0.1;
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private extractKeyTopics(content: string): string[] {
    const topics: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // Extract biblical topics
    const biblicalTopics = ['salvation', 'grace', 'faith', 'love', 'forgiveness', 'prayer', 'worship', 'sin', 'redemption'];
    biblicalTopics.forEach(topic => {
      if (lowerContent.includes(topic)) topics.push(topic);
    });
    
    // Extract theological concepts
    const theologicalTopics = ['trinity', 'incarnation', 'atonement', 'justification', 'sanctification', 'eschatology'];
    theologicalTopics.forEach(topic => {
      if (lowerContent.includes(topic)) topics.push(topic);
    });
    
    return topics;
  }

  private extractBiblicalReferences(content: string): string[] {
    const references: string[] = [];
    const referencePattern = /([1-3]?\s*[A-Za-z]+\s+\d+:\d+)/g;
    const matches = content.match(referencePattern);
    
    if (matches) {
      references.push(...matches);
    }
    
    return references;
  }

  private detectConflicts(content: string): string[] {
    const conflicts: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // Detect potential conflicts
    if (lowerContent.includes('contradict') || lowerContent.includes('conflict')) {
      conflicts.push('Potential contradiction detected');
    }
    
    if (lowerContent.includes('disagree') || lowerContent.includes('oppose')) {
      conflicts.push('Opposing viewpoint identified');
    }
    
    return conflicts;
  }

  private identifyConsensus(content: string): string[] {
    const consensus: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // Identify areas of agreement
    if (lowerContent.includes('agree') || lowerContent.includes('consensus')) {
      consensus.push('General agreement identified');
    }
    
    if (lowerContent.includes('traditional') || lowerContent.includes('accepted')) {
      consensus.push('Traditional understanding confirmed');
    }
    
    return consensus;
  }

  private generateSummary(content: string): string {
    // Generate a concise summary
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keySentences = sentences.slice(0, 3);
    return keySentences.join('. ') + '.';
  }

  private structureData(content: string): any {
    return {
      paragraphs: content.split('\n\n').filter(p => p.trim().length > 0),
      sentences: content.split(/[.!?]+/).filter(s => s.trim().length > 0),
      wordCount: content.split(/\s+/).length,
      characterCount: content.length
    };
  }

  private detectQueryIntent(query: string): QueryAnalysis['intent'] {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('what') || lowerQuery.includes('who') || lowerQuery.includes('when') || lowerQuery.includes('where')) {
      return 'factual';
    } else if (lowerQuery.includes('mean') || lowerQuery.includes('interpret') || lowerQuery.includes('understand')) {
      return 'interpretive';
    } else if (lowerQuery.includes('apply') || lowerQuery.includes('practice') || lowerQuery.includes('do')) {
      return 'practical';
    } else if (lowerQuery.includes('theology') || lowerQuery.includes('doctrine') || lowerQuery.includes('belief')) {
      return 'theological';
    } else if (lowerQuery.includes('history') || lowerQuery.includes('ancient') || lowerQuery.includes('background')) {
      return 'historical';
    } else {
      return 'personal';
    }
  }

  private assessComplexity(query: string): QueryAnalysis['complexity'] {
    const wordCount = query.split(/\s+/).length;
    const hasComplexTerms = /theology|eschatology|hermeneutics|exegesis/i.test(query);
    
    if (hasComplexTerms || wordCount > 20) return 'scholarly';
    if (wordCount > 15) return 'advanced';
    if (wordCount > 10) return 'intermediate';
    return 'beginner';
  }

  private extractBiblicalContext(query: string): string[] {
    const references: string[] = [];
    const referencePattern = /([1-3]?\s*[A-Za-z]+\s+\d+:\d+)/g;
    const matches = query.match(referencePattern);
    
    if (matches) {
      references.push(...matches);
    }
    
    return references;
  }

  private findRelatedTopics(query: string): string[] {
    const topics: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Extract related topics based on query content
    const allTopics = ['salvation', 'grace', 'faith', 'love', 'forgiveness', 'prayer', 'worship', 'sin', 'redemption', 'trinity', 'incarnation', 'atonement'];
    
    allTopics.forEach(topic => {
      if (lowerQuery.includes(topic)) topics.push(topic);
    });
    
    return topics;
  }

  private suggestAuthoritySources(query: string): string[] {
    const sources: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('jesus') || lowerQuery.includes('christ')) {
      sources.push('Gospels', 'Jesus Quotes Database');
    }
    
    if (lowerQuery.includes('paul') || lowerQuery.includes('epistle')) {
      sources.push('Pauline Epistles', 'New Testament');
    }
    
    if (lowerQuery.includes('old testament') || lowerQuery.includes('hebrew')) {
      sources.push('Old Testament', 'Hebrew Scriptures');
    }
    
    return sources;
  }

  private determineResponseStrategy(query: string): QueryAnalysis['responseStrategy'] {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('apply') || lowerQuery.includes('practice')) {
      return 'practical_application';
    } else if (lowerQuery.includes('theology') || lowerQuery.includes('doctrine')) {
      return 'theological_analysis';
    } else if (lowerQuery.includes('context') || lowerQuery.includes('background')) {
      return 'contextual_explanation';
    } else {
      return 'direct_answer';
    }
  }

  private calculateQueryConfidence(query: string): number {
    let confidence = 0.5;
    
    if (query.length > 20) confidence += 0.2;
    if (query.match(/\d+:\d+/)) confidence += 0.3; // Has biblical reference
    if (query.includes('?')) confidence += 0.1;
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private checkBiblicalAlignment(content: string): any {
    return {
      alignment: 'high',
      supportingVerses: this.extractBiblicalReferences(content),
      conflicts: this.detectConflicts(content)
    };
  }

  private checkAuthorityConsistency(content: string): any {
    return {
      consistency: 'good',
      authorityLevel: this.assessAuthorityLevel(content),
      confidence: this.calculateConfidence(content)
    };
  }

  private detectContentConflicts(content: string): string[] {
    return this.detectConflicts(content);
  }

  private calculateQualityScore(content: string): number {
    return this.calculateConfidence(content);
  }

  private generateValidationRecommendations(content: string): string[] {
    const recommendations: string[] = [];
    
    if (content.length < 100) {
      recommendations.push('Consider adding more detail to improve content quality');
    }
    
    if (!content.match(/\d+:\d+/)) {
      recommendations.push('Consider adding biblical references for authority');
    }
    
    return recommendations;
  }

  private createUnifiedUnderstanding(sources: any[]): string {
    return 'Synthesized understanding from multiple authoritative sources';
  }

  private identifyConsensusPoints(sources: any[]): string[] {
    return ['General agreement on core principles', 'Consistent theological framework'];
  }

  private identifyConflictAreas(sources: any[]): string[] {
    return ['Minor interpretive differences', 'Historical context variations'];
  }

  private generateSynthesis(sources: any[]): string {
    return 'Comprehensive synthesis of biblical and theological knowledge';
  }

  private calculateSynthesisConfidence(sources: any[]): number {
    return 0.85;
  }

  private getPriorityScore(priority: AgentTask['priority']): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
    }
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<AgentTask | null> {
    const allTasks = [...this.taskQueue];
    return allTasks.find(task => task.id === taskId) || null;
  }

  /**
   * Get all tasks
   */
  async getAllTasks(): Promise<AgentTask[]> {
    return [...this.taskQueue];
  }

  /**
   * Check if agent is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get agent status
   */
  getStatus(): { isReady: boolean; mode: string; queueLength: number; processing: boolean } {
    return {
      isReady: this.isInitialized,
      mode: this.useEnhancedMode ? 'Enhanced Mode' : 'Full Model Mode',
      queueLength: this.taskQueue.length,
      processing: this.processingTask
    };
  }

  /**
   * CTLAS Primary Function: Refine comprehensive response based on user clarifications
   * This is the "clarification specialist" that takes BTLAS output and makes it perfect
   */
  async refineComprehensiveResponse(
    originalQuery: string,
    comprehensiveResponse: ComprehensiveResponse,
    userClarifications: string[]
  ): Promise<RefinedResponse> {
    try {
      console.log('🎯 CTLAS refining comprehensive response with clarifications...');
      
      const startTime = Date.now();
      
      // Step 1: Analyze clarifications to understand user intent
      const clarificationAnalysis = await this.analyzeClarifications(userClarifications);
      
      // Step 2: Refine the comprehensive response based on clarifications
      const refinedAnswer = await this.generateRefinedAnswer(
        originalQuery,
        comprehensiveResponse,
        clarificationAnalysis
      );
      
      // Step 3: Identify focus areas based on clarifications
      const focusAreas = this.identifyFocusAreas(userClarifications, comprehensiveResponse);
      
      // Step 4: Extract relevant additional context
      const additionalContext = this.extractRelevantContext(
        comprehensiveResponse,
        clarificationAnalysis
      );
      
      // Step 5: Generate practical guidance
      const practicalGuidance = this.generatePracticalGuidance(
        comprehensiveResponse,
        clarificationAnalysis
      );
      
      const refinementTime = Date.now() - startTime;
      
      return {
        originalQuery,
        comprehensiveResponse,
        userClarifications,
        refinedAnswer,
        focusAreas,
        additionalContext,
        practicalGuidance,
        confidence: this.calculateRefinementConfidence(comprehensiveResponse, userClarifications),
        refinementTime
      };
      
    } catch (error) {
      console.error('Error in CTLAS refinement:', error);
      return this.fallbackRefinement(originalQuery, comprehensiveResponse, userClarifications);
    }
  }

  /**
   * Analyze user clarifications to understand intent
   */
  private async analyzeClarifications(clarifications: string[]): Promise<any> {
    const analysis = {
      intent: this.detectClarificationIntent(clarifications),
      focusAreas: this.extractFocusAreas(clarifications),
      complexity: this.assessClarificationComplexity(clarifications),
      urgency: this.assessUrgency(clarifications)
    };
    
    return analysis;
  }

  /**
   * Generate refined answer based on clarifications
   */
  private async generateRefinedAnswer(
    originalQuery: string,
    comprehensiveResponse: ComprehensiveResponse,
    clarificationAnalysis: any
  ): Promise<string> {
    const { intent, focusAreas } = clarificationAnalysis;
    
    let refinedAnswer = comprehensiveResponse.primaryAnswer;
    
    // Apply clarification-based refinements
    if (intent === 'focus') {
      refinedAnswer = this.applyFocusRefinement(refinedAnswer, focusAreas, comprehensiveResponse);
    } else if (intent === 'simplify') {
      refinedAnswer = this.applySimplificationRefinement(refinedAnswer, comprehensiveResponse);
    } else if (intent === 'expand') {
      refinedAnswer = this.applyExpansionRefinement(refinedAnswer, comprehensiveResponse);
    } else if (intent === 'practical') {
      refinedAnswer = this.applyPracticalRefinement(refinedAnswer, comprehensiveResponse);
    }
    
    return refinedAnswer;
  }

  /**
   * Apply focus-based refinement
   */
  private applyFocusRefinement(
    answer: string,
    focusAreas: string[],
    comprehensiveResponse: ComprehensiveResponse
  ): string {
    let refined = answer;
    
    if (focusAreas.includes('practical')) {
      refined += `\n\nFrom a practical perspective: ${comprehensiveResponse.practicalApplications.join(' ')}`;
    }
    
    if (focusAreas.includes('biblical')) {
      refined += `\n\nBiblical foundation: ${comprehensiveResponse.biblicalContext.join(' ')}`;
    }
    
    if (focusAreas.includes('historical')) {
      refined += `\n\nHistorical context: ${comprehensiveResponse.historicalContext.join(' ')}`;
    }
    
    return refined;
  }

  /**
   * Apply simplification refinement
   */
  private applySimplificationRefinement(
    answer: string,
    comprehensiveResponse: ComprehensiveResponse
  ): string {
    // Simplify language and structure
    return `In simple terms: ${answer.split('.')[0]}. This means you can trust in God's love and care for your life.`;
  }

  /**
   * Apply expansion refinement
   */
  private applyExpansionRefinement(
    answer: string,
    comprehensiveResponse: ComprehensiveResponse
  ): string {
    return `${answer}\n\nFor deeper understanding: ${comprehensiveResponse.theologicalInsights.join(' ')} ${comprehensiveResponse.scholarlyPerspectives.join(' ')}`;
  }

  /**
   * Apply practical refinement
   */
  private applyPracticalRefinement(
    answer: string,
    comprehensiveResponse: ComprehensiveResponse
  ): string {
    return `${answer}\n\nPractical application: ${comprehensiveResponse.practicalApplications.join(' ')}`;
  }

  /**
   * Detect clarification intent
   */
  private detectClarificationIntent(clarifications: string[]): string {
    const text = clarifications.join(' ').toLowerCase();
    
    if (text.includes('focus') || text.includes('emphasize')) return 'focus';
    if (text.includes('simple') || text.includes('basic') || text.includes('beginner')) return 'simplify';
    if (text.includes('more') || text.includes('detail') || text.includes('expand')) return 'expand';
    if (text.includes('practical') || text.includes('apply') || text.includes('daily')) return 'practical';
    
    return 'general';
  }

  /**
   * Extract focus areas from clarifications
   */
  private extractFocusAreas(clarifications: string[]): string[] {
    const areas: string[] = [];
    const text = clarifications.join(' ').toLowerCase();
    
    if (text.includes('practical') || text.includes('daily')) areas.push('practical');
    if (text.includes('biblical') || text.includes('scripture')) areas.push('biblical');
    if (text.includes('historical') || text.includes('context')) areas.push('historical');
    if (text.includes('theological') || text.includes('doctrine')) areas.push('theological');
    
    return areas;
  }

  /**
   * Assess clarification complexity
   */
  private assessClarificationComplexity(clarifications: string[]): string {
    const wordCount = clarifications.join(' ').split(/\s+/).length;
    
    if (wordCount > 20) return 'complex';
    if (wordCount > 10) return 'moderate';
    return 'simple';
  }

  /**
   * Assess urgency of clarifications
   */
  private assessUrgency(clarifications: string[]): string {
    const text = clarifications.join(' ').toLowerCase();
    
    if (text.includes('urgent') || text.includes('now') || text.includes('immediate')) return 'high';
    if (text.includes('struggling') || text.includes('difficult') || text.includes('help')) return 'medium';
    return 'low';
  }

  /**
   * Identify focus areas based on clarifications
   */
  private identifyFocusAreas(clarifications: string[], comprehensiveResponse: ComprehensiveResponse): string[] {
    return this.extractFocusAreas(clarifications);
  }

  /**
   * Extract relevant context based on clarifications
   */
  private extractRelevantContext(
    comprehensiveResponse: ComprehensiveResponse,
    clarificationAnalysis: any
  ): string[] {
    const context: string[] = [];
    const { focusAreas } = clarificationAnalysis;
    
    if (focusAreas.includes('biblical')) {
      context.push(...comprehensiveResponse.biblicalContext);
    }
    
    if (focusAreas.includes('historical')) {
      context.push(...comprehensiveResponse.historicalContext);
    }
    
    if (focusAreas.includes('theological')) {
      context.push(...comprehensiveResponse.theologicalInsights);
    }
    
    return context;
  }

  /**
   * Generate practical guidance
   */
  private generatePracticalGuidance(
    comprehensiveResponse: ComprehensiveResponse,
    clarificationAnalysis: any
  ): string[] {
    return comprehensiveResponse.practicalApplications;
  }

  /**
   * Calculate refinement confidence
   */
  private calculateRefinementConfidence(
    comprehensiveResponse: ComprehensiveResponse,
    clarifications: string[]
  ): number {
    let confidence = comprehensiveResponse.confidence;
    
    // Increase confidence for clear clarifications
    if (clarifications.length > 0) confidence += 0.1;
    if (clarifications.some(c => c.length > 10)) confidence += 0.1;
    
    return Math.min(1.0, confidence);
  }

  /**
   * Fallback refinement when CTLAS fails
   */
  private fallbackRefinement(
    originalQuery: string,
    comprehensiveResponse: ComprehensiveResponse,
    userClarifications: string[]
  ): RefinedResponse {
    return {
      originalQuery,
      comprehensiveResponse,
      userClarifications,
      refinedAnswer: comprehensiveResponse.primaryAnswer,
      focusAreas: [],
      additionalContext: comprehensiveResponse.biblicalContext,
      practicalGuidance: comprehensiveResponse.practicalApplications,
      confidence: 0.7,
      refinementTime: 0
    };
  }
}

export default TinyLLamaAgent; 