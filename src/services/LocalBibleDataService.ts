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
  
  // Verb forms dictionary for enhanced search
  private verbForms: { [key: string]: string[] } = {
    'run': ['run', 'runs', 'running', 'ran'],
    'be': ['be', 'is', 'are', 'was', 'were', 'being', 'been'],
    'have': ['have', 'has', 'had', 'having'],
    'do': ['do', 'does', 'did', 'doing', 'done'],
    'go': ['go', 'goes', 'went', 'going', 'gone'],
    'come': ['come', 'comes', 'came', 'coming'],
    'take': ['take', 'takes', 'took', 'taking', 'taken'],
    'make': ['make', 'makes', 'made', 'making'],
    'know': ['know', 'knows', 'knew', 'knowing', 'known'],
    'see': ['see', 'sees', 'saw', 'seeing', 'seen'],
    'get': ['get', 'gets', 'got', 'getting', 'gotten'],
    'give': ['give', 'gives', 'gave', 'giving', 'given'],
    'find': ['find', 'finds', 'found', 'finding'],
    'think': ['think', 'thinks', 'thought', 'thinking'],
    'tell': ['tell', 'tells', 'told', 'telling'],
    'ask': ['ask', 'asks', 'asked', 'asking'],
    'work': ['work', 'works', 'worked', 'working'],
    'seem': ['seem', 'seems', 'seemed', 'seeming'],
    'feel': ['feel', 'feels', 'felt', 'feeling'],
    'try': ['try', 'tries', 'tried', 'trying'],
    'leave': ['leave', 'leaves', 'left', 'leaving'],
    'call': ['call', 'calls', 'called', 'calling'],
    'walk': ['walk', 'walks', 'walked', 'walking'],
    'stand': ['stand', 'stands', 'stood', 'standing'],
    'sit': ['sit', 'sits', 'sat', 'sitting'],
    'lie': ['lie', 'lies', 'lay', 'lying', 'lain'],
    'speak': ['speak', 'speaks', 'spoke', 'speaking', 'spoken'],
    'hear': ['hear', 'hears', 'heard', 'hearing'],
    'read': ['read', 'reads', 'reading'],
    'write': ['write', 'writes', 'wrote', 'writing', 'written'],
    'bring': ['bring', 'brings', 'brought', 'bringing'],
    'build': ['build', 'builds', 'built', 'building'],
    'buy': ['buy', 'buys', 'bought', 'buying'],
    'catch': ['catch', 'catches', 'caught', 'catching'],
    'choose': ['choose', 'chooses', 'chose', 'choosing', 'chosen'],
    'cut': ['cut', 'cuts', 'cutting'],
    'drink': ['drink', 'drinks', 'drank', 'drinking', 'drunk'],
    'eat': ['eat', 'eats', 'ate', 'eating', 'eaten'],
    'fall': ['fall', 'falls', 'fell', 'falling', 'fallen'],
    'fight': ['fight', 'fights', 'fought', 'fighting'],
    'forget': ['forget', 'forgets', 'forgot', 'forgetting', 'forgotten'],
    'forgive': ['forgive', 'forgives', 'forgave', 'forgiving', 'forgiven'],
    'freeze': ['freeze', 'freezes', 'froze', 'freezing', 'frozen'],
    'grow': ['grow', 'grows', 'grew', 'growing', 'grown'],
    'hide': ['hide', 'hides', 'hid', 'hiding', 'hidden'],
    'hold': ['hold', 'holds', 'held', 'holding'],
    'keep': ['keep', 'keeps', 'kept', 'keeping'],
    'lead': ['lead', 'leads', 'led', 'leading'],
    'lose': ['lose', 'loses', 'lost', 'losing'],
    'meet': ['meet', 'meets', 'met', 'meeting'],
    'pay': ['pay', 'pays', 'paid', 'paying'],
    'put': ['put', 'puts', 'putting'],
    'rise': ['rise', 'rises', 'rose', 'rising', 'risen'],
    'seek': ['seek', 'seeks', 'sought', 'seeking'],
    'sell': ['sell', 'sells', 'sold', 'selling'],
    'send': ['send', 'sends', 'sent', 'sending'],
    'shake': ['shake', 'shakes', 'shook', 'shaking', 'shaken'],
    'shine': ['shine', 'shines', 'shone', 'shining'],
    'shoot': ['shoot', 'shoots', 'shot', 'shooting'],
    'shut': ['shut', 'shuts', 'shutting'],
    'sing': ['sing', 'sings', 'sang', 'singing', 'sung'],
    'sleep': ['sleep', 'sleeps', 'slept', 'sleeping'],
    'spend': ['spend', 'spends', 'spent', 'spending'],
    'steal': ['steal', 'steals', 'stole', 'stealing', 'stolen'],
    'swim': ['swim', 'swims', 'swam', 'swimming', 'swum'],
    'teach': ['teach', 'teaches', 'taught', 'teaching'],
    'tear': ['tear', 'tears', 'tore', 'tearing', 'torn'],
    'throw': ['throw', 'throws', 'threw', 'throwing', 'thrown'],
    'understand': ['understand', 'understands', 'understood', 'understanding'],
    'wake': ['wake', 'wakes', 'woke', 'waking', 'woken'],
    'wear': ['wear', 'wears', 'wore', 'wearing', 'worn'],
    'win': ['win', 'wins', 'won', 'winning'],
    'believe': ['believe', 'believes', 'believed', 'believing'],
    'pray': ['pray', 'prays', 'prayed', 'praying'],
    'bless': ['bless', 'blesses', 'blessed', 'blessing'],
    'curse': ['curse', 'curses', 'cursed', 'cursing'],
    'repent': ['repent', 'repents', 'repented', 'repenting'],
    'save': ['save', 'saves', 'saved', 'saving'],
    'deliver': ['deliver', 'delivers', 'delivered', 'delivering'],
    'worship': ['worship', 'worships', 'worshiped', 'worshipping'],
    'praise': ['praise', 'praises', 'praised', 'praising'],
    'glorify': ['glorify', 'glorifies', 'glorified', 'glorifying'],
    'sanctify': ['sanctify', 'sanctifies', 'sanctified', 'sanctifying'],
    'justify': ['justify', 'justifies', 'justified', 'justifying'],
    'redeem': ['redeem', 'redeems', 'redeemed', 'redeeming'],
    'confess': ['confess', 'confesses', 'confessed', 'confessing'],
    'testify': ['testify', 'testifies', 'testified', 'testifying'],
    'witness': ['witness', 'witnesses', 'witnessed', 'witnessing'],
    'trust': ['trust', 'trusts', 'trusted', 'trusting'],
    'obey': ['obey', 'obeys', 'obeyed', 'obeying'],
    'love': ['love', 'loves', 'loved', 'loving'],
    'serve': ['serve', 'serves', 'served', 'serving'],
    'minister': ['minister', 'ministers', 'ministered', 'ministering'],
    'anoint': ['anoint', 'anoints', 'anointed', 'anointing'],
    'heal': ['heal', 'heals', 'healed', 'healing'],
    'prophesy': ['prophesy', 'prophesies', 'prophesied', 'prophesying'],
    'preach': ['preach', 'preaches', 'preached', 'preaching'],
    'baptize': ['baptize', 'baptizes', 'baptized', 'baptizing'],
    'fast': ['fast', 'fasts', 'fasted', 'fasting'],
    'meditate': ['meditate', 'meditates', 'meditated', 'meditating'],
  };

  constructor() {
    this.bibleData = bibleData;
  }

  // Helper method to detect if a query contains a verb
  private isVerbQuery(query: string): boolean {
    const words = query.toLowerCase().trim().split(/\s+/);
    
    for (const word of words) {
      // Check if it's a direct verb match
      if (this.verbForms[word]) {
        return true;
      }
      
      // Check if it's a verb variation
      for (const forms of Object.values(this.verbForms)) {
        if (forms.includes(word)) {
          return true;
        }
      }
      
      // Check for common verb endings
      const commonEndings = ['s', 'es', 'ing', 'ed', 'd'];
      for (const ending of commonEndings) {
        if (word.endsWith(ending)) {
          const stem = word.slice(0, -ending.length);
          if (this.verbForms[stem]) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  // Helper method to get word variations for verb forms
  private getWordVariations(word: string): string[] {
    const lowerWord = word.toLowerCase().trim();
    
    // If word is empty, return empty array
    if (!lowerWord) {
      return [];
    }
    
    // First, try direct lookup in verb forms dictionary
    if (this.verbForms[lowerWord]) {
      return this.verbForms[lowerWord];
    }
    
    // Second, check if the word is a variation of any verb
    for (const [baseVerb, forms] of Object.entries(this.verbForms)) {
      if (forms.includes(lowerWord)) {
        return forms;
      }
    }
    
    // Third, check for common verb endings
    const commonEndings = {
      's': (word: string) => word.slice(0, -1),
      'es': (word: string) => word.slice(0, -2),
      'ing': (word: string) => word.slice(0, -3),
      'ed': (word: string) => word.slice(0, -2),
      'd': (word: string) => word.slice(0, -1)
    };
    
    for (const [ending, stemmer] of Object.entries(commonEndings)) {
      if (lowerWord.endsWith(ending)) {
        const stem = stemmer(lowerWord);
        if (this.verbForms[stem]) {
          return this.verbForms[stem];
        }
      }
    }
    
    // If no verb forms found, return just the original word
    return [lowerWord];
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

  // Comprehensive search through verses and metadata with smart lemmatization
  search(query: string, filters?: SearchFilters): SearchResult[] {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Smart lemmatization: detect if query contains a verb and get variations
    const isVerbQuery = this.isVerbQuery(query);
    const searchTerms = isVerbQuery ? this.getWordVariations(query) : [lowerQuery];
    
    console.log(`Search: "${query}" - Verb detected: ${isVerbQuery}, Search terms: ${searchTerms.join(', ')}`);
    
    // Phase 1: Immediate exact match results (fast)
    const exactResults = this.performExactSearch(lowerQuery, filters);
    results.push(...exactResults);
    
    // Phase 2: If verb detected, add variation results (background enhancement)
    if (isVerbQuery && searchTerms.length > 1) {
      const variationResults = this.performVariationSearch(searchTerms, filters, exactResults);
      results.push(...variationResults);
    }
    
    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 100); // Limit to top 100 results
  }
  
  // Phase 1: Fast exact match search
  private performExactSearch(query: string, filters?: SearchFilters): SearchResult[] {
    const results: SearchResult[] = [];
    
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
      if (bookName.toLowerCase().includes(query)) {
        relevance += 10;
      }

      // Check author
      if (metadata.author.toLowerCase().includes(query)) {
        relevance += 8;
      }

      // Check genre
      if (metadata.genre.toLowerCase().includes(query)) {
        relevance += 6;
      }

      // Check testament
      if (metadata.testament.toLowerCase().includes(query)) {
        relevance += 5;
      }

      // Check category
      if (metadata.category.toLowerCase().includes(query)) {
        relevance += 5;
      }

      // Check key themes
      metadata.keyThemes.forEach((theme: string) => {
        if (theme.toLowerCase().includes(query)) {
          relevance += 7;
        }
      });

      // Check original language
      if (metadata.originalLanguage.toLowerCase().includes(query)) {
        relevance += 3;
      }

      // Check year written
      if (metadata.yearWritten.toLowerCase().includes(query)) {
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

    // Search through verse content (exact match only)
    Object.entries(this.bibleData.books || {}).forEach(([bookName, book]: [string, any]) => {
      // Apply book filter
      if (filters?.book && bookName.toLowerCase() !== filters.book.toLowerCase()) return;

      Object.entries(book).forEach(([chapter, chapterData]: [string, any]) => {
        // Apply chapter filter
        if (filters?.chapter && chapter !== filters.chapter) return;

        Object.entries(chapterData).forEach(([verse, text]: [string, any]) => {
          if (text.toLowerCase().includes(query)) {
            // Calculate relevance based on position and frequency
            let relevance = 1;
            const words = text.toLowerCase().split(' ');
            const queryWords = query.split(' ');
            
            queryWords.forEach(queryWord => {
              const matches = words.filter((word: string) => word.includes(queryWord)).length;
              relevance += matches * 2;
            });

            // Boost relevance if it's at the beginning of the verse
            if (text.toLowerCase().startsWith(query)) {
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

    return results;
  }
  
  // Phase 2: Background variation search (only for verb queries)
  private performVariationSearch(searchTerms: string[], filters?: SearchFilters, excludeResults?: SearchResult[]): SearchResult[] {
    const results: SearchResult[] = [];
    const excludeSet = new Set(excludeResults?.map(r => `${r.book}${r.chapter}:${r.verse}`) || []);
    
    // Search through verse content for variations
    Object.entries(this.bibleData.books || {}).forEach(([bookName, book]: [string, any]) => {
      // Apply book filter
      if (filters?.book && bookName.toLowerCase() !== filters.book.toLowerCase()) return;

      Object.entries(book).forEach(([chapter, chapterData]: [string, any]) => {
        // Apply chapter filter
        if (filters?.chapter && chapter !== filters.chapter) return;

        Object.entries(chapterData).forEach(([verse, text]: [string, any]) => {
          const verseKey = `${bookName}${chapter}:${verse}`;
          if (excludeSet.has(verseKey)) return; // Skip if already found in exact search
          
          // Check if any search term matches
          const textLower = text.toLowerCase();
          const hasMatch = searchTerms.some(term => textLower.includes(term));
          
          if (hasMatch) {
            // Calculate relevance (slightly lower than exact matches)
            let relevance = 0.5; // Lower base relevance for variations
            const words = textLower.split(' ');
            
            searchTerms.forEach(searchTerm => {
              const matches = words.filter((word: string) => word.includes(searchTerm)).length;
              relevance += matches * 1.5; // Lower multiplier for variations
            });

            // Boost relevance if it starts with any search term
            if (searchTerms.some(term => textLower.startsWith(term))) {
              relevance += 3; // Lower boost for variations
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

    return results;
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