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

async function importEnhancedLexicon() {
  console.log('🔍 Starting enhanced lexicon import...');
  
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
    
    // Get final count
    const enhancedCount = await client.query('SELECT COUNT(*) FROM enhanced_lexicon');
    
    console.log('\n📊 Enhanced Lexicon Import Summary:');
    console.log(`   Enhanced Lexicon: ${enhancedCount.rows[0].count}`);
    
    client.release();
    console.log('\n🎉 Enhanced lexicon import completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during enhanced lexicon import:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the import
importEnhancedLexicon().catch(console.error); 