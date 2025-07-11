// Biblical Authority Ranking System - Standalone Test
// This demonstrates the authority hierarchy for biblical sources

class BiblicalAuthorityService {
  constructor() {
    this.authorityRankings = new Map();
    this.initializeAuthorityRankings();
  }

  initializeAuthorityRankings() {
    // Messiah - Highest Authority (10)
    this.authorityRankings.set('Jesus', {
      source: 'Jesus',
      authorityLevel: 10,
      category: 'messiah',
      description: 'Direct words of Jesus Christ, the Son of God'
    });

    // Apostles - Very High Authority (9)
    const apostles = ['Paul', 'Peter', 'John', 'James', 'Matthew', 'Mark', 'Luke', 'Andrew', 'Philip', 'Bartholomew', 'Thomas', 'James Son of Alphaeus', 'Simon', 'Judas', 'Matthias'];
    apostles.forEach(apostle => {
      this.authorityRankings.set(apostle, {
        source: apostle,
        authorityLevel: 9,
        category: 'apostles',
        description: 'Apostolic authority - direct witnesses and commissioned by Christ'
      });
    });

    // Major Prophets - High Authority (8)
    const majorProphets = ['Moses', 'Isaiah', 'Jeremiah', 'Ezekiel', 'Daniel'];
    majorProphets.forEach(prophet => {
      this.authorityRankings.set(prophet, {
        source: prophet,
        authorityLevel: 8,
        category: 'prophets',
        description: 'Major prophets - direct revelation from God'
      });
    });

    // Minor Prophets - High Authority (7)
    const minorProphets = ['Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'];
    minorProphets.forEach(prophet => {
      this.authorityRankings.set(prophet, {
        source: prophet,
        authorityLevel: 7,
        category: 'prophets',
        description: 'Minor prophets - inspired revelation from God'
      });
    });

    // Kings and Patriarchs - Medium-High Authority (6)
    const kingsAndPatriarchs = ['David', 'Solomon', 'Abraham', 'Isaac', 'Jacob', 'Joseph', 'Joshua', 'Samuel'];
    kingsAndPatriarchs.forEach(person => {
      this.authorityRankings.set(person, {
        source: person,
        authorityLevel: 6,
        category: person.includes('David') || person.includes('Solomon') ? 'kings' : 'patriarchs',
        description: 'Kings and patriarchs - leaders with divine calling'
      });
    });

    // Disciples and Followers - Medium Authority (5)
    const disciples = ['Mary Magdalene', 'Timothy', 'Titus', 'Silas', 'Barnabas'];
    disciples.forEach(disciple => {
      this.authorityRankings.set(disciple, {
        source: disciple,
        authorityLevel: 5,
        category: 'disciples',
        description: 'Disciples and close followers - eyewitness accounts'
      });
    });

    // Other Biblical Figures - Medium Authority (4)
    const others = ['Adam', 'Noah', 'Job', 'Esther', 'Ruth', 'Nehemiah', 'Ezra'];
    others.forEach(person => {
      this.authorityRankings.set(person, {
        source: person,
        authorityLevel: 4,
        category: 'other',
        description: 'Other biblical figures - historical and narrative accounts'
      });
    });
  }

  getAuthorityRanking(source) {
    return this.authorityRankings.get(source) || null;
  }

  calculateAuthorityWeight(sources) {
    if (!sources || sources.length === 0) {
      return 0.5; // Default weight for non-biblical sources
    }

    let totalWeight = 0;
    let validSources = 0;

    for (const source of sources) {
      const ranking = this.getAuthorityRanking(source);
      if (ranking) {
        totalWeight += ranking.authorityLevel;
        validSources++;
      }
    }

    if (validSources === 0) {
      return 0.5; // Default weight
    }

    // Normalize to 0-1 scale (divide by 10)
    return (totalWeight / validSources) / 10;
  }

  getHighestAuthoritySource(sources) {
    if (!sources || sources.length === 0) {
      return null;
    }

    let highestSource = null;
    let highestLevel = 0;

    for (const source of sources) {
      const ranking = this.getAuthorityRanking(source);
      if (ranking && ranking.authorityLevel > highestLevel) {
        highestLevel = ranking.authorityLevel;
        highestSource = source;
      }
    }

    return highestSource;
  }

  isHighAuthority(source) {
    const ranking = this.getAuthorityRanking(source);
    return ranking ? ranking.authorityLevel >= 8 : false;
  }

  getSourcesByAuthorityLevel(level) {
    const sources = [];
    for (const [source, ranking] of this.authorityRankings) {
      if (ranking.authorityLevel === level) {
        sources.push(source);
      }
    }
    return sources;
  }
}

