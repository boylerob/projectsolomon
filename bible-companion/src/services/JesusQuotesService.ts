import * as FileSystem from 'expo-file-system';

export interface JesusQuote {
  id: number;
  reference: string;
  book: string;
  chapter: number;
  verse: number;
  quote: string;
  keywords: string[];
  length: number;
  isDirectSpeech: boolean;
}

export interface JesusQuotesDatabase {
  metadata: {
    source: string;
    totalQuotes: number;
    description: string;
    processedAt: string;
    queryCapabilities: string[];
  };
  indexes: {
    verseIndex: Record<string, number>;
    topicIndex: Record<string, number[]>;
  };
  quotes: JesusQuote[];
  searchHelpers: {
    commonTopics: string[];
    books: string[];
    shortQuotes: number[];
    longQuotes: number[];
  };
}

export interface JesusQuoteSearchResult {
  quotes: JesusQuote[];
  totalFound: number;
  searchType: 'verse' | 'topic' | 'keyword' | 'book';
  searchTerm: string;
  processingTime: number;
}

export class JesusQuotesService {
  private database: JesusQuotesDatabase | null = null;
  private isInitialized: boolean = false;
  private databasePath: string = 'assets/jesus_quotes_agent_optimized.json';

  /**
   * Initialize the Jesus Quotes Service
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing Jesus Quotes Service...');
      
      const databaseExists = await FileSystem.getInfoAsync(this.databasePath);
      if (!databaseExists.exists) {
        console.warn('Jesus quotes database not found at:', this.databasePath);
        this.isInitialized = false;
        return;
      }

      const databaseContent = await FileSystem.readAsStringAsync(this.databasePath);
      this.database = JSON.parse(databaseContent);
      this.isInitialized = true;
      
      if (this.database) {
        console.log(`✅ Jesus Quotes Service initialized with ${this.database.quotes.length} quotes`);
        console.log(`📚 Books available: ${this.database.searchHelpers.books.join(', ')}`);
        console.log(`🔍 Common topics: ${this.database.searchHelpers.commonTopics.length}`);
      }
    } catch (error) {
      console.error('Failed to initialize Jesus Quotes Service:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Check if the service is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.database !== null;
  }

  /**
   * Get database statistics
   */
  getDatabaseStats(): { totalQuotes: number; books: string[]; commonTopics: number } | null {
    if (!this.isReady() || !this.database) return null;
    
    return {
      totalQuotes: this.database.quotes.length,
      books: this.database.searchHelpers.books,
      commonTopics: this.database.searchHelpers.commonTopics.length
    };
  }

