import bibleData from '../../assets/bible_asv.json';

export interface BibleVerse {
  book: string;
  chapter: string;
  verse: string;
  text: string;
}

export interface BookMetadata {
  author: string;
  yearWritten: string;
  genre: string;
  testament: string;
  category: string;
  chapters: number;
  keyThemes: string[];
  originalLanguage: string;
  timeSpan: string;
}

export interface SearchResult {
  type: 'verse' | 'book' | 'metadata';
  book: string;
  chapter?: string;
  verse?: string;
  text?: string;
  metadata?: BookMetadata;
  relevance: number;
}

export interface SearchFilters {
  book?: string;
  chapter?: string;
  testament?: string;
  category?: string;
  author?: string;
  genre?: string;
}

class LocalBibleDataService {
  private bibleData: any;

  constructor() {
    this.bibleData = bibleData;
  }

  // Get all books with their metadata
  getAllBooks(): { [key: string]: BookMetadata } {
    return this.bibleData.metadata || {};
  }

  // Get metadata for a specific book
  getBookMetadata(bookName: string): BookMetadata | null {
    return this.bibleData.metadata?.[bookName] || null;
  }

  // Get all chapters for a book
  getBookChapters(bookName: string): string[] {
    const book = this.bibleData.books?.[bookName];
    if (!book) return [];
    return Object.keys(book).sort((a, b) => parseInt(a) - parseInt(b));
  }

  // Get all verses for a specific chapter
  getChapterVerses(bookName: string, chapter: string): BibleVerse[] {
    const book = this.bibleData.books?.[bookName];
    if (!book || !book[chapter]) return [];

    const verses: BibleVerse[] = [];
    const chapterData = book[chapter];
    
    Object.keys(chapterData).forEach(verseNum => {
      verses.push({
        book: bookName,
        chapter,
        verse: verseNum,
        text: chapterData[verseNum]
      });
    });

    return verses.sort((a, b) => parseInt(a.verse) - parseInt(b.verse));
  }

  // Get a specific verse
  getVerse(bookName: string, chapter: string, verse: string): BibleVerse | null {
    const book = this.bibleData.books?.[bookName];
    if (!book || !book[chapter] || !book[chapter][verse]) return null;

    return {
      book: bookName,
      chapter,
      verse,
      text: book[chapter][verse]
    };
  }

  // Get verses by reference (e.g., "Genesis 1:1")
  getVerseByReference(reference: string): BibleVerse | null {
    const match = reference.match(/^([1-3]?\s*[A-Za-z]+)\s+(\d+):(\d+)$/);
    if (!match) return null;

    const [, book, chapter, verse] = match;
    return this.getVerse(book, chapter, verse);
  }

  // Get all verses for a book
  getBookVerses(bookName: string): BibleVerse[] {
    const book = this.bibleData.books?.[bookName];
    if (!book) return [];

    const verses: BibleVerse[] = [];
    Object.entries(book).forEach(([chapter, chapterData]: [string, any]) => {
      Object.entries(chapterData).forEach(([verse, text]: [string, any]) => {
        verses.push({
          book: bookName,
          chapter,
          verse,
          text
        });
      });
    });

    return verses.sort((a, b) => {
      const chapterA = parseInt(a.chapter);
      const chapterB = parseInt(b.chapter);
      if (chapterA !== chapterB) return chapterA - chapterB;
      return parseInt(a.verse) - parseInt(b.verse);
    });
  }

