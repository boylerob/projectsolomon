import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import JesusQuotesService from './JesusQuotesService';

export interface ClarificationContext {
  originalQuestion: string;
  originalResponse: string;
  userClarification: string;
}

export interface LocalLLMResponse {
  refinedResponse: string;
  confidence: number;
  processingTime: number;
}

export class LocalLLMService {
  private model: any = null;
  private isInitialized: boolean = false;
  private modelPath: string = 'assets/models/tinyllama_bible_refinement.onnx';
  private tokenizerPath: string = 'assets/models/tinyllama/';
  private useEnhancedFallback: boolean = true; // Default to enhanced fallback
  private jesusQuotesService: JesusQuotesService;

  constructor() {
    this.jesusQuotesService = new JesusQuotesService();
  }

  /**
   * Initialize the local LLM service
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing Local LLM Service...');
      
      // Initialize Jesus Quotes Service
      await this.jesusQuotesService.initialize();
      
      // Check if tokenizer exists
      const tokenizerExists = await FileSystem.getInfoAsync(this.tokenizerPath);
      if (!tokenizerExists.exists) {
        console.warn('TinyLlama tokenizer not found. Using enhanced fallback mode.');
        this.useEnhancedFallback = true;
        this.isInitialized = true;
        return;
      }

      // Check if ONNX model exists
      const modelExists = await FileSystem.getInfoAsync(this.modelPath);
      if (!modelExists.exists) {
        console.warn('TinyLlama ONNX model not found. Using enhanced fallback mode.');
        this.useEnhancedFallback = true;
        this.isInitialized = true;
        return;
      }

      // TODO: Load ONNX model when available
      // For now, use enhanced fallback
      this.useEnhancedFallback = true;
      this.isInitialized = true;
      console.log('Local LLM Service initialized successfully (enhanced fallback mode)');
    } catch (error) {
      console.error('Failed to initialize Local LLM Service:', error);
      this.useEnhancedFallback = true;
      this.isInitialized = true;
    }
  }

  /**
   * Process a clarification to refine an existing response
   */
  async processClarification(context: ClarificationContext): Promise<LocalLLMResponse> {
    if (!this.isInitialized) {
      return this.fallbackRefinement(context);
    }

    const startTime = Date.now();
    
    try {
      // Use enhanced refinement logic
      const refinedResponse = await this.generateEnhancedRefinedResponse(context);
      
      const processingTime = Date.now() - startTime;
      
      return {
        refinedResponse,
        confidence: this.model ? 0.85 : 0.75, // Higher confidence for enhanced fallback
        processingTime
      };
    } catch (error) {
      console.error('Local LLM processing failed:', error);
      return this.fallbackRefinement(context);
    }
  }

