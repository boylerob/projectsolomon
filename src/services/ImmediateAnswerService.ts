import bibleData from '../../assets/bible_asv.json';

export interface ImmediateAnswer {
  text: string;
  type: 'verse' | 'metadata' | 'wordCount' | 'author' | 'notFound';
  confidence: 'high' | 'medium' | 'low';
  source?: string;
}

export class ImmediateAnswerService {
  private bibleData: any;
  private wordIndex: Map<string, number> = new Map();

  constructor() {
    this.bibleData = bibleData;
    this.buildWordIndex();
  }

  /**
   * Main method to get immediate answers for factual questions
   */
  public getImmediateAnswer(question: string): ImmediateAnswer | null {
    const lowerQuestion = question.toLowerCase().trim();
    
    // Check if this is a question we can answer immediately
    if (!this.canAnswerImmediately(lowerQuestion)) {
      return null;
    }

    // Try different answer types in order of specificity
    const verseAnswer = this.getVerseAnswer(lowerQuestion);
    if (verseAnswer) return verseAnswer;

    const wordCountAnswer = this.getWordCountAnswer(lowerQuestion);
    if (wordCountAnswer) return wordCountAnswer;

    const authorAnswer = this.getAuthorAnswer(lowerQuestion);
    if (authorAnswer) return authorAnswer;

    const metadataAnswer = this.getMetadataAnswer(lowerQuestion);
    if (metadataAnswer) return metadataAnswer;

    return null;
  }

  /**
   * Determines if a question can be answered immediately from local data
   */
  private canAnswerImmediately(question: string): boolean {
    const immediatePatterns = [
      /what does .* say/i,
      /what does .* mean/i,
      /how many times is .* mentioned/i,
      /how many times does .* appear/i,
      /who wrote .*/i,
      /when was .* written/i,
      /what is the context of .*/i,
      /what book is .* in/i,
      /how many chapters in .*/i,
      /what genre is .*/i,
      /what testament is .*/i,
      /what are the key themes of .*/i,
      /what language was .* written in/i,
      /what time period is .*/i
    ];

    return immediatePatterns.some(pattern => pattern.test(question));
  }

  /**
   * Gets verse content for questions like "What does John 3:16 say?"
   */
  private getVerseAnswer(question: string): ImmediateAnswer | null {
    const versePatterns = [
      /what does (.+) say/i,
      /what does (.+) mean/i,
      /what is (.+)/i,
      /show me (.+)/i,
      /read (.+)/i
    ];

    for (const pattern of versePatterns) {
      const match = question.match(pattern);
      if (match) {
        const verseReference = match[1].trim();
        const verse = this.findVerse(verseReference);
        if (verse) {
          return {
            text: `"${verse.text}" — ${verse.reference}`,
            type: 'verse',
            confidence: 'high',
            source: verse.reference
          };
        }
      }
    }

    return null;
  }

  /**
   * Gets word count for questions like "How many times is 'love' mentioned?"
   */
  private getWordCountAnswer(question: string): ImmediateAnswer | null {
    const wordPatterns = [
      /how many times is ['"]?([^'"]+)['"]? mentioned/i,
      /how many times does ['"]?([^'"]+)['"]? appear/i,
      /how many times is ['"]?([^'"]+)['"]? in the bible/i
    ];

    for (const pattern of wordPatterns) {
      const match = question.match(pattern);
      if (match) {
        const word = match[1].toLowerCase().trim();
        const count = this.getWordCount(word);
        if (count > 0) {
          return {
            text: `The word "${word}" appears ${count} times in the Bible.`,
            type: 'wordCount',
            confidence: 'high',
            source: 'Bible text analysis'
          };
        }
      }
    }

    return null;
  }

  /**
   * Gets author information for questions like "Who wrote Romans?"
   */
  private getAuthorAnswer(question: string): ImmediateAnswer | null {
    const authorPatterns = [
      /who wrote (.+)/i,
      /who is the author of (.+)/i,
      /who authored (.+)/i
    ];

    for (const pattern of authorPatterns) {
      const match = question.match(pattern);
      if (match) {
        const bookName = match[1].trim();
        const bookInfo = this.findBook(bookName);
        if (bookInfo && bookInfo.author) {
          return {
            text: `${bookInfo.name} was written by ${bookInfo.author} around ${bookInfo.yearWritten}.`,
            type: 'author',
            confidence: 'high',
            source: bookInfo.name
          };
        }
      }
    }

    return null;
  }

