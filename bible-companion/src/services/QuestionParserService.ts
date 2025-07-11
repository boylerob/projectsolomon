import ImmediateAnswerService from './ImmediateAnswerService';

// Biblical people database interface
interface BiblicalPerson {
  name: string;
  category: string;
  role: string;
  keyStories: string[];
  keyVerses: string[];
  themes: string[];
  immediateResponses: string[];
}

interface BiblicalPeopleDatabase {
  metadata: {
    description: string;
    version: string;
    lastUpdated: string;
    totalPeople: number;
    categories: string[];
  };
  people: { [key: string]: BiblicalPerson };
}

export interface QuestionAnalysis {
  // Basic categorization
  type: 'factual' | 'theological' | 'personal' | 'practical' | 'clarification' | 'conversational';
  
  // Intent detection
  intent: 'information' | 'guidance' | 'comfort' | 'instruction' | 'exploration' | 'confession';
  
  // Topic extraction
  primaryTopic: string;
  secondaryTopics: string[];
  
  // Complexity assessment
  complexity: 'simple' | 'moderate' | 'complex';
  
  // Emotional state
  emotionalTone: 'neutral' | 'anxious' | 'curious' | 'struggling' | 'excited' | 'confused';
  
  // Urgency level
  urgency: 'low' | 'medium' | 'high';
  
  // Response strategy
  responseStrategy: 'immediate_answer' | 'immediate_acknowledgment' | 'clarification' | 'ai_enhancement';
  
  // Confidence in local parsing
  confidence: number;
  
  // Extracted entities
  entities: {
    scriptures: string[];
    people: string[];
    concepts: string[];
    actions: string[];
  };
  
  // Context clues
  contextClues: {
    isFollowUp: boolean;
    referencesPrevious: boolean;
    timeIndicators: string[];
    personalPronouns: string[];
  };
}

export interface ParsedQuestion {
  originalQuestion: string;
  analysis: QuestionAnalysis;
  immediateResponse?: {
    canAnswer: boolean;
    answer?: any;
    acknowledgment?: string;
    biblicalPerson?: BiblicalPerson;
  };
  processingTime: number;
}

class QuestionParserService {
  private immediateAnswerService: ImmediateAnswerService;
  private biblicalPeopleDatabase: BiblicalPeopleDatabase | null = null;
  
  // Question type patterns
  private factualPatterns = [
    /what does .* say/i,
    /how many .* in/i,
    /who wrote/i,
    /when was/i,
    /where is/i,
    /how many times/i,
    /what book/i,
    /what chapter/i
  ];
  
  private theologicalPatterns = [
    /what does the bible say about/i,
    /what is the meaning of/i,
    /explain .* theologically/i,
    /what does god think about/i,
    /biblical perspective on/i
  ];
  
  private personalPatterns = [
    /i feel/i,
    /i am/i,
    /i have/i,
    /i want/i,
    /i need/i,
    /i struggle/i,
    /i wonder/i,
    /i think/i,
    /my .* is/i,
    /help me/i
  ];
  
  private practicalPatterns = [
    /how should i/i,
    /how do i/i,
    /what should i do/i,
    /how can i/i,
    /steps to/i,
    /ways to/i
  ];
  
  private clarificationPatterns = [
    /what do you mean/i,
    /i don't understand/i,
    /can you explain/i,
    /could you clarify/i,
    /i'm confused/i
  ];

  constructor() {
    this.immediateAnswerService = new ImmediateAnswerService();
    this.loadBiblicalPeopleDatabase();
  }

