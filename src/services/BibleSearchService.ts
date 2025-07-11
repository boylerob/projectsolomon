import axios from 'axios';

export interface BibleVerse {
  reference: string;
  text: string;
  translation: string;
  book: string;
  chapter: number;
  verse: number;
  author: string | string[];
  yearWritten: string;
  genre: string;
}

export interface SearchFilters {
  book?: string;
  chapter?: number;
  lemma?: string;
  useVerbForms?: boolean;
}

export class BibleSearchService {
  private static instance: BibleSearchService;
  private readonly apiBaseUrl = 'http://192.168.1.231:3000/api';
  private readonly translation = 'ASV';

  private constructor() {}

  public static getInstance(): BibleSearchService {
    if (!BibleSearchService.instance) {
      BibleSearchService.instance = new BibleSearchService();
    }
    return BibleSearchService.instance;
  }

  async getBooks(searchResults?: BibleVerse[]): Promise<string[]> {
    try {
      const uniqueBooks = searchResults ? [...new Set(searchResults.map(verse => verse.book))] : undefined;
      
      const response = await axios.get(`${this.apiBaseUrl}/books`, {
        params: {
          books: uniqueBooks ? JSON.stringify(uniqueBooks) : undefined
        }
      });
      
      console.log('Books response:', {
        searchResultsCount: searchResults?.length,
        uniqueBooksCount: uniqueBooks?.length,
        returnedBooksCount: response.data.length,
        uniqueBooks: uniqueBooks
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting books:', error);
      return [];
    }
  }

  async getChapters(book: string): Promise<number[]> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/chapters/${book}`);
      return response.data;
    } catch (error) {
      console.error('Error getting chapters:', error);
      return [];
    }
  }

  async searchVerses(query: string, filters?: SearchFilters): Promise<BibleVerse[]> {
    try {
      console.log('Searching for:', query, 'with filters:', filters);
      const response = await axios.get(`${this.apiBaseUrl}/search`, {
        params: {
          q: query,
          book: filters?.book,
          chapter: filters?.chapter,
          lemma: filters?.lemma,
          useVerbForms: filters?.useVerbForms ? 'true' : 'false'
        }
      });
      console.log(`Found ${response.data.length} results for query: ${query}`);
      return response.data;
    } catch (error) {
      console.error('Error searching verses:', error);
      return [];
    }
  }

  async getVerse(reference: string): Promise<BibleVerse | null> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/verse/${reference}`);
      return response.data;
    } catch (error) {
      console.error('Error getting verse:', error);
      return null;
    }
  }

  async getVerses(book: string, chapter: number): Promise<BibleVerse[]> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/verses/${book}/${chapter}`);
      return response.data;
    } catch (error) {
      console.error('Error getting verses:', error);
      throw error;
    }
  }

  async getAllVerses(): Promise<BibleVerse[]> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/verses`);
      return response.data;
    } catch (error) {
      console.error('Error getting all verses:', error);
      throw error;
    }
  }
}