  /**
   * Gets metadata for questions about books, themes, etc.
   */
  private getMetadataAnswer(question: string): ImmediateAnswer | null {
    // Chapters
    const chapterMatch = question.match(/how many chapters in (.+)/i);
    if (chapterMatch) {
      const bookName = chapterMatch[1].trim();
      const bookInfo = this.findBook(bookName);
      if (bookInfo && bookInfo.chapters) {
        return {
          text: `${bookInfo.name} has ${bookInfo.chapters} chapters.`,
          type: 'metadata',
          confidence: 'high',
          source: bookInfo.name
        };
      }
    }

    // Genre
    const genreMatch = question.match(/what genre is (.+)/i);
    if (genreMatch) {
      const bookName = genreMatch[1].trim();
      const bookInfo = this.findBook(bookName);
      if (bookInfo && bookInfo.genre) {
        return {
          text: `${bookInfo.name} is a ${bookInfo.genre} book.`,
          type: 'metadata',
          confidence: 'high',
          source: bookInfo.name
        };
      }
    }

    // Testament
    const testamentMatch = question.match(/what testament is (.+)/i);
    if (testamentMatch) {
      const bookName = testamentMatch[1].trim();
      const bookInfo = this.findBook(bookName);
      if (bookInfo && bookInfo.testament) {
        return {
          text: `${bookInfo.name} is in the ${bookInfo.testament}.`,
          type: 'metadata',
          confidence: 'high',
          source: bookInfo.name
        };
      }
    }

    // Key themes
    const themesMatch = question.match(/what are the key themes of (.+)/i);
    if (themesMatch) {
      const bookName = themesMatch[1].trim();
      const bookInfo = this.findBook(bookName);
      if (bookInfo && bookInfo.keyThemes) {
        const themes = bookInfo.keyThemes.join(', ');
        return {
          text: `The key themes of ${bookInfo.name} include: ${themes}.`,
          type: 'metadata',
          confidence: 'high',
          source: bookInfo.name
        };
      }
    }

    // Language
    const languageMatch = question.match(/what language was (.+) written in/i);
    if (languageMatch) {
      const bookName = languageMatch[1].trim();
      const bookInfo = this.findBook(bookName);
      if (bookInfo && bookInfo.originalLanguage) {
        return {
          text: `${bookInfo.name} was originally written in ${bookInfo.originalLanguage}.`,
          type: 'metadata',
          confidence: 'high',
          source: bookInfo.name
        };
      }
    }

    // Time period
    const timeMatch = question.match(/what time period is (.+)/i);
    if (timeMatch) {
      const bookName = timeMatch[1].trim();
      const bookInfo = this.findBook(bookName);
      if (bookInfo && bookInfo.timeSpan) {
        return {
          text: `${bookInfo.name} covers the time period of ${bookInfo.timeSpan}.`,
          type: 'metadata',
          confidence: 'high',
          source: bookInfo.name
        };
      }
    }

    return null;
  }

  /**
   * Finds a specific verse in the Bible
   */
  private findVerse(reference: string): { text: string; reference: string } | null {
    // Parse reference like "John 3:16" or "Genesis 1:1"
    const verseMatch = reference.match(/(\w+)\s+(\d+):(\d+)/i);
    if (!verseMatch) return null;

    const bookName = this.normalizeBookName(verseMatch[1]);
    const chapter = verseMatch[2];
    const verse = verseMatch[3];

    const books = this.bibleData.books;
    if (books[bookName] && books[bookName][chapter] && books[bookName][chapter][verse]) {
      return {
        text: books[bookName][chapter][verse],
        reference: `${bookName} ${chapter}:${verse}`
      };
    }

    return null;
  }

  /**
   * Finds book information
   */
  private findBook(bookName: string): any {
    const normalizedName = this.normalizeBookName(bookName);
    const metadata = this.bibleData.metadata;
    
    if (metadata[normalizedName]) {
      return {
        name: normalizedName,
        ...metadata[normalizedName]
      };
    }

    // Try partial matches
    for (const [name, info] of Object.entries(metadata)) {
      if (name.toLowerCase().includes(bookName.toLowerCase()) || 
          bookName.toLowerCase().includes(name.toLowerCase())) {
        return {
          name,
          ...info
        };
      }
    }

    return null;
  }

