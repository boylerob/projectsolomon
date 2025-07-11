const fs = require('fs');
const path = require('path');

const JESUS_QUOTES_PATH = path.join(__dirname, '../assets/jesus_words_asv.json');
const ASV_PATH = path.join(__dirname, '../assets/bible_asv.txt');

// Well-known Jesus quotes to test against
const TEST_QUOTES = [
  {
    reference: 'John 3:16',
    expected: 'For God so loved the world',
    description: 'Most famous Bible verse'
  },
  {
    reference: 'Matthew 5:3',
    expected: 'Blessed are the poor in spirit',
    description: 'First Beatitude'
  },
  {
    reference: 'John 14:6',
    expected: 'I am the way, and the truth, and the life',
    description: 'Jesus as the way'
  },
  {
    reference: 'Matthew 6:9',
    expected: 'Our Father who art in heaven',
    description: 'Lord\'s Prayer'
  },
  {
    reference: 'Luke 2:49',
    expected: 'How is it that ye sought me',
    description: 'Jesus at age 12'
  }
];

function findVerseInASV(reference) {
  const asvLines = fs.readFileSync(ASV_PATH, 'utf-8').split(/\r?\n/);
  const [book, chapterVerse] = reference.split(' ');
  const [chapter, verse] = chapterVerse.split(':');
  
  const pattern = new RegExp(`^${book} ${chapter}:${verse} `);
  const line = asvLines.find(l => pattern.test(l));
  
  if (line) {
    return line.replace(/^.*?:\d+ /, '');
  }
  return null;
}

function findQuoteInDatabase(quote, jesusQuotes) {
  return jesusQuotes.find(entry => {
    return entry.text.includes(quote.expected) || 
           entry.reference.includes(quote.reference.replace(':', ','));
  });
}

function main() {
  console.log('🧪 Validating Jesus Quotes Database\n');
  
  const jesusQuotes = JSON.parse(fs.readFileSync(JESUS_QUOTES_PATH, 'utf-8'));
  console.log(`📊 Total quotes in database: ${jesusQuotes.length}\n`);
  
  let foundCount = 0;
  let missingCount = 0;
  
  for (const testQuote of TEST_QUOTES) {
    console.log(`🔍 Testing: ${testQuote.description}`);
    console.log(`   Reference: ${testQuote.reference}`);
    console.log(`   Expected: "${testQuote.expected}"`);
    
    // Check if it's in our database
    const found = findQuoteInDatabase(testQuote, jesusQuotes);
    
    if (found) {
      console.log(`   ✅ FOUND in database`);
      console.log(`   📝 Database text: "${found.text.substring(0, 100)}..."`);
      foundCount++;
    } else {
      console.log(`   ❌ NOT FOUND in database`);
      
      // Check if it exists in ASV
      const asvText = findVerseInASV(testQuote.reference);
      if (asvText) {
        console.log(`   📖 ASV text: "${asvText}"`);
      } else {
        console.log(`   ⚠️  Not found in ASV either`);
      }
      missingCount++;
    }
    console.log('');
  }
  
  console.log('📈 Summary:');
  console.log(`   ✅ Found: ${foundCount}/${TEST_QUOTES.length}`);
  console.log(`   ❌ Missing: ${missingCount}/${TEST_QUOTES.length}`);
  console.log(`   📊 Success rate: ${((foundCount / TEST_QUOTES.length) * 100).toFixed(1)}%`);
  
  if (missingCount > 0) {
    console.log('\n🔧 Recommendations:');
    console.log('   - Review pattern matching for missing quotes');
    console.log('   - Check if reference parsing needs improvement');
    console.log('   - Verify ASV text format matches expectations');
  }
}

if (require.main === module) {
  main();
} 