  /**
   * Generate a refined response using enhanced text processing
   * This provides better clarification handling until TinyLlama is fully integrated
   */
  private async generateEnhancedRefinedResponse(context: ClarificationContext): Promise<string> {
    const { originalQuestion, originalResponse, userClarification } = context;
    
    // Enhanced clarification processing
    const clarification = userClarification.toLowerCase();
    
    // Check for Jesus quotes that might be relevant to the clarification
    let jesusQuotesContext = '';
    if (this.jesusQuotesService.isReady()) {
      try {
        const jesusQuotesResult = await this.jesusQuotesService.smartSearch(userClarification);
        if (jesusQuotesResult.totalFound > 0) {
          const relevantQuote = jesusQuotesResult.quotes[0];
          jesusQuotesContext = `\n\nRelevant Jesus Quote: "${relevantQuote.quote}" (${relevantQuote.reference})\nThis direct teaching from Jesus provides additional insight for your clarification.`;
        }
      } catch (error) {
        console.error('Error getting Jesus quotes for clarification:', error);
      }
    }
    
    // Handle different types of clarifications
    if (clarification.includes('focus on') || clarification.includes('emphasize')) {
      const focusMatch = userClarification.match(/(?:focus on|emphasize)\s+(.+)/i);
      if (focusMatch) {
        const focus = focusMatch[1];
        return `Focusing on ${focus}: ${originalResponse}${jesusQuotesContext}\n\nThis aspect of the biblical teaching emphasizes ${focus.toLowerCase()}, which is particularly relevant to understanding the deeper meaning of this passage.`;
      }
    }
    
    if (clarification.includes('context') || clarification.includes('modern') || clarification.includes('today')) {
      return `In the context you mentioned: ${originalResponse}${jesusQuotesContext}\n\nThis biblical teaching has important applications for modern life and contemporary situations. The principles remain timeless while the specific applications may vary in different cultural and historical contexts.`;
    }
    
    if (clarification.includes('explain') || clarification.includes('detail') || clarification.includes('more')) {
      return `Let me explain this in more detail: ${originalResponse}${jesusQuotesContext}\n\nThis biblical teaching involves several key concepts that work together to provide a complete understanding. The deeper we explore, the more we discover about God's wisdom and guidance for our lives.`;
    }
    
    if (clarification.includes('practical') || clarification.includes('apply') || clarification.includes('daily')) {
      return `From a practical application perspective: ${originalResponse}${jesusQuotesContext}\n\nThis teaching can be applied in daily life through specific actions, attitudes, and decisions. It's not just theoretical knowledge but practical wisdom for everyday living.`;
    }
    
    if (clarification.includes('beginner') || clarification.includes('new') || clarification.includes('simple')) {
      return `For someone new to this topic: ${originalResponse}${jesusQuotesContext}\n\nLet me break this down in simpler terms. The core message is that God provides guidance and wisdom for every aspect of our lives, and we can trust in His love and care.`;
    }
    
    if (clarification.includes('struggling') || clarification.includes('difficult') || clarification.includes('hurt')) {
      return `For someone going through a difficult time: ${originalResponse}${jesusQuotesContext}\n\nThis biblical teaching offers comfort and hope during challenging times. God understands our struggles and provides strength, comfort, and guidance when we need it most.`;
    }
    
    if (clarification.includes('yes') || clarification.includes('exactly') || clarification.includes('perfect')) {
      return `I'm glad that explanation was helpful! ${originalResponse}${jesusQuotesContext}\n\nThis biblical truth is indeed powerful and relevant. Is there anything specific about this topic you'd like to explore further, or do you have other questions about the Bible?`;
    }
    
    // Default enhanced response
    return `Addressing your clarification: ${originalResponse}${jesusQuotesContext}\n\nThis aspect of the biblical teaching provides additional insight and deeper understanding. The clarification helps us focus on the most relevant aspects for your specific question and situation.`;
  }

  /**
   * Fallback method when local LLM is not available
   */
  private async fallbackRefinement(context: ClarificationContext): Promise<LocalLLMResponse> {
    console.log('Using fallback refinement method');
    
    const startTime = Date.now();
    const refinedResponse = await this.generateEnhancedRefinedResponse(context);
    const processingTime = Date.now() - startTime;
    
    return {
      refinedResponse,
      confidence: 0.6, // Lower confidence for basic fallback
      processingTime
    };
  }

  /**
   * Check if the local LLM is available and ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get model information
   */
  getModelInfo(): { name: string; size: string; status: string } {
    return {
      name: 'TinyLlama 1.1B (Enhanced Fallback)',
      size: '~1.1GB',
      status: this.isReady() ? 'Enhanced Fallback Mode' : 'Not Available'
    };
  }

  /**
   * Get Jesus quotes service status
   */
  getJesusQuotesStatus(): { isReady: boolean; stats?: { totalQuotes: number; books: string[]; commonTopics: number } } {
    const isReady = this.jesusQuotesService.isReady();
    const stats = isReady ? this.jesusQuotesService.getDatabaseStats() : undefined;
    
    return {
      isReady,
      stats: stats || undefined
    };
  }

  /**
   * Test the clarification refinement with sample data
   */
  async testClarificationRefinement(): Promise<void> {
    console.log('🧪 Testing clarification refinement...');
    
    const testCases = [
      {
        name: "Focus Clarification",
        context: {
          originalQuestion: "What is the meaning of John 3:16?",
          originalResponse: "John 3:16 is one of the most famous verses in the Bible. It states: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' This verse summarizes the core message of the Gospel - God's love for humanity and the gift of salvation through faith in Jesus Christ.",
          userClarification: "Focus on the salvation aspect"
        }
      },
      {
        name: "Context Clarification",
        context: {
          originalQuestion: "Explain the parable of the Good Samaritan",
          originalResponse: "The parable of the Good Samaritan, found in Luke 10:25-37, tells the story of a man who was beaten and left for dead on the road to Jericho. A priest and a Levite passed by without helping, but a Samaritan stopped to care for him, bandaging his wounds and paying for his care at an inn.",
          userClarification: "In the context of modern society"
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n--- ${testCase.name} ---`);
      const result = await this.processClarification(testCase.context);
      console.log(`Input: ${testCase.context.userClarification}`);
      console.log(`Response: ${result.refinedResponse}`);
      console.log(`Confidence: ${result.confidence}`);
      console.log(`Processing Time: ${result.processingTime}ms`);
    }
  }
} 