  /**
   * Load the biblical people database
   */
  private async loadBiblicalPeopleDatabase() {
    try {
      // In a real implementation, this would load from the JSON file
      // For now, we'll create a minimal version for demonstration
      this.biblicalPeopleDatabase = {
        metadata: {
          description: "Biblical people database",
          version: "3.0",
          lastUpdated: "2024-12-19",
          totalPeople: 66,
          categories: ["patriarchs", "kings", "prophets", "disciples", "messiah", "authors", "minor_prophets", "apostles", "followers"]
        },
        people: {
          "Solomon": {
            name: "Solomon",
            category: "kings",
            role: "Wisest King, Temple Builder",
            keyStories: ["Wisdom from God", "Building Temple", "Queen of Sheba"],
            keyVerses: ["1 Kings 3:5-14", "1 Kings 6:1-38", "Proverbs 1:1"],
            themes: ["wisdom", "wealth", "temple", "worship"],
            immediateResponses: [
              "Solomon was the wisest king who ever lived. He built God's temple in Jerusalem and wrote Proverbs, Ecclesiastes, and Song of Solomon.",
              "Solomon asked God for wisdom instead of wealth, and God gave him both. However, his many wives led him away from God."
            ]
          },
          "David": {
            name: "David",
            category: "kings",
            role: "King of Israel, Man After God's Heart",
            keyStories: ["Goliath", "Anointing", "Bathsheba", "Psalms"],
            keyVerses: ["1 Samuel 16:1-13", "1 Samuel 17:1-58", "Psalm 51:1-19"],
            themes: ["courage", "repentance", "worship", "leadership"],
            immediateResponses: [
              "David was a shepherd boy who became Israel's greatest king. He defeated Goliath and wrote many of the Psalms.",
              "David was called 'a man after God's own heart' despite his sins. His story shows God's grace and the importance of repentance."
            ]
          },
          "Jesus": {
            name: "Jesus",
            category: "messiah",
            role: "Son of God, Savior",
            keyStories: ["Birth", "Miracles", "Sermon on Mount", "Crucifixion", "Resurrection"],
            keyVerses: ["John 3:16", "Matthew 28:18-20", "Luke 2:1-20"],
            themes: ["love", "salvation", "grace", "forgiveness", "resurrection"],
            immediateResponses: [
              "Jesus is the Son of God who came to earth to save us from our sins. He died on the cross and rose from the dead to give us eternal life.",
              "Jesus performed many miracles, taught about God's kingdom, and showed us how to love God and others. He is the Messiah promised in the Old Testament."
            ]
          }
        }
      };
    } catch (error) {
      console.error('Error loading biblical people database:', error);
    }
  }

  /**
   * Main method to parse and analyze a question immediately
   */
  public parseQuestion(question: string, userContext?: any): ParsedQuestion {
    const startTime = performance.now();
    
    const analysis = this.analyzeQuestion(question, userContext);
    const immediateResponse = this.checkImmediateResponse(question, analysis);
    
    const processingTime = performance.now() - startTime;
    
    return {
      originalQuestion: question,
      analysis,
      immediateResponse,
      processingTime
    };
  }

  /**
   * Comprehensive question analysis
   */
  private analyzeQuestion(question: string, userContext?: any): QuestionAnalysis {
    const lowerQuestion = question.toLowerCase();
    
    // Determine question type
    const type = this.determineQuestionType(lowerQuestion);
    
    // Determine intent
    const intent = this.determineIntent(lowerQuestion, type);
    
    // Extract topics
    const { primaryTopic, secondaryTopics } = this.extractTopics(lowerQuestion);
    
    // Assess complexity
    const complexity = this.assessComplexity(lowerQuestion, type);
    
    // Detect emotional tone
    const emotionalTone = this.detectEmotionalTone(lowerQuestion);
    
    // Assess urgency
    const urgency = this.assessUrgency(lowerQuestion, emotionalTone);
    
    // Determine response strategy
    const responseStrategy = this.determineResponseStrategy(type, intent, complexity);
    
    // Extract entities
    const entities = this.extractEntities(question);
    
    // Analyze context clues
    const contextClues = this.analyzeContextClues(question, userContext);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(type, intent, entities);
    
    return {
      type,
      intent,
      primaryTopic,
      secondaryTopics,
      complexity,
      emotionalTone,
      urgency,
      responseStrategy,
      confidence,
      entities,
      contextClues
    };
  }

