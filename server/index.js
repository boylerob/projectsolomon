const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;

// Load author information
let authorInfo = null;

async function loadAuthorInfo() {
  try {
    const filePath = path.join(__dirname, '../assets/bible_authors.json');
    const data = await fs.readFile(filePath, 'utf8');
    authorInfo = JSON.parse(data);
    console.log('Successfully loaded author information');
  } catch (error) {
    console.error('Error loading author information:', error);
    authorInfo = null;
  }
}

// Common verb forms mapping
const verbForms = {
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
  'speak': ['speak', 'speaks', 'spoke', 'speaking', 'spoken'],
  'spend': ['spend', 'spends', 'spent', 'spending'],
  'stand': ['stand', 'stands', 'stood', 'standing'],
  'steal': ['steal', 'steals', 'stole', 'stealing', 'stolen'],
  'swim': ['swim', 'swims', 'swam', 'swimming', 'swum'],
  'take': ['take', 'takes', 'took', 'taking', 'taken'],
  'teach': ['teach', 'teaches', 'taught', 'teaching'],
  'tear': ['tear', 'tears', 'tore', 'tearing', 'torn'],
  'tell': ['tell', 'tells', 'told', 'telling'],
  'think': ['think', 'thinks', 'thought', 'thinking'],
  'throw': ['throw', 'throws', 'threw', 'throwing', 'thrown'],
  'understand': ['understand', 'understands', 'understood', 'understanding'],
  'wake': ['wake', 'wakes', 'woke', 'waking', 'woken'],
  'wear': ['wear', 'wears', 'wore', 'wearing', 'worn'],
  'win': ['win', 'wins', 'won', 'winning'],
  'write': ['write', 'writes', 'wrote', 'writing', 'written'],
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

// Configure CORS to allow all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

let bibleText = '';
let verses = [];

// Helper function to extract book and chapter from reference
function parseReference(reference) {
  const match = reference.match(/^([1-3]?\s*[A-Za-z]+)\s+(\d+):(\d+)/i);
  if (match) {
    return {
      book: match[1].trim(),
      chapter: parseInt(match[2]),
      verse: parseInt(match[3])
    };
  }
  return null;
}

// Helper function to generate word variations
function getWordVariations(word) {
    const lowerWord = word.toLowerCase().trim();
    console.log('\n=== Verb Forms Lookup ===');
    console.log(`Input word: "${word}" (lowercase: "${lowerWord}")`);
    console.log('Verb forms dictionary contains:', Object.keys(verbForms));
    
    // If word is empty, return empty array
    if (!lowerWord) {
        console.log('Empty word, returning empty array');
        return [];
    }
    
    // First, try direct lookup in verb forms dictionary
    if (verbForms[lowerWord]) {
        console.log(`Found direct match in verb forms dictionary:`, verbForms[lowerWord]);
        return verbForms[lowerWord];
    }
    
    // Second, check if the word is a variation of any verb
    for (const [baseVerb, forms] of Object.entries(verbForms)) {
        // Check if our word is a variation of this verb
        if (forms.includes(lowerWord)) {
            console.log(`Found word "${lowerWord}" as a variation of "${baseVerb}":`, forms);
            return forms;
        }
    }
    
    // Third, check for common verb endings
    const commonEndings = {
        's': (word) => word.slice(0, -1),
        'es': (word) => word.slice(0, -2),
        'ing': (word) => word.slice(0, -3),
        'ed': (word) => word.slice(0, -2),
        'd': (word) => word.slice(0, -1)
    };
    
    for (const [ending, stemmer] of Object.entries(commonEndings)) {
        if (lowerWord.endsWith(ending)) {
            const stem = stemmer(lowerWord);
            if (verbForms[stem]) {
                console.log(`Found word "${lowerWord}" with ending "${ending}", stem "${stem}":`, verbForms[stem]);
                return verbForms[stem];
            }
        }
    }
    
    // If no verb forms found, return just the original word
    console.log(`No verb forms found for "${lowerWord}", returning original word`);
    return [lowerWord];
}

// Load and parse the Bible text
async function loadBibleText() {
  try {
    console.log('Starting to load Bible text...');
    const filePath = path.join(__dirname, '../assets/bible_asv.txt');
    console.log('Reading file from:', filePath);
    
    bibleText = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read Bible text file');
    
    // Skip the header (first 4 lines)
    const lines = bibleText.split('\n').slice(4);
    console.log(`Processing ${lines.length} lines of text`);
    
    // Parse verses
    verses = [];
    let currentReference = null;
    let currentText = [];
    let verseCount = 0;

    for (const line of lines) {
      const referenceMatch = line.match(/^([1-3]?\s*[A-Za-z]+)\s+(\d+):(\d+)/i);
      if (referenceMatch) {
        if (currentReference && currentText.length > 0) {
          const parsedRef = parseReference(currentReference);
          verses.push({
            reference: currentReference,
            text: currentText.join(' ').trim(),
            translation: 'ASV',
            book: parsedRef?.book || '',
            chapter: parsedRef?.chapter || 0,
            verse: parsedRef?.verse || 0
          });
          verseCount++;
        }
        currentReference = referenceMatch[0];
        currentText = [line.replace(referenceMatch[0], '').trim()];
      } else if (currentReference) {
        currentText.push(line.trim());
      }
    }

    // Add the last verse
    if (currentReference && currentText.length > 0) {
      const parsedRef = parseReference(currentReference);
      verses.push({
        reference: currentReference,
        text: currentText.join(' ').trim(),
        translation: 'ASV',
        book: parsedRef?.book || '',
        chapter: parsedRef?.chapter || 0,
        verse: parsedRef?.verse || 0
      });
      verseCount++;
    }

    console.log(`Successfully loaded ${verseCount} verses`);
  } catch (error) {
    console.error('Error loading Bible text:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      path: error.path
    });
    process.exit(1);
  }
}

