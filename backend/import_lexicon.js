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

async function importLexicon() {
  console.log('📚 Starting Solomon lexicon import...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
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
      let skippedCount = 0;
      
      for (const entry of lexiconData) {
        // Skip entries with null or empty term
        if (!entry.term || entry.term.trim() === '') {
          skippedCount++;
          continue;
        }
        
        try {
          await client.query(
            'INSERT INTO solomon_lexicon (word, definition, category, examples) VALUES ($1, $2, $3, $4)',
            [
              entry.term, 
              entry.definition || 'No definition provided', 
              entry.category || null, 
              entry.examples || []
            ]
          );
          lexiconCount++;
          
          if (lexiconCount % 50 === 0) {
            console.log(`   Imported ${lexiconCount} lexicon entries...`);
          }
        } catch (error) {
          if (error.code === '23505') { // Unique violation
            // Skip duplicate
            skippedCount++;
          } else {
            console.error(`Error importing entry "${entry.term}":`, error.message);
            skippedCount++;
          }
        }
      }
      console.log(`✅ Imported ${lexiconCount} lexicon entries`);
      console.log(`⚠️  Skipped ${skippedCount} entries (duplicates or invalid data)`);
    } else {
      console.log('⚠️  Solomon lexicon file not found, skipping...');
    }
    
    // Get final count
    const lexiconCount = await client.query('SELECT COUNT(*) FROM solomon_lexicon');
    
    console.log('\n📊 Lexicon Import Summary:');
    console.log(`   Solomon Lexicon: ${lexiconCount.rows[0].count}`);
    
    client.release();
    console.log('\n🎉 Lexicon import completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during lexicon import:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the import
importLexicon().catch(console.error); 