  /**
   * Determine the primary question type
   */
  private determineQuestionType(question: string): QuestionAnalysis['type'] {
    if (this.factualPatterns.some(pattern => pattern.test(question))) {
      return 'factual';
    }
    
    if (this.theologicalPatterns.some(pattern => pattern.test(question))) {
      return 'theological';
    }
    
    if (this.personalPatterns.some(pattern => pattern.test(question))) {
      return 'personal';
    }
    
    if (this.practicalPatterns.some(pattern => pattern.test(question))) {
      return 'practical';
    }
    
    if (this.clarificationPatterns.some(pattern => pattern.test(question))) {
      return 'clarification';
    }
    
    return 'conversational';
  }

  /**
   * Determine the user's intent
   */
  private determineIntent(question: string, type: string): QuestionAnalysis['intent'] {
    if (type === 'factual') {
      return 'information';
    }
    
    if (type === 'personal' && (question.includes('struggle') || question.includes('help'))) {
      return 'comfort';
    }
    
    if (type === 'practical') {
      return 'instruction';
    }
    
    if (type === 'theological') {
      return 'exploration';
    }
    
    if (question.includes('confess') || question.includes('wrong') || question.includes('sin')) {
      return 'confession';
    }
    
    if (type === 'personal') {
      return 'guidance';
    }
    
    return 'information';
  }

  /**
   * Extract primary and secondary topics
   */
  private extractTopics(question: string): { primaryTopic: string; secondaryTopics: string[] } {
    const topics = [
      'prayer', 'faith', 'love', 'forgiveness', 'obedience', 'worship', 'grace', 'salvation',
      'sin', 'repentance', 'holiness', 'service', 'witness', 'discipleship', 'family',
      'marriage', 'work', 'money', 'suffering', 'hope', 'joy', 'peace', 'patience',
      'kindness', 'goodness', 'gentleness', 'self-control', 'wisdom', 'knowledge',
      'understanding', 'courage', 'humility', 'gratitude', 'contentment', 'trust'
    ];
    
    const foundTopics = topics.filter(topic => question.includes(topic));
    
    return {
      primaryTopic: foundTopics[0] || 'general',
      secondaryTopics: foundTopics.slice(1)
    };
  }

  /**
   * Assess question complexity
   */
  private assessComplexity(question: string, type: string): QuestionAnalysis['complexity'] {
    const wordCount = question.split(' ').length;
    const hasComplexWords = /theolog|doctrin|eschatolog|soteriology|sanctification/i.test(question);
    const hasMultipleClauses = (question.match(/and|or|but|however|although/gi) || []).length > 1;
    
    if (hasComplexWords || hasMultipleClauses || wordCount > 20) {
      return 'complex';
    }
    
    if (wordCount > 10 || type === 'theological') {
      return 'moderate';
    }
    
    return 'simple';
  }

  /**
   * Detect emotional tone
   */
  private detectEmotionalTone(question: string): QuestionAnalysis['emotionalTone'] {
    const anxiousWords = ['worried', 'anxious', 'afraid', 'scared', 'nervous', 'concerned'];
    const strugglingWords = ['struggle', 'difficult', 'hard', 'tough', 'challenging', 'problem'];
    const curiousWords = ['wonder', 'curious', 'interested', 'explore', 'learn'];
    const excitedWords = ['excited', 'thrilled', 'amazing', 'wonderful', 'great'];
    const confusedWords = ['confused', 'unclear', 'don\'t understand', 'puzzled'];
    
    if (anxiousWords.some(word => question.includes(word))) {
      return 'anxious';
    }
    
    if (strugglingWords.some(word => question.includes(word))) {
      return 'struggling';
    }
    
    if (curiousWords.some(word => question.includes(word))) {
      return 'curious';
    }
    
    if (excitedWords.some(word => question.includes(word))) {
      return 'excited';
    }
    
    if (confusedWords.some(word => question.includes(word))) {
      return 'confused';
    }
    
    return 'neutral';
  }

