/**
 * Content Processing Service
 * Handles web scraping, file processing, and TinyLlama-powered content analysis
 * for the knowledge base system
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

export interface ProcessingJob {
  id: number;
  sourceId: number;
  jobType: 'web_scrape' | 'file_upload' | 'content_analysis';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progressPercentage: number;
  errorMessage?: string;
}

export interface ContentChunk {
  chunkText: string;
  chunkSummary: string;
  keyConcepts: string[];
  biblicalReferences: string[];
  theologicalThemes: string[];
  authorityScore: number;
  consensusScore: number;
  conflictFlags: string[];
  chunkType: 'doctrine' | 'commentary' | 'historical' | 'application' | 'general';
}

export interface ProcessedSource {
  sourceId: number;
  chunks: ContentChunk[];
  totalChunks: number;
  processingTime: number;
  conflictsDetected: number;
}

export class ContentProcessingService {
  private backendUrl: string;
  private tinyLlamaUrl: string;
  
  constructor() {
    this.backendUrl = 'https://solomon-backend-841857698822.us-central1.run.app';
    this.tinyLlamaUrl = 'http://localhost:8080'; // TinyLlama server
  }

  /**
   * Process a web URL and extract content
   */
  async processWebUrl(url: string, sourceId: number): Promise<ProcessedSource> {
    try {
      console.log(`🌐 Processing web URL: ${url}`);
      
      // Update job status to processing
      await this.updateJobStatus(sourceId, 'processing', 10);
      
      // Scrape the webpage
      const html = await this.scrapeWebpage(url);
      const textContent = this.extractTextContent(html);
      
      await this.updateJobStatus(sourceId, 'processing', 30);
      
      // Process content with TinyLlama
      const chunks = await this.processContentWithTinyLlama(textContent, sourceId);
      
      await this.updateJobStatus(sourceId, 'processing', 80);
      
      // Store chunks in database
      await this.storeChunks(chunks, sourceId);
      
      await this.updateJobStatus(sourceId, 'completed', 100);
      
      return {
        sourceId,
        chunks,
        totalChunks: chunks.length,
        processingTime: Date.now(),
        conflictsDetected: chunks.reduce((sum, chunk) => sum + chunk.conflictFlags.length, 0)
      };
      
    } catch (error) {
      console.error('Error processing web URL:', error);
      await this.updateJobStatus(sourceId, 'failed', 0, error.message);
      throw error;
    }
  }

  /**
   * Process an uploaded file
   */
  async processFile(filePath: string, sourceId: number): Promise<ProcessedSource> {
    try {
      console.log(`📄 Processing file: ${filePath}`);
      
      await this.updateJobStatus(sourceId, 'processing', 10);
      
      // Read file content
      const fileContent = await this.readFileContent(filePath);
      
      await this.updateJobStatus(sourceId, 'processing', 30);
      
      // Process content with TinyLlama
      const chunks = await this.processContentWithTinyLlama(fileContent, sourceId);
      
      await this.updateJobStatus(sourceId, 'processing', 80);
      
      // Store chunks in database
      await this.storeChunks(chunks, sourceId);
      
      await this.updateJobStatus(sourceId, 'completed', 100);
      
      return {
        sourceId,
        chunks,
        totalChunks: chunks.length,
        processingTime: Date.now(),
        conflictsDetected: chunks.reduce((sum, chunk) => sum + chunk.conflictFlags.length, 0)
      };
      
    } catch (error) {
      console.error('Error processing file:', error);
      await this.updateJobStatus(sourceId, 'failed', 0, error.message);
      throw error;
    }
  }

  /**
   * Scrape webpage content
   */
  private async scrapeWebpage(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to scrape webpage: ${error.message}`);
    }
  }

  /**
   * Extract text content from HTML
   */
  private extractTextContent(html: string): string {
    const $ = cheerio.load(html);
    
    // Remove script and style elements
    $('script, style, nav, footer, header').remove();
    
    // Extract text from main content areas
    const contentSelectors = [
      'main',
      'article',
      '.content',
      '.post-content',
      '.entry-content',
      '#content',
      'body'
    ];
    
    let content = '';
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }
    
    // Clean up the text
    return content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }

  /**
   * Read file content
   */
  private async readFileContent(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          reject(new Error(`Failed to read file: ${err.message}`));
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * Process content with TinyLlama Agent
   */
  private async processContentWithTinyLlama(content: string, sourceId: number): Promise<ContentChunk[]> {
    try {
      console.log('🤖 Processing content with TinyLlama Agent...');
      
      // Split content into manageable chunks
      const chunks = this.splitContentIntoChunks(content, 2000);
      const processedChunks: ContentChunk[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`Processing chunk ${i + 1}/${chunks.length}`);
        
        // Use TinyLlama Agent for intelligent analysis
        const analysis = await this.analyzeChunkWithTinyLlamaAgent(chunk);
        
        const processedChunk: ContentChunk = {
          chunkText: chunk,
          chunkSummary: analysis.summary || this.generateSummary(chunk),
          keyConcepts: analysis.keyTopics || this.extractKeyConcepts(chunk),
          biblicalReferences: analysis.biblicalReferences || this.extractBiblicalReferences(chunk),
          theologicalThemes: analysis.theologicalThemes || this.extractTheologicalThemes(chunk),
          authorityScore: analysis.confidence || this.calculateAuthorityScore(chunk),
          consensusScore: analysis.consensusScore || 0.5,
          conflictFlags: analysis.conflicts || this.detectConflicts(chunk),
          chunkType: this.determineChunkType(chunk, analysis)
        };
        
        processedChunks.push(processedChunk);
      }
      
      return processedChunks;
      
    } catch (error) {
      console.error('Error processing content with TinyLlama Agent:', error);
      // Fallback to basic processing
      return this.fallbackProcessing(content);
    }
  }

  /**
   * Analyze chunk with TinyLlama Agent
   */
  private async analyzeChunkWithTinyLlamaAgent(chunkText: string): Promise<any> {
    try {
      const response = await axios.post(`${this.backendUrl}/api/agent/analyze-content`, {
        content: chunkText,
        taskType: 'ingestion_analysis',
        context: {
          sourceType: 'knowledge_base',
          processingMode: 'intelligent_analysis'
        }
      });
      
      if (response.data.success) {
        return response.data.analysis;
      } else {
        throw new Error('Agent analysis failed');
      }
    } catch (error) {
      console.error('Error calling TinyLlama Agent:', error);
      return this.fallbackAnalysis(chunkText);
    }
  }

  /**
   * Generate summary for chunk
   */
  private generateSummary(chunkText: string): string {
    const sentences = chunkText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keySentences = sentences.slice(0, 2);
    return keySentences.join('. ') + '.';
  }

  /**
   * Calculate authority score for chunk
   */
  private calculateAuthorityScore(chunkText: string): number {
    let score = 0.5;
    
    if (chunkText.match(/\d+:\d+/)) score += 0.2; // Has biblical references
    if (chunkText.includes('"') && chunkText.includes('"')) score += 0.1; // Has quotes
    if (chunkText.length > 200) score += 0.1; // Substantial content
    
    return Math.min(1.0, score);
  }

  /**
   * Determine chunk type based on content and analysis
   */
  private determineChunkType(chunkText: string, analysis: any): ContentChunk['chunkType'] {
    const lowerText = chunkText.toLowerCase();
    
    if (lowerText.includes('doctrine') || lowerText.includes('theology')) return 'doctrine';
    if (lowerText.includes('commentary') || lowerText.includes('interpretation')) return 'commentary';
    if (lowerText.includes('history') || lowerText.includes('ancient')) return 'historical';
    if (lowerText.includes('apply') || lowerText.includes('practice')) return 'application';
    
    return 'general';
  }

  /**
   * Fallback processing when agent is unavailable
   */
  private fallbackProcessing(content: string): ContentChunk[] {
    const chunks = this.splitContentIntoChunks(content, 2000);
    return chunks.map(chunk => ({
      chunkText: chunk,
      chunkSummary: this.generateSummary(chunk),
      keyConcepts: this.extractKeyConcepts(chunk),
      biblicalReferences: this.extractBiblicalReferences(chunk),
      theologicalThemes: this.extractTheologicalThemes(chunk),
      authorityScore: this.calculateAuthorityScore(chunk),
      consensusScore: 0.5,
      conflictFlags: this.detectConflicts(chunk),
      chunkType: 'general' as const
    }));
  }

  /**
   * Split content into chunks
   */
  private splitContentIntoChunks(content: string, maxLength: number): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const sentenceWithPeriod = sentence.trim() + '.';
      
      if (currentChunk.length + sentenceWithPeriod.length <= maxLength) {
        currentChunk += sentenceWithPeriod + ' ';
      } else {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentenceWithPeriod + ' ';
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  /**
   * Analyze a single chunk with TinyLlama
   */
  private async analyzeChunkWithTinyLlama(chunkText: string): Promise<any> {
    try {
      const prompt = `
        Analyze the following theological content and provide structured analysis:
        
        Content: "${chunkText}"
        
        Please provide a JSON response with the following structure:
        {
          "summary": "Brief summary of the content",
          "keyConcepts": ["concept1", "concept2", "concept3"],
          "biblicalReferences": ["John 3:16", "Matthew 6:5-15"],
          "theologicalThemes": ["love", "forgiveness", "grace"],
          "authorityScore": 0.7,
          "consensusScore": 0.8,
          "conflictFlags": [],
          "chunkType": "doctrine"
        }
        
        Guidelines:
        - Extract biblical references in standard format (Book Chapter:Verse)
        - Identify theological themes and key concepts
        - Assess authority score (0.0-1.0) based on content quality
        - Assess consensus score (0.0-1.0) based on how widely accepted the view is
        - Flag any conflicts with biblical authority (especially Jesus' teachings)
        - Categorize as: doctrine, commentary, historical, application, or general
      `;
      
      const response = await axios.post(this.tinyLlamaUrl, {
        prompt: prompt,
        max_tokens: 500,
        temperature: 0.3
      });
      
      const analysisText = response.data.response;
      
      // Try to parse JSON from response
      try {
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.warn('Failed to parse TinyLlama JSON response, using fallback');
      }
      
      // Fallback analysis if JSON parsing fails
      return this.fallbackAnalysis(chunkText);
      
    } catch (error) {
      console.error('TinyLlama analysis failed, using fallback:', error);
      return this.fallbackAnalysis(chunkText);
    }
  }

  /**
   * Fallback analysis when TinyLlama is unavailable
   */
  private fallbackAnalysis(chunkText: string): any {
    const biblicalReferences = this.extractBiblicalReferences(chunkText);
    const keyConcepts = this.extractKeyConcepts(chunkText);
    const theologicalThemes = this.extractTheologicalThemes(chunkText);
    const conflictFlags = this.detectConflicts(chunkText);
    
    return {
      summary: chunkText.substring(0, 200) + '...',
      keyConcepts: keyConcepts.slice(0, 5),
      biblicalReferences: biblicalReferences,
      theologicalThemes: theologicalThemes.slice(0, 3),
      authorityScore: 0.5,
      consensusScore: 0.5,
      conflictFlags: conflictFlags,
      chunkType: 'general'
    };
  }

  /**
   * Extract biblical references from text
   */
  private extractBiblicalReferences(text: string): string[] {
    const referenceRegex = /([1-3]?\s*[A-Za-z]+\s+\d+:\d+)/gi;
    const matches = text.match(referenceRegex);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Extract key concepts from text
   */
  private extractKeyConcepts(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
    
    // Count word frequency
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Return top words
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Extract theological themes
   */
  private extractTheologicalThemes(text: string): string[] {
    const theologicalKeywords = [
      'love', 'forgiveness', 'grace', 'salvation', 'sin', 'repentance',
      'faith', 'hope', 'charity', 'mercy', 'justice', 'righteousness',
      'holiness', 'sanctification', 'redemption', 'atonement', 'covenant',
      'kingdom', 'discipleship', 'worship', 'prayer', 'obedience'
    ];
    
    const lowerText = text.toLowerCase();
    return theologicalKeywords.filter(keyword => lowerText.includes(keyword));
  }

  /**
   * Detect conflicts with biblical authority
   */
  private detectConflicts(text: string): string[] {
    const conflicts: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Check for love/forgiveness contradictions
    if ((lowerText.includes('hate') || lowerText.includes('vengeance')) && 
        !lowerText.includes('love') && !lowerText.includes('forgive')) {
      conflicts.push('Potential contradiction with biblical love/forgiveness theme');
    }
    
    // Check for salvation contradictions
    if (lowerText.includes('works') && lowerText.includes('salvation') && 
        !lowerText.includes('grace') && !lowerText.includes('faith')) {
      conflicts.push('Potential contradiction with salvation by grace through faith');
    }
    
    // Check for Jesus authority contradictions
    if (lowerText.includes('jesus') && 
        (lowerText.includes('not god') || lowerText.includes('just man'))) {
      conflicts.push('Contradicts Jesus\' divine authority');
    }
    
    return conflicts;
  }

  /**
   * Update job status in database
   */
  private async updateJobStatus(sourceId: number, status: string, progress: number, errorMessage?: string): Promise<void> {
    try {
      await axios.put(`${this.backendUrl}/api/knowledge/jobs/${sourceId}`, {
        status,
        progressPercentage: progress,
        errorMessage
      });
    } catch (error) {
      console.error('Failed to update job status:', error);
    }
  }

  /**
   * Store chunks in database
   */
  private async storeChunks(chunks: ContentChunk[], sourceId: number): Promise<void> {
    try {
      for (const chunk of chunks) {
        await axios.post(`${this.backendUrl}/api/knowledge/chunks`, {
          sourceId,
          chunkText: chunk.chunkText,
          chunkSummary: chunk.chunkSummary,
          keyConcepts: chunk.keyConcepts,
          biblicalReferences: chunk.biblicalReferences,
          theologicalThemes: chunk.theologicalThemes,
          authorityScore: chunk.authorityScore,
          consensusScore: chunk.consensusScore,
          conflictFlags: chunk.conflictFlags,
          chunkType: chunk.chunkType
        });
      }
    } catch (error) {
      console.error('Failed to store chunks:', error);
      throw error;
    }
  }

  /**
   * Get processing jobs
   */
  async getProcessingJobs(): Promise<ProcessingJob[]> {
    try {
      const response = await axios.get(`${this.backendUrl}/api/knowledge/jobs`);
      return response.data.jobs;
    } catch (error) {
      console.error('Failed to get processing jobs:', error);
      return [];
    }
  }

  /**
   * Process pending jobs
   */
  async processPendingJobs(): Promise<void> {
    try {
      const jobs = await this.getProcessingJobs();
      const pendingJobs = jobs.filter(job => job.status === 'pending');
      
      console.log(`🔄 Processing ${pendingJobs.length} pending jobs...`);
      
      for (const job of pendingJobs) {
        try {
          // Get source details
          const sourceResponse = await axios.get(`${this.backendUrl}/api/knowledge/sources/${job.sourceId}`);
          const source = sourceResponse.data.source;
          
          if (source.sourceUrl) {
            await this.processWebUrl(source.sourceUrl, job.sourceId);
          } else if (source.filePath) {
            await this.processFile(source.filePath, job.sourceId);
          }
        } catch (error) {
          console.error(`Failed to process job ${job.id}:`, error);
          await this.updateJobStatus(job.sourceId, 'failed', 0, error.message);
        }
      }
    } catch (error) {
      console.error('Failed to process pending jobs:', error);
    }
  }
}

export default new ContentProcessingService(); 