  /**
   * Search for Jesus quotes by verse reference
   */
  async searchByVerse(reference: string): Promise<JesusQuoteSearchResult> {
    const startTime = Date.now();
    
    if (!this.isReady()) {
      return {
        quotes: [],
        totalFound: 0,
        searchType: 'verse',
        searchTerm: reference,
        processingTime: Date.now() - startTime
      };
    }

    // Normalize reference format
    const normalizedRef = this.normalizeReference(reference);
    const quoteId = this.database!.indexes.verseIndex[normalizedRef];
    
    if (quoteId) {
      const quote = this.database!.quotes.find(q => q.id === quoteId);
      if (quote) {
        return {
          quotes: [quote],
          totalFound: 1,
          searchType: 'verse',
          searchTerm: reference,
          processingTime: Date.now() - startTime
        };
      }
    }

    return {
      quotes: [],
      totalFound: 0,
      searchType: 'verse',
      searchTerm: reference,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Search for Jesus quotes by topic/keyword
   */
  async searchByTopic(topic: string): Promise<JesusQuoteSearchResult> {
    const startTime = Date.now();
    
    if (!this.isReady()) {
      return {
        quotes: [],
        totalFound: 0,
        searchType: 'topic',
        searchTerm: topic,
        processingTime: Date.now() - startTime
      };
    }

    const lowerTopic = topic.toLowerCase();
    const matchingQuoteIds: number[] = [];

    // Search in topic index
    for (const [keyword, quoteIds] of Object.entries(this.database!.indexes.topicIndex)) {
      if (keyword.includes(lowerTopic) || lowerTopic.includes(keyword)) {
        matchingQuoteIds.push(...quoteIds);
      }
    }

    // Remove duplicates
    const uniqueIds = [...new Set(matchingQuoteIds)];
    const quotes = this.database!.quotes.filter(q => uniqueIds.includes(q.id));

    return {
      quotes,
      totalFound: quotes.length,
      searchType: 'topic',
      searchTerm: topic,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Search for Jesus quotes by book
   */
  async searchByBook(book: string): Promise<JesusQuoteSearchResult> {
    const startTime = Date.now();
    
    if (!this.isReady()) {
      return {
        quotes: [],
        totalFound: 0,
        searchType: 'book',
        searchTerm: book,
        processingTime: Date.now() - startTime
      };
    }

    const lowerBook = book.toLowerCase();
    const quotes = this.database!.quotes.filter(q => 
      q.book.toLowerCase().includes(lowerBook) || lowerBook.includes(q.book.toLowerCase())
    );

    return {
      quotes,
      totalFound: quotes.length,
      searchType: 'book',
      searchTerm: book,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Search for Jesus quotes by keyword in quote text
   */
  async searchByKeyword(keyword: string): Promise<JesusQuoteSearchResult> {
    const startTime = Date.now();
    
    if (!this.isReady()) {
      return {
        quotes: [],
        totalFound: 0,
        searchType: 'keyword',
        searchTerm: keyword,
        processingTime: Date.now() - startTime
      };
    }

    const lowerKeyword = keyword.toLowerCase();
    const quotes = this.database!.quotes.filter(q => 
      q.quote.toLowerCase().includes(lowerKeyword) ||
      q.keywords.some(k => k.toLowerCase().includes(lowerKeyword))
    );

    return {
      quotes,
      totalFound: quotes.length,
      searchType: 'keyword',
      searchTerm: keyword,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Get quotes by length (short or long)
   */
  async getQuotesByLength(type: 'short' | 'long'): Promise<JesusQuoteSearchResult> {
    const startTime = Date.now();
    
    if (!this.isReady()) {
      return {
        quotes: [],
        totalFound: 0,
        searchType: 'keyword',
        searchTerm: type,
        processingTime: Date.now() - startTime
      };
    }

    const quoteIds = type === 'short' 
      ? this.database!.searchHelpers.shortQuotes 
      : this.database!.searchHelpers.longQuotes;
    
    const quotes = this.database!.quotes.filter(q => quoteIds.includes(q.id));

    return {
      quotes,
      totalFound: quotes.length,
      searchType: 'keyword',
      searchTerm: type,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Get common topics available for search
   */
  getCommonTopics(): string[] {
    if (!this.isReady()) return [];
    return this.database!.searchHelpers.commonTopics;
  }

  /**
   * Get available books
   */
  getAvailableBooks(): string[] {
    if (!this.isReady()) return [];
    return this.database!.searchHelpers.books;
  }

  /**
   * Smart search that tries multiple search methods
   */
  async smartSearch(query: string): Promise<JesusQuoteSearchResult> {
    const startTime = Date.now();
    
    if (!this.isReady()) {
      return {
        quotes: [],
        totalFound: 0,
        searchType: 'keyword',
        searchTerm: query,
        processingTime: Date.now() - startTime
      };
    }

    // Try verse reference first
    const verseResult = await this.searchByVerse(query);
    if (verseResult.totalFound > 0) {
      return verseResult;
    }

    // Try topic search
    const topicResult = await this.searchByTopic(query);
    if (topicResult.totalFound > 0) {
      return topicResult;
    }

    // Try book search
    const bookResult = await this.searchByBook(query);
    if (bookResult.totalFound > 0) {
      return bookResult;
    }

    // Try keyword search
    const keywordResult = await this.searchByKeyword(query);
    return keywordResult;
  }

  /**
   * Get a random Jesus quote
   */
  async getRandomQuote(): Promise<JesusQuote | null> {
    if (!this.isReady()) return null;
    
    const randomIndex = Math.floor(Math.random() * this.database!.quotes.length);
    return this.database!.quotes[randomIndex];
  }

  /**
   * Get quotes for a specific chapter
   */
  async getQuotesForChapter(book: string, chapter: number): Promise<JesusQuoteSearchResult> {
    const startTime = Date.now();
    
    if (!this.isReady()) {
      return {
        quotes: [],
        totalFound: 0,
        searchType: 'keyword',
        searchTerm: `${book} ${chapter}`,
        processingTime: Date.now() - startTime
      };
    }

    const quotes = this.database!.quotes.filter(q => 
      q.book.toLowerCase() === book.toLowerCase() && q.chapter === chapter
    );

    return {
      quotes,
      totalFound: quotes.length,
      searchType: 'keyword',
      searchTerm: `${book} ${chapter}`,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Normalize reference format for consistent lookup
   */
  private normalizeReference(reference: string): string {
    // Convert "Matthew 5:3" to "matthew_5_3"
    return reference.toLowerCase().replace(/[:\s]/g, '_');
  }

  /**
   * Test the service with sample queries
   */
  async testService(): Promise<void> {
    console.log('🧪 Testing Jesus Quotes Service...');
    
    if (!this.isReady()) {
      console.log('❌ Service not ready');
      return;
    }

    const testCases = [
      { type: 'verse', query: 'Matthew 3:15', description: 'Direct verse lookup' },
      { type: 'topic', query: 'kingdom', description: 'Topic search' },
      { type: 'book', query: 'John', description: 'Book search' },
      { type: 'keyword', query: 'love', description: 'Keyword search' },
      { type: 'smart', query: 'blessed', description: 'Smart search' }
    ];

    for (const testCase of testCases) {
      console.log(`\n--- ${testCase.description} ---`);
      let result: JesusQuoteSearchResult;
      
      switch (testCase.type) {
        case 'verse':
          result = await this.searchByVerse(testCase.query);
          break;
        case 'topic':
          result = await this.searchByTopic(testCase.query);
          break;
        case 'book':
          result = await this.searchByBook(testCase.query);
          break;
        case 'keyword':
          result = await this.searchByKeyword(testCase.query);
          break;
        case 'smart':
          result = await this.smartSearch(testCase.query);
          break;
        default:
          continue;
      }

      console.log(`Query: ${testCase.query}`);
      console.log(`Found: ${result.totalFound} quotes`);
      console.log(`Type: ${result.searchType}`);
      console.log(`Time: ${result.processingTime}ms`);
      
      if (result.quotes.length > 0) {
        console.log(`Sample: ${result.quotes[0].reference} - "${result.quotes[0].quote.substring(0, 50)}..."`);
      }
    }
  }
}

export default JesusQuotesService; 