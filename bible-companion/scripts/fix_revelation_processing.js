const fs = require('fs');
const path = require('path');

// Read the original unstructured file
const inputFile = '/Users/robertboyle/Downloads/jesus_verses_unstructured.txt';
const outputFile = path.join(__dirname, '../assets/jesus_quotes_comprehensive_fixed.json');

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
            const startVerse = parseInt(match[3]);
            
            if (match[4] && match[5]) {
                // Range format
                const endChapter = parseInt(match[4]);
                const endVerse = parseInt(match[5]);
                return {
                    book,
                    chapter,
                    startVerse,
                    endChapter,
                    endVerse,
                    isRange: true
                };
            } else if (match[4]) {
                // Chapter:verse-verse format
                const endVerse = parseInt(match[4]);
                return {
                    book,
                    chapter,
                    startVerse,
                    endVerse,
                    isRange: true
                };
            } else {
                // Single verse
                return {
                    book,
                    chapter,
                    startVerse,
                    isRange: false
                };
            }
        }
    }
    
    return null;
}

function extractQuotes(text) {
    const quotes = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
        // Skip empty lines
        if (!line.trim()) continue;
        
        // Look for verse reference pattern - improved to handle all Revelation formats
        // This pattern will match: Revelation 1:8, Revelation 1:17-20, Revelation 2:1-29, etc.
        const refMatch = line.match(/^([1-3]?\s*[A-Za-z]+\s+\d+:\d+(?:-\d+(?::\d+)?)?)\s+(.+)$/);
        
        if (refMatch) {
            const reference = refMatch[1].trim();
            const content = refMatch[2].trim();
            
            const parsedRef = parseVerseReference(reference);
            if (parsedRef) {
                // For Revelation content, we want to capture the full text as Jesus's words
                // since these are direct quotes from Jesus to John
                if (parsedRef.book.toLowerCase() === 'revelation') {
                    quotes.push({
                        reference: reference,
                        parsedReference: parsedRef,
                        quote: content,
                        fullText: content,
                        source: 'unstructured_file',
                        isDirectQuote: true
                    });
                } else {
                    // For other books, extract quoted text
                    const quoteMatch = content.match(/"([^"]+)"/);
                    if (quoteMatch) {
                        quotes.push({
                            reference: reference,
                            parsedReference: parsedRef,
                            quote: quoteMatch[1],
                            fullText: content,
                            source: 'unstructured_file'
                        });
                    } else {
                        // If no quotes found, treat the whole content as Jesus's words
                        // but filter out obvious narrative text
                        const narrativeIndicators = [
                            'Then Jesus', 'Jesus said', 'He said', 'And he', 'But he',
                            'When Jesus', 'After Jesus', 'Before Jesus', 'As Jesus',
                            'Jesus answered', 'Jesus replied', 'Jesus asked',
                            'Then he', 'And Jesus', 'But Jesus'
                        ];
                        
                        const isNarrative = narrativeIndicators.some(indicator => 
                            content.toLowerCase().includes(indicator.toLowerCase())
                        );
                        
                        if (!isNarrative && content.length > 10) {
                            quotes.push({
                                reference: reference,
                                parsedReference: parsedRef,
                                quote: content,
                                fullText: content,
                                source: 'unstructured_file'
                            });
                        }
                    }
                }
            }
        }
    }
    
    return quotes;
}

function main() {
    try {
        console.log('Reading unstructured Jesus verses file...');
        const content = fs.readFileSync(inputFile, 'utf8');
        
        console.log('Extracting quotes with improved Revelation handling...');
        const quotes = extractQuotes(content);
        
        // Count Revelation quotes
        const revelationQuotes = quotes.filter(q => q.parsedReference.book.toLowerCase() === 'revelation');
        
        console.log(`Found ${quotes.length} total quotes`);
        console.log(`Found ${revelationQuotes.length} Revelation quotes`);
        
        // Show Revelation quotes
        console.log('\nRevelation quotes found:');
        revelationQuotes.forEach((quote, index) => {
            console.log(`${index + 1}. ${quote.reference}: "${quote.quote.substring(0, 100)}..."`);
        });
        
        // Create structured output
        const output = {
            metadata: {
                source: 'jesus_verses_unstructured.txt',
                totalQuotes: quotes.length,
                revelationQuotes: revelationQuotes.length,
                generatedAt: new Date().toISOString(),
                description: 'Comprehensive collection of Jesus quotes from the Gospels and New Testament (fixed Revelation processing)'
            },
            quotes: quotes
        };
        
        // Write to JSON file
        fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
        console.log(`\nOutput written to: ${outputFile}`);
        
    } catch (error) {
        console.error('Error processing file:', error);
    }
}

main(); 