  /**
   * Normalizes book names for consistent matching
   */
  private normalizeBookName(bookName: string): string {
    const bookMap: { [key: string]: string } = {
      'gen': 'Genesis',
      'exo': 'Exodus',
      'lev': 'Leviticus',
      'num': 'Numbers',
      'deu': 'Deuteronomy',
      'jos': 'Joshua',
      'jud': 'Judges',
      'rut': 'Ruth',
      '1sa': '1 Samuel',
      '2sa': '2 Samuel',
      '1ki': '1 Kings',
      '2ki': '2 Kings',
      '1ch': '1 Chronicles',
      '2ch': '2 Chronicles',
      'ezr': 'Ezra',
      'neh': 'Nehemiah',
      'est': 'Esther',
      'job': 'Job',
      'psa': 'Psalms',
      'pro': 'Proverbs',
      'ecc': 'Ecclesiastes',
      'son': 'Song of Solomon',
      'isa': 'Isaiah',
      'jer': 'Jeremiah',
      'lam': 'Lamentations',
      'eze': 'Ezekiel',
      'dan': 'Daniel',
      'hos': 'Hosea',
      'joe': 'Joel',
      'amo': 'Amos',
      'oba': 'Obadiah',
      'jon': 'Jonah',
      'mic': 'Micah',
      'nah': 'Nahum',
      'hab': 'Habakkuk',
      'zep': 'Zephaniah',
      'hag': 'Haggai',
      'zec': 'Zechariah',
      'mal': 'Malachi',
      'mat': 'Matthew',
      'mar': 'Mark',
      'luk': 'Luke',
      'joh': 'John',
      'act': 'Acts',
      'rom': 'Romans',
      '1co': '1 Corinthians',
      '2co': '2 Corinthians',
      'gal': 'Galatians',
      'eph': 'Ephesians',
      'phi': 'Philippians',
      'col': 'Colossians',
      '1th': '1 Thessalonians',
      '2th': '2 Thessalonians',
      '1ti': '1 Timothy',
      '2ti': '2 Timothy',
      'tit': 'Titus',
      'phm': 'Philemon',
      'heb': 'Hebrews',
      'jam': 'James',
      '1pe': '1 Peter',
      '2pe': '2 Peter',
      '1jo': '1 John',
      '2jo': '2 John',
      '3jo': '3 John',
      'jud': 'Jude',
      'rev': 'Revelation'
    };

    const lowerBookName = bookName.toLowerCase();
    
    // Check exact matches first
    if (bookMap[lowerBookName]) {
      return bookMap[lowerBookName];
    }

    // Check if it's already a full name
    const metadata = this.bibleData.metadata;
    for (const name of Object.keys(metadata)) {
      if (name.toLowerCase() === lowerBookName) {
        return name;
      }
    }

    // Try partial matches
    for (const [abbrev, fullName] of Object.entries(bookMap)) {
      if (lowerBookName.includes(abbrev) || abbrev.includes(lowerBookName)) {
        return fullName;
      }
    }

    return bookName;
  }

  /**
   * Builds a word index for fast word counting
   */
  private buildWordIndex(): void {
    const books = this.bibleData.books;
    const wordCount = new Map<string, number>();

    for (const [bookName, book] of Object.entries(books)) {
      for (const [chapterNum, chapter] of Object.entries(book as any)) {
        for (const [verseNum, verseText] of Object.entries(chapter as any)) {
          const words = (verseText as string).toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 0);

          for (const word of words) {
            wordCount.set(word, (wordCount.get(word) || 0) + 1);
          }
        }
      }
    }

    this.wordIndex = wordCount;
  }

  /**
   * Gets the count of a specific word in the Bible
   */
  private getWordCount(word: string): number {
    return this.wordIndex.get(word.toLowerCase()) || 0;
  }

  /**
   * Gets a friendly response for immediate answers
   */
  public getImmediateResponseText(answer: ImmediateAnswer): string {
    switch (answer.type) {
      case 'verse':
        return `Here's what ${answer.source} says:\n\n${answer.text}`;
      
      case 'wordCount':
        return answer.text;
      
      case 'author':
        return answer.text;
      
      case 'metadata':
        return answer.text;
      
      default:
        return answer.text;
    }
  }
}

export default ImmediateAnswerService; 