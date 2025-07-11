const fs = require('fs');
const path = require('path');

// Read the unstructured Jesus verses file
const inputFile = '/Users/robertboyle/Downloads/jesus_verses_unstructured.txt';
const outputFile = path.join(__dirname, '../assets/jesus_quotes_agent_optimized.json');

function parseVerseReference(ref) {
    // Handle various reference formats
    const patterns = [
        /^([1-3]?\s*[A-Za-z]+)\s+(\d+):(\d+)$/, // Matthew 5:3
        /^([1-3]?\s*[A-Za-z]+)\s+(\d+):(\d+)-(\d+):(\d+)$/, // Matthew 5:3-5:48
        /^([1-3]?\s*[A-Za-z]+)\s+(\d+):(\d+)-(\d+)$/, // Matthew 5:3-48
    ];
    
    for (const pattern of patterns) {
        const match = ref.match(pattern);
        if (match) {
            const book = match[1].trim();
            const chapter = parseInt(match[2]);
            const verse = parseInt(match[3]);
            
            return {
                book: book,
                chapter: chapter,
                verse: verse,
                fullReference: ref.trim()
            };
        }
    }
    
    return null;
}

function extractKeywords(quote) {
    // Extract key theological concepts and topics
    const keywords = new Set();
    const lowerQuote = quote.toLowerCase();
    
    // Theological concepts
    const theologicalTerms = [
        'kingdom', 'heaven', 'god', 'father', 'son', 'holy spirit', 'salvation', 'faith', 'repentance',
        'forgiveness', 'sin', 'righteousness', 'mercy', 'grace', 'love', 'peace', 'joy', 'hope',
        'eternal life', 'resurrection', 'judgment', 'hell', 'heaven', 'paradise', 'cross', 'sacrifice',
        'discipleship', 'follow', 'serve', 'pray', 'worship', 'temple', 'law', 'prophets', 'scripture',
        'truth', 'light', 'darkness', 'good', 'evil', 'blessed', 'woe', 'parable', 'miracle', 'healing'
    ];
    
    theologicalTerms.forEach(term => {
        if (lowerQuote.includes(term)) {
            keywords.add(term);
        }
    });
    
    // Action words
    const actionWords = [
        'come', 'go', 'follow', 'believe', 'trust', 'pray', 'give', 'serve', 'love', 'forgive',
        'repent', 'turn', 'seek', 'find', 'ask', 'knock', 'enter', 'leave', 'take', 'give',
        'do', 'keep', 'obey', 'teach', 'preach', 'heal', 'cast out', 'raise', 'bless', 'curse'
    ];
    
    actionWords.forEach(word => {
        if (lowerQuote.includes(word)) {
            keywords.add(word);
        }
    });
    
    // People and groups
    const peopleGroups = [
        'pharisees', 'sadducees', 'scribes', 'tax collectors', 'sinners', 'disciples', 'apostles',
        'prophets', 'priests', 'leaders', 'crowd', 'people', 'children', 'women', 'men', 'gentiles',
        'samaritans', 'jews', 'nations', 'multitude', 'followers', 'believers', 'unbelievers'
    ];
    
    peopleGroups.forEach(group => {
        if (lowerQuote.includes(group)) {
            keywords.add(group);
        }
    });
    
    return Array.from(keywords);
}

function extractQuoteFromLine(line) {
    // The file uses Unicode smart quotes: charCode 8220 (left) and 8221 (right)
    const leftQuote = String.fromCharCode(8220);  // Unicode left double quotation mark
    const rightQuote = String.fromCharCode(8221); // Unicode right double quotation mark
    
    // Find the first left quote
    const firstQuoteIndex = line.indexOf(leftQuote);
    if (firstQuoteIndex === -1) return null;
    
    // Extract the reference (everything before the first quote)
    const reference = line.substring(0, firstQuoteIndex).trim();
    
    // Find the last right quote
    const lastQuoteIndex = line.lastIndexOf(rightQuote);
    if (lastQuoteIndex <= firstQuoteIndex) return null;
    
    // Extract the quote text (between first and last quote marks)
    const quote = line.substring(firstQuoteIndex + leftQuote.length, lastQuoteIndex).trim();
    
    // Extract any additional text after the last quote
    const additionalText = line.substring(lastQuoteIndex + rightQuote.length).trim();
    
    return {
        reference: reference,
        quote: quote,
        additionalText: additionalText
    };
}

