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

async function importRemainingData() {
  console.log('🚀 Starting remaining data import...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
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
        if (!entry.term || entry.term.trim() === '') continue;
        
        try {
          await client.query(
            'INSERT INTO enhanced_lexicon (word, definition, category, biblical_context, modern_application) VALUES ($1, $2, $3, $4, $5)',
            [
              entry.term, 
              entry.definition || 'No definition provided', 
              entry.category || null, 
              entry.biblical_context || null, 
              entry.modern_application || null
            ]
          );
          enhancedCount++;
        } catch (error) {
          if (error.code === '23505') { // Unique violation
            // Skip duplicate
          } else {
            console.error(`Error importing enhanced entry "${entry.term}":`, error.message);
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
      // Access the people object from the data structure
      const people = peopleData.people || {};
      
      for (const [key, person] of Object.entries(people)) {
        if (!person.name || person.name.trim() === '') continue;
        
        try {
          // Combine immediate responses into a description
          const description = person.immediateResponses ? person.immediateResponses.join(' ') : null;
          
          await client.query(
            'INSERT INTO biblical_people (name, description, role, book_references, significance) VALUES ($1, $2, $3, $4, $5)',
            [
              person.name, 
              description, 
              person.role || null, 
              person.keyVerses || [], 
              person.themes ? person.themes.join(', ') : null
            ]
          );
          peopleCount++;
        } catch (error) {
          if (error.code === '23505') { // Unique violation
            // Skip duplicate
          } else {
            console.error(`Error importing person "${person.name}":`, error.message);
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
      
      // Process the categories structure
      const categories = clarificationData.categories || {};
      for (const [categoryName, category] of Object.entries(categories)) {
        if (category.phrases && Array.isArray(category.phrases)) {
          for (const phrase of category.phrases) {
            if (!phrase.text || phrase.text.trim() === '') continue;
            
            try {
              await client.query(
                'INSERT INTO clarification_lexicon (term, clarification, context) VALUES ($1, $2, $3)',
                [
                  categoryName, 
                  phrase.text, 
                  category.description || null
                ]
              );
              clarificationCount++;
            } catch (error) {
              if (error.code === '23505') { // Unique violation
                // Skip duplicate
              } else {
                console.error(`Error importing clarification entry "${categoryName}":`, error.message);
              }
            }
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
      
      // Process the categories structure
      const categories = responseData.categories || {};
      for (const [categoryName, category] of Object.entries(categories)) {
        if (category.phrases && Array.isArray(category.phrases)) {
          for (const phrase of category.phrases) {
            if (!phrase.text || phrase.text.trim() === '') continue;
            
            try {
              await client.query(
                'INSERT INTO response_lexicon (category, response_template, context) VALUES ($1, $2, $3)',
                [
                  categoryName, 
                  phrase.text, 
                  category.description || null
                ]
              );
              responseCount++;
            } catch (error) {
              if (error.code === '23505') { // Unique violation
                // Skip duplicate
              } else {
                console.error(`Error importing response entry "${categoryName}":`, error.message);
              }
            }
          }
        }
      }
      console.log(`✅ Imported ${responseCount} response entries`);
    } else {
      console.log('⚠️  Response lexicon file not found, skipping...');
    }
    
    // Create indexes for better performance
    console.log('🔍 Creating performance indexes...');
    try {
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
    const enhancedCount = await client.query('SELECT COUNT(*) FROM enhanced_lexicon');
    const peopleCount = await client.query('SELECT COUNT(*) FROM biblical_people');
    const clarificationCount = await client.query('SELECT COUNT(*) FROM clarification_lexicon');
    const responseCount = await client.query('SELECT COUNT(*) FROM response_lexicon');
    
    console.log('\n📊 Remaining Data Import Summary:');
    console.log(`   Enhanced Lexicon: ${enhancedCount.rows[0].count}`);
    console.log(`   Biblical People: ${peopleCount.rows[0].count}`);
    console.log(`   Clarification Lexicon: ${clarificationCount.rows[0].count}`);
    console.log(`   Response Lexicon: ${responseCount.rows[0].count}`);
    
    client.release();
    console.log('\n🎉 Remaining data import completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during remaining data import:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the import
importRemainingData().catch(console.error); 