  // Comprehensive search through verses and metadata
  search(query: string, filters?: SearchFilters): SearchResult[] {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search through book metadata
    Object.entries(this.bibleData.metadata || {}).forEach(([bookName, metadata]: [string, any]) => {
      // Apply filters
      if (filters?.book && bookName.toLowerCase() !== filters.book.toLowerCase()) return;
      if (filters?.testament && metadata.testament.toLowerCase() !== filters.testament.toLowerCase()) return;
      if (filters?.category && metadata.category.toLowerCase() !== filters.category.toLowerCase()) return;
      if (filters?.author && !metadata.author.toLowerCase().includes(filters.author.toLowerCase())) return;
      if (filters?.genre && metadata.genre.toLowerCase() !== filters.genre.toLowerCase()) return;

      let relevance = 0;

      // Check book name
      if (bookName.toLowerCase().includes(lowerQuery)) {
        relevance += 10;
      }

      // Check author
      if (metadata.author.toLowerCase().includes(lowerQuery)) {
        relevance += 8;
      }

      // Check genre
      if (metadata.genre.toLowerCase().includes(lowerQuery)) {
        relevance += 6;
      }

      // Check testament
      if (metadata.testament.toLowerCase().includes(lowerQuery)) {
        relevance += 5;
      }

      // Check category
      if (metadata.category.toLowerCase().includes(lowerQuery)) {
        relevance += 5;
      }

      // Check key themes
      metadata.keyThemes.forEach((theme: string) => {
        if (theme.toLowerCase().includes(lowerQuery)) {
          relevance += 7;
        }
      });

      // Check original language
      if (metadata.originalLanguage.toLowerCase().includes(lowerQuery)) {
        relevance += 3;
      }

      // Check year written
      if (metadata.yearWritten.toLowerCase().includes(lowerQuery)) {
        relevance += 4;
      }

      if (relevance > 0) {
        results.push({
          type: 'metadata',
          book: bookName,
          metadata,
          relevance
        });
      }
    });

    // Search through verse content
    Object.entries(this.bibleData.books || {}).forEach(([bookName, book]: [string, any]) => {
      // Apply book filter
      if (filters?.book && bookName.toLowerCase() !== filters.book.toLowerCase()) return;

      Object.entries(book).forEach(([chapter, chapterData]: [string, any]) => {
        // Apply chapter filter
        if (filters?.chapter && chapter !== filters.chapter) return;

        Object.entries(chapterData).forEach(([verse, text]: [string, any]) => {
          if (text.toLowerCase().includes(lowerQuery)) {
            // Calculate relevance based on position and frequency
            let relevance = 1;
            const words = text.toLowerCase().split(' ');
            const queryWords = lowerQuery.split(' ');
            
            queryWords.forEach(queryWord => {
              const matches = words.filter((word: string) => word.includes(queryWord)).length;
              relevance += matches * 2;
            });

            // Boost relevance if it's at the beginning of the verse
            if (text.toLowerCase().startsWith(lowerQuery)) {
              relevance += 5;
            }

            results.push({
              type: 'verse',
              book: bookName,
              chapter,
              verse,
              text,
              relevance
            });
          }
        });
      });
    });

    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 100); // Limit to top 100 results
  }

  // Search by book name only
  searchBooks(query: string): { [key: string]: BookMetadata } {
    const results: { [key: string]: BookMetadata } = {};
    const lowerQuery = query.toLowerCase();

    Object.entries(this.bibleData.metadata || {}).forEach(([bookName, metadata]: [string, any]) => {
      if (bookName.toLowerCase().includes(lowerQuery)) {
        results[bookName] = metadata;
      }
    });

    return results;
  }

  // Get books by category
  getBooksByCategory(category: string): { [key: string]: BookMetadata } {
    const results: { [key: string]: BookMetadata } = {};
    
    Object.entries(this.bibleData.metadata || {}).forEach(([bookName, metadata]: [string, any]) => {
      if (metadata.category.toLowerCase() === category.toLowerCase()) {
        results[bookName] = metadata;
      }
    });

    return results;
  }

  // Get books by testament
  getBooksByTestament(testament: string): { [key: string]: BookMetadata } {
    const results: { [key: string]: BookMetadata } = {};
    
    Object.entries(this.bibleData.metadata || {}).forEach(([bookName, metadata]: [string, any]) => {
      if (metadata.testament.toLowerCase() === testament.toLowerCase()) {
        results[bookName] = metadata;
      }
    });

    return results;
  }

  // Get books by author
  getBooksByAuthor(author: string): { [key: string]: BookMetadata } {
    const results: { [key: string]: BookMetadata } = {};
    
    Object.entries(this.bibleData.metadata || {}).forEach(([bookName, metadata]: [string, any]) => {
      if (metadata.author.toLowerCase().includes(author.toLowerCase())) {
        results[bookName] = metadata;
      }
    });

    return results;
  }

  // Get books by theme
  getBooksByTheme(theme: string): { [key: string]: BookMetadata } {
    const results: { [key: string]: BookMetadata } = {};
    const lowerTheme = theme.toLowerCase();
    
    Object.entries(this.bibleData.metadata || {}).forEach(([bookName, metadata]: [string, any]) => {
      if (metadata.keyThemes.some((t: string) => t.toLowerCase().includes(lowerTheme))) {
        results[bookName] = metadata;
      }
    });

    return results;
  }

  // Get total verse count for a book
  getBookVerseCount(bookName: string): number {
    const book = this.bibleData.books?.[bookName];
    if (!book) return 0;

    let count = 0;
    Object.values(book).forEach((chapter: any) => {
      count += Object.keys(chapter).length;
    });

    return count;
  }

  // Get total verse count for entire Bible
  getTotalVerseCount(): number {
    let count = 0;
    Object.values(this.bibleData.books || {}).forEach((book: any) => {
      Object.values(book).forEach((chapter: any) => {
        count += Object.keys(chapter).length;
      });
    });
    return count;
  }

  // Get statistics
  getStatistics(): { totalVerses: number; totalBooks: number; totalChapters: number } {
    const totalVerses = this.getTotalVerseCount();
    const totalBooks = Object.keys(this.bibleData.metadata || {}).length;
    
    let totalChapters = 0;
    Object.values(this.bibleData.books || {}).forEach((book: any) => {
      totalChapters += Object.keys(book).length;
    });

    return { totalVerses, totalBooks, totalChapters };
  }

  // Get random verse
  getRandomVerse(): BibleVerse | null {
    const books = Object.keys(this.bibleData.books || {});
    if (books.length === 0) return null;

    const randomBook = books[Math.floor(Math.random() * books.length)];
    const chapters = this.getBookChapters(randomBook);
    if (chapters.length === 0) return null;

    const randomChapter = chapters[Math.floor(Math.random() * chapters.length)];
    const verses = this.getChapterVerses(randomBook, randomChapter);
    if (verses.length === 0) return null;

    return verses[Math.floor(Math.random() * verses.length)];
  }

  // Get verses by range
  getVersesByRange(bookName: string, startChapter: string, endChapter: string): BibleVerse[] {
    const verses: BibleVerse[] = [];
    const start = parseInt(startChapter);
    const end = parseInt(endChapter);

    for (let chapter = start; chapter <= end; chapter++) {
      const chapterVerses = this.getChapterVerses(bookName, chapter.toString());
      verses.push(...chapterVerses);
    }

    return verses;
  }

  // Get all available categories
  getCategories(): string[] {
    const categories = new Set<string>();
    Object.values(this.bibleData.metadata || {}).forEach((metadata: any) => {
      categories.add(metadata.category);
    });
    return Array.from(categories).sort();
  }

  // Get all available authors
  getAuthors(): string[] {
    const authors = new Set<string>();
    Object.values(this.bibleData.metadata || {}).forEach((metadata: any) => {
      authors.add(metadata.author);
    });
    return Array.from(authors).sort();
  }

  // Get all available themes
  getThemes(): string[] {
    const themes = new Set<string>();
    Object.values(this.bibleData.metadata || {}).forEach((metadata: any) => {
      metadata.keyThemes.forEach((theme: string) => themes.add(theme));
    });
    return Array.from(themes).sort();
  }
}

export default new LocalBibleDataService(); 