// Test the biblical authority ranking system
function testBiblicalAuthority() {
  console.log('🧠 Testing Biblical Authority Ranking System\n');
  
  const authorityService = new BiblicalAuthorityService();
  
  // Test 1: Check authority levels for different sources
  console.log('📊 Authority Levels by Category:');
  console.log('================================');
  
  const testSources = [
    'Jesus',
    'Paul', 
    'Peter',
    'Moses',
    'Isaiah',
    'Hosea',
    'David',
    'Solomon',
    'Abraham',
    'Mary Magdalene',
    'Adam',
    'Unknown Source'
  ];
  
  testSources.forEach(source => {
    const ranking = authorityService.getAuthorityRanking(source);
    if (ranking) {
      console.log(`${source.padEnd(15)} | Level ${ranking.authorityLevel} | ${ranking.category.padEnd(10)} | ${ranking.description}`);
    } else {
      console.log(`${source.padEnd(15)} | Level N/A | ${'unknown'.padEnd(10)} | Not in biblical authority system`);
    }
  });
  
  console.log('\n🎯 Authority Weight Calculations:');
  console.log('=================================');
  
  // Test 2: Calculate authority weights for different combinations
  const testCombinations = [
    ['Jesus'],
    ['Paul', 'Peter'],
    ['Moses', 'Isaiah'],
    ['David', 'Solomon'],
    ['Adam', 'Noah'],
    ['Jesus', 'Paul', 'Moses'],
    ['Unknown', 'Random'],
    []
  ];
  
  testCombinations.forEach((sources, index) => {
    const weight = authorityService.calculateAuthorityWeight(sources);
    const highestSource = authorityService.getHighestAuthoritySource(sources);
    const isHighAuth = highestSource ? authorityService.isHighAuthority(highestSource) : false;
    
    console.log(`\nCombination ${index + 1}: [${sources.join(', ') || 'None'}]`);
    console.log(`  Authority Weight: ${weight.toFixed(3)}`);
    console.log(`  Highest Source: ${highestSource || 'None'}`);
    console.log(`  High Authority: ${isHighAuth ? '✅ Yes' : '❌ No'}`);
  });
  
  console.log('\n🏆 Sources by Authority Level:');
  console.log('==============================');
  
  // Test 3: Show all sources by authority level
  for (let level = 10; level >= 4; level--) {
    const sources = authorityService.getSourcesByAuthorityLevel(level);
    if (sources.length > 0) {
      console.log(`\nLevel ${level} (${sources.length} sources):`);
      console.log(`  ${sources.join(', ')}`);
    }
  }
  
  console.log('\n💡 Practical Examples:');
  console.log('======================');
  
  // Test 4: Practical examples of how authority affects responses
  const examples = [
    {
      question: "What did Jesus say about love?",
      sources: ['Jesus'],
      expected: "Highest priority - direct words of Christ"
    },
    {
      question: "How does Paul explain salvation?",
      sources: ['Paul'],
      expected: "Very high priority - apostolic authority"
    },
    {
      question: "What did Moses teach about the law?",
      sources: ['Moses'],
      expected: "High priority - major prophet and lawgiver"
    },
    {
      question: "What wisdom did Solomon share?",
      sources: ['Solomon'],
      expected: "Medium-high priority - inspired king"
    },
    {
      question: "What does the Bible say about creation?",
      sources: ['Adam', 'Moses'],
      expected: "Mixed priority - patriarch and prophet"
    }
  ];
  
  examples.forEach((example, index) => {
    const weight = authorityService.calculateAuthorityWeight(example.sources);
    const highestSource = authorityService.getHighestAuthoritySource(example.sources);
    
    console.log(`\nExample ${index + 1}: "${example.question}"`);
    console.log(`  Sources: [${example.sources.join(', ')}]`);
    console.log(`  Authority Weight: ${weight.toFixed(3)}`);
    console.log(`  Highest Authority: ${highestSource}`);
    console.log(`  Expected Priority: ${example.expected}`);
  });
  
  console.log('\n✅ Biblical Authority Ranking System Test Complete!');
  console.log('\nKey Insights:');
  console.log('- Jesus has the highest authority (Level 10)');
  console.log('- Apostles have very high authority (Level 9)');
  console.log('- Major prophets have high authority (Level 8)');
  console.log('- Minor prophets have high authority (Level 7)');
  console.log('- Kings and patriarchs have medium-high authority (Level 6)');
  console.log('- This system can be integrated into response scoring to prioritize authoritative sources');
}

// Run the test
testBiblicalAuthority(); 