  /**
   * Assess urgency level
   */
  private assessUrgency(question: string, emotionalTone: string): QuestionAnalysis['urgency'] {
    const urgentWords = ['urgent', 'emergency', 'crisis', 'immediate', 'now', 'quick'];
    const timeIndicators = ['today', 'tonight', 'this week', 'right now'];
    
    if (urgentWords.some(word => question.includes(word)) || emotionalTone === 'anxious') {
      return 'high';
    }
    
    if (timeIndicators.some(indicator => question.includes(indicator))) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Determine response strategy
   */
  private determineResponseStrategy(
    type: string, 
    intent: string, 
    complexity: string
  ): QuestionAnalysis['responseStrategy'] {
    // Factual questions can often be answered immediately
    if (type === 'factual') {
      return 'immediate_answer';
    }
    
    // Simple questions can get immediate acknowledgment
    if (complexity === 'simple' && type !== 'theological') {
      return 'immediate_acknowledgment';
    }
    
    // Complex theological questions need AI enhancement
    if (type === 'theological' && complexity === 'complex') {
      return 'ai_enhancement';
    }
    
    // Personal questions often need clarification
    if (type === 'personal' && intent === 'guidance') {
      return 'clarification';
    }
    
    // Default to immediate acknowledgment with optional AI enhancement
    return 'immediate_acknowledgment';
  }

  /**
   * Extract entities from the question
   */
  private extractEntities(question: string): QuestionAnalysis['entities'] {
    const scriptureRegex = /([1-3]?\s*[A-Za-z]+\s+\d+:\d+)/gi;
    const peopleRegex = /(Jesus|God|Paul|Peter|John|Moses|David|Abraham|Mary|Joseph|Solomon|Elijah|Isaiah|Jeremiah|Daniel|Noah|Adam)/gi;
    const conceptRegex = /(grace|faith|love|salvation|redemption|forgiveness|prayer|worship|obedience|holiness)/gi;
    const actionRegex = /(pray|worship|serve|love|forgive|obey|trust|believe|confess|repent)/gi;
    
    return {
      scriptures: question.match(scriptureRegex) || [],
      people: question.match(peopleRegex) || [],
      concepts: question.match(conceptRegex) || [],
      actions: question.match(actionRegex) || []
    };
  }

  /**
   * Analyze context clues
   */
  private analyzeContextClues(question: string, userContext?: any): QuestionAnalysis['contextClues'] {
    const isFollowUp = userContext?.conversationHistory?.length > 0;
    const referencesPrevious = /that|this|it|what you said|as you mentioned/i.test(question);
    const timeIndicators = question.match(/(today|tonight|yesterday|this week|this month|recently|lately)/gi) || [];
    const personalPronouns = question.match(/(i|me|my|myself|we|us|our)/gi) || [];
    
    return {
      isFollowUp,
      referencesPrevious,
      timeIndicators,
      personalPronouns
    };
  }

  /**
   * Calculate confidence in the analysis
   */
  private calculateConfidence(
    type: string, 
    intent: string, 
    entities: QuestionAnalysis['entities']
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence for clear factual questions
    if (type === 'factual') {
      confidence += 0.3;
    }
    
    // Higher confidence when entities are found
    if (entities.scriptures.length > 0) {
      confidence += 0.2;
    }
    
    if (entities.concepts.length > 0) {
      confidence += 0.1;
    }
    
    // Higher confidence when biblical people are mentioned
    if (entities.people.length > 0) {
      confidence += 0.2;
    }
    
    // Lower confidence for ambiguous questions
    if (type === 'conversational' && intent === 'information') {
      confidence -= 0.2;
    }
    
    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Check if we can provide an immediate response
   */
  private checkImmediateResponse(
    question: string, 
    analysis: QuestionAnalysis
  ): ParsedQuestion['immediateResponse'] {
    // Check for factual answers first
    const factualAnswer = this.immediateAnswerService.getImmediateAnswer(question);
    
    if (factualAnswer) {
      return {
        canAnswer: true,
        answer: factualAnswer
      };
    }
    
    // Check for biblical people questions
    const biblicalPerson = this.findBiblicalPerson(question);
    if (biblicalPerson) {
      return {
        canAnswer: true,
        biblicalPerson,
        acknowledgment: this.generateBiblicalPersonResponse(biblicalPerson, analysis)
      };
    }
    
    // Check if we should provide immediate acknowledgment
    if (analysis.responseStrategy === 'immediate_acknowledgment') {
      const acknowledgment = this.generateAcknowledgment(analysis);
      return {
        canAnswer: false,
        acknowledgment
      };
    }
    
    return {
      canAnswer: false
    };
  }

  /**
   * Find biblical person in the question
   */
  private findBiblicalPerson(question: string): BiblicalPerson | null {
    if (!this.biblicalPeopleDatabase) {
      return null;
    }
    
    const lowerQuestion = question.toLowerCase();
    
    // Check for exact matches first
    for (const [name, person] of Object.entries(this.biblicalPeopleDatabase.people)) {
      if (lowerQuestion.includes(name.toLowerCase())) {
        return person;
      }
    }
    
    // Check for partial matches
    for (const [name, person] of Object.entries(this.biblicalPeopleDatabase.people)) {
      const nameWords = name.toLowerCase().split(' ');
      if (nameWords.some(word => lowerQuestion.includes(word))) {
        return person;
      }
    }
    
    return null;
  }

  /**
   * Generate response for biblical person questions
   */
  private generateBiblicalPersonResponse(person: BiblicalPerson, analysis: QuestionAnalysis): string {
    const { emotionalTone, type } = analysis;
    
    // Select appropriate response based on context
    let response = person.immediateResponses[0]; // Default to first response
    
    // If emotional tone is struggling, use more encouraging response
    if (emotionalTone === 'struggling') {
      response = person.immediateResponses[1] || person.immediateResponses[0];
    }
    
    // If theological question, add more depth
    if (type === 'theological') {
      response += ` ${person.name} teaches us about ${person.themes.join(', ')}.`;
    }
    
    return response;
  }

  /**
   * Generate appropriate acknowledgment based on analysis
   */
  private generateAcknowledgment(analysis: QuestionAnalysis): string {
    const { type, intent, emotionalTone, primaryTopic } = analysis;
    
    if (emotionalTone === 'struggling') {
      return "I hear that you're going through something difficult. Let me help you find some biblical wisdom for this situation.";
    }
    
    if (emotionalTone === 'anxious') {
      return "I understand this is causing you some worry. God's Word has much to say about finding peace in difficult times.";
    }
    
    if (type === 'theological') {
      return `That's a great question about ${primaryTopic}! This is an important topic that deserves careful consideration.`;
    }
    
    if (type === 'personal') {
      return "I appreciate you sharing this with me. Let's look at what Scripture has to say about your situation.";
    }
    
    if (type === 'practical') {
      return `I'd be happy to help you with ${primaryTopic}. Let me share some biblical guidance on this.`;
    }
    
    return "That's a really good question! Let me think about this and give you a thoughtful response.";
  }

  /**
   * Get analysis summary for debugging/logging
   */
  public getAnalysisSummary(parsedQuestion: ParsedQuestion): string {
    const { analysis, processingTime } = parsedQuestion;
    
    return `
Question Analysis Summary:
- Type: ${analysis.type}
- Intent: ${analysis.intent}
- Primary Topic: ${analysis.primaryTopic}
- Complexity: ${analysis.complexity}
- Emotional Tone: ${analysis.emotionalTone}
- Urgency: ${analysis.urgency}
- Response Strategy: ${analysis.responseStrategy}
- Confidence: ${Math.round(analysis.confidence * 100)}%
- Processing Time: ${processingTime.toFixed(2)}ms
- Entities Found: ${Object.values(analysis.entities).flat().length}
- Biblical Person Found: ${parsedQuestion.immediateResponse?.biblicalPerson?.name || 'None'}
    `.trim();
  }
}

export default new QuestionParserService();
