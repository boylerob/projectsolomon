const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  host: '34.45.138.156',
  port: 5432,
  database: 'solomon_db',
  user: 'solomon_user',
  password: 'solomon_secure_pass_2024',
  ssl: { rejectUnauthorized: false }
});

async function importData() {
  console.log('🚀 Starting data import...');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check if schema already exists
    console.log('📋 Checking existing schema...');
    const schemaExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'biblical_verses'
      );
    `);
    
    if (!schemaExists.rows[0].exists) {
      console.log('📋 Applying database schema...');
      const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      await client.query(schemaSQL);
      console.log('✅ Schema applied successfully');
    } else {
      console.log('✅ Schema already exists, skipping...');
    }
    
    // Import ASV Bible text
    console.log('📖 Importing ASV Bible text...');
    const asvPath = path.join(__dirname, '..', 'bible-companion', 'assets', 'bible_asv.json');
    if (fs.existsSync(asvPath)) {
      const asvData = JSON.parse(fs.readFileSync(asvPath, 'utf8'));
      let asvCount = 0;
      
      // Process the books structure
      for (const bookName of Object.keys(asvData.books)) {
        const book = asvData.books[bookName];
        for (const chapterNum of Object.keys(book)) {
          const chapter = book[chapterNum];
          for (const verseNum of Object.keys(chapter)) {
            const verseText = chapter[verseNum];
            try {
              await client.query(
                'INSERT INTO biblical_verses (book, chapter, verse, text, translation) VALUES ($1, $2, $3, $4, $5)',
                [bookName, parseInt(chapterNum), parseInt(verseNum), verseText, 'ASV']
              );
              asvCount++;
              if (asvCount % 1000 === 0) {
                console.log(`   Imported ${asvCount} ASV verses...`);
              }
            } catch (error) {
              if (error.code === '23505') { // Unique violation
                // Skip duplicate
              } else {
                throw error;
              }
            }
          }
        }
      }
      console.log(`✅ Imported ${asvCount} ASV verses`);
    } else {
      console.log('⚠️  ASV Bible file not found, skipping...');
    }
    
    // Import Jesus quotes
    console.log('✝️  Importing Jesus quotes...');
    const jesusQuotesPath = path.join(__dirname, '..', 'bible-companion', 'assets', 'jesus_quotes_agent_optimized.json');
    if (fs.existsSync(jesusQuotesPath)) {
      const jesusData = JSON.parse(fs.readFileSync(jesusQuotesPath, 'utf8'));
      let jesusCount = 0;
      
      // Process the quotes array
      for (const quote of jesusData.quotes) {
        try {
          await client.query(
            'INSERT INTO jesus_quotes (book, chapter, verse, text, context, topic) VALUES ($1, $2, $3, $4, $5, $6)',
            [quote.book, quote.chapter, quote.verse, quote.quote, quote.context || null, quote.topic || null]
          );
          jesusCount++;
        } catch (error) {
          if (error.code === '23505') { // Unique violation
            // Skip duplicate
          } else {
            throw error;
          }
        }
      }
      console.log(`✅ Imported ${jesusCount} Jesus quotes`);
    } else {
      console.log('⚠️  Jesus quotes file not found, skipping...');
    }
    
    // Import Solomon lexicon
    console.log('📚 Importing Solomon lexicon...');
    const lexiconPath = path.join(__dirname, '..', 'solomon_lexicon_250.json');
    if (fs.existsSync(lexiconPath)) {
      const lexiconData = JSON.parse(fs.readFileSync(lexiconPath, 'utf8'));
      
      // Create lexicon table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS solomon_lexicon (
          id SERIAL PRIMARY KEY,
          word VARCHAR(100) NOT NULL,
          definition TEXT NOT NULL,
          category VARCHAR(50),
          examples TEXT[],
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      let lexiconCount = 0;
      for (const entry of lexiconData) {
        try {
          await client.query(
            'INSERT INTO solomon_lexicon (word, definition, category, examples) VALUES ($1, $2, $3, $4)',
            [entry.word, entry.definition, entry.category || null, entry.examples || []]
          );
          lexiconCount++;
        } catch (error) {
          if (error.code === '23505') { // Unique violation
            // Skip duplicate
          } else {
            throw error;
          }
        }
      }
      console.log(`✅ Imported ${lexiconCount} lexicon entries`);
    } else {
      console.log('⚠️  Solomon lexicon file not found, skipping...');
    }
    
    // Import enhanced lexicon
    console.log('🔍 Importing enhanced lexicon...');
    const enhancedLexiconPath = path.join(__dirname, '..', 'bible-companion', 'assets', 'training_data', 'enhanced_lexicon.json');
    if (fs.existsSync(enhancedLexiconPath)) {
      const enhancedData = JSON.parse(fs.readFileSync(enhancedLexiconPath, 'utf8'));
      
      // Create enhanced lexicon table
      await client.query(`
        CREATE TABLE IF NOT EXISTS enhanced_lexicon (
          id SERIAL PRIMARY KEY,
          word VARCHAR(100) NOT NULL,
          definition TEXT NOT NULL,
          category VARCHAR(50),
          biblical_context TEXT,
          modern_application TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      let enhancedCount = 0;
      for (const entry of enhancedData) {
        try {
          await client.query(
            'INSERT INTO enhanced_lexicon (word, definition, category, biblical_context, modern_application) VALUES ($1, $2, $3, $4, $5)',
            [entry.word, entry.definition, entry.category || null, entry.biblical_context || null, entry.modern_application || null]
          );
          enhancedCount++;
        } catch (error) {
          if (error.code === '23505') { // Unique violation
            // Skip duplicate
          } else {
            throw error;
          }
        }
      }
      console.log(`✅ Imported ${enhancedCount} enhanced lexicon entries`);
    } else {
      console.log('⚠️  Enhanced lexicon file not found, skipping...');
    }
    
    // Import biblical people data
    console.log('👥 Importing biblical people data...');
    const peoplePath = path.join(__dirname, '..', 'bible-companion', 'assets', 'biblical_people.json');
    if (fs.existsSync(peoplePath)) {
      const peopleData = JSON.parse(fs.readFileSync(peoplePath, 'utf8'));
      
      // Create biblical people table
      await client.query(`
        CREATE TABLE IF NOT EXISTS biblical_people (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          role VARCHAR(100),
          book_references TEXT[],
          significance TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      let peopleCount = 0;
      for (const person of peopleData) {
        try {
          await client.query(
            'INSERT INTO biblical_people (name, description, role, book_references, significance) VALUES ($1, $2, $3, $4, $5)',
            [person.name, person.description || null, person.role || null, person.book_references || [], person.significance || null]
          );
          peopleCount++;
        } catch (error) {
          if (error.code === '23505') { // Unique violation
            // Skip duplicate
          } else {
            throw error;
          }
        }
      }
      console.log(`✅ Imported ${peopleCount} biblical people`);
    } else {
      console.log('⚠️  Biblical people file not found, skipping...');
    }
    
    // Import clarification lexicon
    console.log('💡 Importing clarification lexicon...');
    const clarificationPath = path.join(__dirname, '..', 'bible-companion', 'assets', 'clarification-lexicon.json');
    if (fs.existsSync(clarificationPath)) {
      const clarificationData = JSON.parse(fs.readFileSync(clarificationPath, 'utf8'));
      
      // Create clarification lexicon table
      await client.query(`
        CREATE TABLE IF NOT EXISTS clarification_lexicon (
          id SERIAL PRIMARY KEY,
          term VARCHAR(100) NOT NULL,
          clarification TEXT NOT NULL,
          context TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      let clarificationCount = 0;
      for (const entry of clarificationData) {
        try {
          await client.query(
            'INSERT INTO clarification_lexicon (term, clarification, context) VALUES ($1, $2, $3)',
            [entry.term, entry.clarification, entry.context || null]
          );
          clarificationCount++;
        } catch (error) {
          if (error.code === '23505') { // Unique violation
            // Skip duplicate
          } else {
            throw error;
          }
        }
      }
      console.log(`✅ Imported ${clarificationCount} clarification entries`);
    } else {
      console.log('⚠️  Clarification lexicon file not found, skipping...');
    }
    
    // Import response lexicon
    console.log('📝 Importing response lexicon...');
    const responsePath = path.join(__dirname, '..', 'bible-companion', 'assets', 'response-lexicon.json');
    if (fs.existsSync(responsePath)) {
      const responseData = JSON.parse(fs.readFileSync(responsePath, 'utf8'));
      
      // Create response lexicon table
      await client.query(`
        CREATE TABLE IF NOT EXISTS response_lexicon (
          id SERIAL PRIMARY KEY,
          category VARCHAR(100) NOT NULL,
          response_template TEXT NOT NULL,
          context TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      let responseCount = 0;
      for (const entry of responseData) {
        try {
          await client.query(
            'INSERT INTO response_lexicon (category, response_template, context) VALUES ($1, $2, $3)',
            [entry.category, entry.response_template, entry.context || null]
          );
          responseCount++;
        } catch (error) {
          if (error.code === '23505') { // Unique violation
            // Skip duplicate
          } else {
            throw error;
          }
        }
      }
      console.log(`✅ Imported ${responseCount} response entries`);
    } else {
      console.log('⚠️  Response lexicon file not found, skipping...');
    }
    
    // Create indexes for better performance (ignore if they already exist)
    console.log('🔍 Creating performance indexes...');
    try {
      await client.query('CREATE INDEX IF NOT EXISTS idx_solomon_lexicon_word ON solomon_lexicon(word)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_solomon_lexicon_category ON solomon_lexicon(category)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_enhanced_lexicon_word ON enhanced_lexicon(word)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_enhanced_lexicon_category ON enhanced_lexicon(category)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_biblical_people_name ON biblical_people(name)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_biblical_people_role ON biblical_people(role)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_clarification_lexicon_term ON clarification_lexicon(term)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_response_lexicon_category ON response_lexicon(category)');
      console.log('✅ Performance indexes created');
    } catch (error) {
      console.log('⚠️  Some indexes may already exist, continuing...');
    }
    
    // Get final counts
    const asvCount = await client.query('SELECT COUNT(*) FROM biblical_verses');
    const jesusCount = await client.query('SELECT COUNT(*) FROM jesus_quotes');
    const lexiconCount = await client.query('SELECT COUNT(*) FROM solomon_lexicon');
    const enhancedCount = await client.query('SELECT COUNT(*) FROM enhanced_lexicon');
    const peopleCount = await client.query('SELECT COUNT(*) FROM biblical_people');
    const clarificationCount = await client.query('SELECT COUNT(*) FROM clarification_lexicon');
    const responseCount = await client.query('SELECT COUNT(*) FROM response_lexicon');
    
    console.log('\n📊 Final Database Summary:');
    console.log(`   Biblical Verses: ${asvCount.rows[0].count}`);
    console.log(`   Jesus Quotes: ${jesusCount.rows[0].count}`);
    console.log(`   Solomon Lexicon: ${lexiconCount.rows[0].count}`);
    console.log(`   Enhanced Lexicon: ${enhancedCount.rows[0].count}`);
    console.log(`   Biblical People: ${peopleCount.rows[0].count}`);
    console.log(`   Clarification Lexicon: ${clarificationCount.rows[0].count}`);
    console.log(`   Response Lexicon: ${responseCount.rows[0].count}`);
    
    client.release();
    console.log('\n🎉 Data import completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during data import:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the import
importData().catch(console.error); 