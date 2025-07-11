const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: '34.45.138.156',
  port: 5432,
  database: 'solomon_db',
  user: 'solomon_user',
  password: 'solomon_secure_pass_2024',
  ssl: { rejectUnauthorized: false }
});

async function getDatabaseSummary() {
  console.log('📊 Project Solomon Database Summary');
  console.log('=====================================\n');
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful\n');
    
    // Get counts from all tables
    const tables = [
      'biblical_verses',
      'jesus_quotes', 
      'solomon_lexicon',
      'enhanced_lexicon',
      'biblical_people',
      'clarification_lexicon',
      'response_lexicon'
    ];
    
    const results = {};
    
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        results[table] = parseInt(result.rows[0].count);
      } catch (error) {
        results[table] = 0; // Table doesn't exist
      }
    }
    
    // Display results
    console.log('📖 Biblical Data:');
    console.log(`   Biblical Verses (ASV): ${results.biblical_verses.toLocaleString()}`);
    console.log(`   Jesus Quotes: ${results.jesus_quotes.toLocaleString()}`);
    console.log(`   Biblical People: ${results.biblical_people.toLocaleString()}`);
    
    console.log('\n📚 Lexicons & Knowledge:');
    console.log(`   Solomon Lexicon: ${results.solomon_lexicon.toLocaleString()}`);
    console.log(`   Enhanced Lexicon: ${results.enhanced_lexicon.toLocaleString()}`);
    console.log(`   Clarification Lexicon: ${results.clarification_lexicon.toLocaleString()}`);
    console.log(`   Response Lexicon: ${results.response_lexicon.toLocaleString()}`);
    
    const totalRecords = Object.values(results).reduce((sum, count) => sum + count, 0);
    console.log(`\n📈 Total Records: ${totalRecords.toLocaleString()}`);
    
    // Check database health
    console.log('\n🔍 Database Health Check:');
    try {
      const healthCheck = await client.query('SELECT version()');
      console.log('✅ Database is responsive');
      console.log(`   PostgreSQL Version: ${healthCheck.rows[0].version.split(' ')[0]}`);
    } catch (error) {
      console.log('❌ Database health check failed');
    }
    
    client.release();
    console.log('\n🎉 Database summary completed successfully!');
    
  } catch (error) {
    console.error('❌ Error getting database summary:', error);
  } finally {
    await pool.end();
  }
}

// Run the summary
getDatabaseSummary().catch(console.error); 