function processFile() {
    const content = fs.readFileSync(inputFile, 'utf8');
    const lines = content.split('\n');
    
    const quotes = [];
    const verseIndex = {}; // For direct verse lookups
    const topicIndex = {}; // For topic-based searches
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (!trimmedLine) continue;
        
        // Extract quote from this line
        const extracted = extractQuoteFromLine(trimmedLine);
        
        if (extracted) {
            // Parse the reference
            const parsedRef = parseVerseReference(extracted.reference);
            
            if (parsedRef) {
                const fullQuote = extracted.additionalText ? 
                    `${extracted.quote} ${extracted.additionalText}` : 
                    extracted.quote;
                
                const quoteObj = {
                    id: quotes.length + 1,
                    reference: parsedRef.fullReference,
                    book: parsedRef.book,
                    chapter: parsedRef.chapter,
                    verse: parsedRef.verse,
                    quote: fullQuote,
                    keywords: extractKeywords(fullQuote),
                    length: fullQuote.length,
                    isDirectSpeech: true
                };
                
                quotes.push(quoteObj);
                
                // Add to verse index
                const verseKey = `${parsedRef.book.toLowerCase()}_${parsedRef.chapter}_${parsedRef.verse}`;
                verseIndex[verseKey] = quoteObj.id;
                
                // Add to topic index
                quoteObj.keywords.forEach(keyword => {
                    if (!topicIndex[keyword]) {
                        topicIndex[keyword] = [];
                    }
                    topicIndex[keyword].push(quoteObj.id);
                });
            }
        }
    }
    
    // Create the optimized output structure
    const output = {
        metadata: {
            source: "jesus_verses_unstructured.txt",
            totalQuotes: quotes.length,
            description: "Agent-optimized collection of Jesus's direct words for efficient querying",
            processedAt: new Date().toISOString(),
            queryCapabilities: [
                "Direct verse lookup by reference",
                "Topic-based search by keywords",
                "Book/chapter filtering",
                "Length-based filtering"
            ]
        },
        indexes: {
            verseIndex: verseIndex,
            topicIndex: topicIndex
        },
        quotes: quotes,
        searchHelpers: {
            // Common search patterns
            commonTopics: Object.keys(topicIndex).filter(topic => topicIndex[topic].length > 5),
            books: [...new Set(quotes.map(q => q.book))],
            shortQuotes: quotes.filter(q => q.length < 100).map(q => q.id),
            longQuotes: quotes.filter(q => q.length > 500).map(q => q.id)
        }
    };
    
    // Write to file
    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
    
    console.log(`✅ Processed ${quotes.length} Jesus quotes for agent optimization`);
    console.log(`📁 Output saved to: ${outputFile}`);
    
    // Show breakdown by book
    const bookCounts = {};
    quotes.forEach(quote => {
        bookCounts[quote.book] = (bookCounts[quote.book] || 0) + 1;
    });
    
    console.log('\n📊 Breakdown by book:');
    Object.entries(bookCounts).forEach(([book, count]) => {
        console.log(`  ${book}: ${count} quotes`);
    });
    
    console.log(`\n🔍 Search capabilities:`);
    console.log(`  - Direct verse lookups: ${Object.keys(verseIndex).length} indexed`);
    console.log(`  - Topic searches: ${Object.keys(topicIndex).length} keywords`);
    console.log(`  - Common topics: ${output.searchHelpers.commonTopics.length}`);
    
    // Show some example quotes
    console.log('\n📝 Example quotes:');
    quotes.slice(0, 3).forEach(quote => {
        console.log(`  ${quote.reference}: "${quote.quote.substring(0, 100)}..."`);
    });
}

processFile(); 