// Get unique books endpoint
app.get('/api/books', (req, res) => {
  try {
    const { books } = req.query;
    console.log('Books request:', { books });
    
    if (books) {
      // If books parameter is provided, parse it and return only those books
      const bookList = JSON.parse(books);
      console.log('Parsed book list:', bookList);
      
      // Sort books according to their order in the Bible
      const sortedBooks = bookList.sort((a, b) => {
        const bookOrder = {
          'Genesis': 1, 'Exodus': 2, 'Leviticus': 3, 'Numbers': 4, 'Deuteronomy': 5,
          'Joshua': 6, 'Judges': 7, 'Ruth': 8, '1 Samuel': 9, '2 Samuel': 10,
          '1 Kings': 11, '2 Kings': 12, '1 Chronicles': 13, '2 Chronicles': 14,
          'Ezra': 15, 'Nehemiah': 16, 'Esther': 17, 'Job': 18, 'Psalms': 19,
          'Proverbs': 20, 'Ecclesiastes': 21, 'Song of Solomon': 22, 'Isaiah': 23,
          'Jeremiah': 24, 'Lamentations': 25, 'Ezekiel': 26, 'Daniel': 27,
          'Hosea': 28, 'Joel': 29, 'Amos': 30, 'Obadiah': 31, 'Jonah': 32,
          'Micah': 33, 'Nahum': 34, 'Habakkuk': 35, 'Zephaniah': 36, 'Haggai': 37,
          'Zechariah': 38, 'Malachi': 39, 'Matthew': 40, 'Mark': 41, 'Luke': 42,
          'John': 43, 'Acts': 44, 'Romans': 45, '1 Corinthians': 46, '2 Corinthians': 47,
          'Galatians': 48, 'Ephesians': 49, 'Philippians': 50, 'Colossians': 51,
          '1 Thessalonians': 52, '2 Thessalonians': 53, '1 Timothy': 54, '2 Timothy': 55,
          'Titus': 56, 'Philemon': 57, 'Hebrews': 58, 'James': 59, '1 Peter': 60,
          '2 Peter': 61, '1 John': 62, '2 John': 63, '3 John': 64, 'Jude': 65,
          'Revelation': 66
        };
        return (bookOrder[a] || 999) - (bookOrder[b] || 999);
      });
      console.log('Returning sorted books:', sortedBooks);
      res.json(sortedBooks);
    } else {
      // If no books parameter, return all books in canonical order
      const allBooks = [...new Set(verses.map(v => v.book))].sort((a, b) => {
        const bookOrder = {
          'Genesis': 1, 'Exodus': 2, 'Leviticus': 3, 'Numbers': 4, 'Deuteronomy': 5,
          'Joshua': 6, 'Judges': 7, 'Ruth': 8, '1 Samuel': 9, '2 Samuel': 10,
          '1 Kings': 11, '2 Kings': 12, '1 Chronicles': 13, '2 Chronicles': 14,
          'Ezra': 15, 'Nehemiah': 16, 'Esther': 17, 'Job': 18, 'Psalms': 19,
          'Proverbs': 20, 'Ecclesiastes': 21, 'Song of Solomon': 22, 'Isaiah': 23,
          'Jeremiah': 24, 'Lamentations': 25, 'Ezekiel': 26, 'Daniel': 27,
          'Hosea': 28, 'Joel': 29, 'Amos': 30, 'Obadiah': 31, 'Jonah': 32,
          'Micah': 33, 'Nahum': 34, 'Habakkuk': 35, 'Zephaniah': 36, 'Haggai': 37,
          'Zechariah': 38, 'Malachi': 39, 'Matthew': 40, 'Mark': 41, 'Luke': 42,
          'John': 43, 'Acts': 44, 'Romans': 45, '1 Corinthians': 46, '2 Corinthians': 47,
          'Galatians': 48, 'Ephesians': 49, 'Philippians': 50, 'Colossians': 51,
          '1 Thessalonians': 52, '2 Thessalonians': 53, '1 Timothy': 54, '2 Timothy': 55,
          'Titus': 56, 'Philemon': 57, 'Hebrews': 58, 'James': 59, '1 Peter': 60,
          '2 Peter': 61, '1 John': 62, '2 John': 63, '3 John': 64, 'Jude': 65,
          'Revelation': 66
        };
        return (bookOrder[a] || 999) - (bookOrder[b] || 999);
      });
      console.log('Returning all books:', allBooks);
      res.json(allBooks);
    }
  } catch (error) {
    console.error('Error getting books:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get chapters for a book endpoint
app.get('/api/chapters/:book', (req, res) => {
  try {
    const book = req.params.book;
    const chapters = [...new Set(
      verses
        .filter(v => v.book === book)
        .map(v => v.chapter)
    )].sort((a, b) => a - b);
    res.json(chapters);
  } catch (error) {
    console.error('Error getting chapters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search endpoint
app.get('/api/search', (req, res) => {
    const { q: query, book, chapter, lemma, useVerbForms } = req.query;
    console.log('\n=== Search Request ===');
    console.log('Search parameters:', { query, book, chapter, lemma, useVerbForms });
    
    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        // Enable verb forms by default
        const shouldUseVerbForms = useVerbForms !== 'false';
        console.log('Using verb forms:', shouldUseVerbForms);
        
        // Get word variations for the search query
        const wordVariations = shouldUseVerbForms ? getWordVariations(query) : [query.toLowerCase()];
        console.log('Using word variations:', wordVariations);
        
        // Search for each variation
        const results = [];
        const seenVerses = new Set();
        
        wordVariations.forEach(variation => {
            console.log(`Searching for variation: "${variation}"`);
            const variationResults = verses.filter(verse => {
                // Apply book filter if specified
                if (book && verse.book !== book) {
                    return false;
                }
                
                // Apply chapter filter if specified
                if (chapter && verse.chapter !== parseInt(chapter)) {
                    return false;
                }
                
                // Search in the verse text using case-insensitive word boundary matching
                const verseText = verse.text.toLowerCase();
                // Escape special characters in the variation for regex
                const escapedVariation = variation.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escapedVariation}\\b`, 'i');
                return regex.test(verseText);
            });
            
            console.log(`Found ${variationResults.length} results for variation "${variation}"`);
            
            // Add unique results with author information
            variationResults.forEach(verse => {
                const key = `${verse.book}${verse.chapter}:${verse.verse}`;
                if (!seenVerses.has(key)) {
                    seenVerses.add(key);
                    const bookInfo = authorInfo?.books[verse.book];
                    
                    // Special handling for Psalms
                    let author = 'Unknown';
                    if (verse.book === 'Psalms') {
                        // Check for specific chapter author
                        if (bookInfo?.chapterAuthors?.[verse.chapter]) {
                            author = bookInfo.chapterAuthors[verse.chapter];
                        } else {
                            // Find the section that contains this chapter
                            const section = bookInfo?.sections?.find(section => {
                                const [start, end] = section.chapters.split('-').map(Number);
                                return verse.chapter >= start && verse.chapter <= (end || start);
                            });
                            author = section?.author || 'Unconfirmed';
                        }
                    } else {
                        author = bookInfo?.author || bookInfo?.authors || 'Unknown';
                    }

                    // Find all matches in the verse text using word boundary matching
                    const matches = [];
                    const verseText = verse.text.toLowerCase();
                    // Escape special characters in the variation for regex
                    const escapedVariation = variation.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(`\\b${escapedVariation}\\b`, 'gi');
                    let match;
                    
                    while ((match = regex.exec(verseText)) !== null) {
                        matches.push({
                            start: match.index,
                            end: match.index + match[0].length,
                            text: verse.text.substring(match.index, match.index + match[0].length)
                        });
                    }

                    results.push({
                        ...verse,
                        author: author,
                        yearWritten: bookInfo?.yearWritten || 'Unknown',
                        genre: bookInfo?.genre || 'Unknown',
                        matches: matches
                    });
                }
            });
        });
        
        console.log(`Found ${results.length} total unique results`);
        console.log('=== End Search ===\n');
        res.json(results);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Error performing search' });
    }
});

// Get specific verse endpoint
app.get('/api/verse/:reference', (req, res) => {
  try {
    const reference = req.params.reference;
    console.log(`Looking up verse: ${reference}`);
    
    const verse = verses.find(v => v.reference === reference);
    
    if (!verse) {
      console.log(`Verse not found: ${reference}`);
      return res.status(404).json({ error: 'Verse not found' });
    }
    
    console.log(`Found verse: ${reference}`);
    res.json(verse);
  } catch (error) {
    console.error('Error in verse endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all verses
app.get('/api/verses', (req, res) => {
  try {
    // Return all verses in canonical order
    const allVerses = verses.map(verse => ({
      ...verse,
      matches: [] // No matches for full text view
    }));
    console.log(`Returning ${allVerses.length} verses`);
    res.json(allVerses);
  } catch (error) {
    console.error('Error getting all verses:', error);
    res.status(500).json({ error: 'Failed to get verses' });
  }
});

// Get verses for a specific book and chapter
app.get('/api/verses/:book/:chapter', (req, res) => {
  try {
    const { book, chapter } = req.params;
    const chapterNum = parseInt(chapter);
    
    console.log(`Getting verses for ${book} chapter ${chapterNum}`);
    
    const bookVerses = verses.filter(verse => 
      verse.book === book && verse.chapter === chapterNum
    ).map(verse => ({
      ...verse,
      matches: [] // No matches for regular verse view
    }));
    
    console.log(`Found ${bookVerses.length} verses`);
    res.json(bookVerses);
  } catch (error) {
    console.error('Error getting verses:', error);
    res.status(500).json({ error: 'Failed to get verses' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    versesLoaded: verses.length,
    timestamp: new Date().toISOString()
  });
});

// Start server
console.log('Initializing Bible search server...');
let server;

Promise.all([loadBibleText(), loadAuthorInfo()]).then(() => {
  server = app.listen(port, '0.0.0.0', () => {
    console.log(`Bible search server running at http://0.0.0.0:${port}`);
    console.log('Available endpoints:');
    console.log('- GET /api/search?q=<query>&book=<book>&chapter=<chapter>&lemma=<lemma>&useVerbForms=<useVerbForms>');
    console.log('- GET /api/verse/:reference');
    console.log('- GET /api/books');
    console.log('- GET /api/chapters/:book');
    console.log('- GET /api/verses');
    console.log('- GET /api/verses/:book/:chapter');
    console.log('- GET /api/health');
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server?.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
}); 