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

async function importCoreData() {
  console.log('🚀 Starting core data import...');
  
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
    
    // Get final counts
    const asvCount = await client.query('SELECT COUNT(*) FROM biblical_verses');
    const jesusCount = await client.query('SELECT COUNT(*) FROM jesus_quotes');
    
    console.log('\n📊 Core Data Import Summary:');
    console.log(`   Biblical Verses: ${asvCount.rows[0].count}`);
    console.log(`   Jesus Quotes: ${jesusCount.rows[0].count}`);
    
    client.release();
    console.log('\n🎉 Core data import completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during core data import:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the import
importCoreData().catch(console.error); 