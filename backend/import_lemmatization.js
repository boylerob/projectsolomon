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

async function importLemmatization() {
  console.log('🔤 Starting lemmatization import...');
  try {
    const client = await pool.connect();
    // Apply schema
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema_lemmatization.sql'), 'utf8');
    await client.query(schemaSQL);
    console.log('✅ Lemmatization schema applied');

    // --- Import English lemmatization (sample set, can be replaced with full dict) ---
    const englishLemmas = [
      { word_form: 'running', lemma: 'run', pos: 'verb' },
      { word_form: 'ran', lemma: 'run', pos: 'verb' },
      { word_form: 'runs', lemma: 'run', pos: 'verb' },
      { word_form: 'better', lemma: 'good', pos: 'adj' },
      { word_form: 'best', lemma: 'good', pos: 'adj' },
      { word_form: 'children', lemma: 'child', pos: 'noun' },
      { word_form: 'mice', lemma: 'mouse', pos: 'noun' },
      { word_form: 'praying', lemma: 'pray', pos: 'verb' },
      { word_form: 'prayed', lemma: 'pray', pos: 'verb' },
      { word_form: 'prays', lemma: 'pray', pos: 'verb' },
      { word_form: 'loved', lemma: 'love', pos: 'verb' },
      { word_form: 'loves', lemma: 'love', pos: 'verb' },
      { word_form: 'loving', lemma: 'love', pos: 'verb' },
    ];
    let engCount = 0;
    for (const entry of englishLemmas) {
      await client.query(
        'INSERT INTO english_lemmatization (word_form, lemma, part_of_speech, is_common) VALUES ($1, $2, $3, $4)',
        [entry.word_form, entry.lemma, entry.pos, true]
      );
      engCount++;
    }
    console.log(`✅ Imported ${engCount} English lemmatization entries (sample)`);

    // --- Import biblical lemmas from solomon_lexicon_250.json ---
    const solomonLexPath = path.join(__dirname, '..', 'solomon_lexicon_250.json');
    if (fs.existsSync(solomonLexPath)) {
      const solomonLex = JSON.parse(fs.readFileSync(solomonLexPath, 'utf8'));
      let bibCount = 0;
      for (const entry of solomonLex) {
        if (!entry.term || !entry.lemmas) continue;
        // Parse lemmas: "pistis (G4102), ʾemunah (H530)"
        let greek_lemma = null, greek_strongs = null, hebrew_lemma = null, hebrew_strongs = null;
        const lemmaParts = entry.lemmas.split(',').map(s => s.trim());
        for (const part of lemmaParts) {
          const match = part.match(/([\w\u0590-\u05FF\u0370-\u03FF]+) \((G|H)(\d+)\)/);
          if (match) {
            if (match[2] === 'G') {
              greek_lemma = match[1];
              greek_strongs = 'G' + match[3];
            } else if (match[2] === 'H') {
              hebrew_lemma = match[1];
              hebrew_strongs = 'H' + match[3];
            }
          }
        }
        await client.query(
          'INSERT INTO biblical_lemmatization (english_term, greek_lemma, greek_strongs, hebrew_lemma, hebrew_strongs, definition) VALUES ($1, $2, $3, $4, $5, $6)',
          [entry.term, greek_lemma, greek_strongs, hebrew_lemma, hebrew_strongs, entry.definition || null]
        );
        bibCount++;
      }
      console.log(`✅ Imported ${bibCount} biblical lemmatization entries from Solomon lexicon`);
    }

    // --- Import biblical lemmas from enhanced_lexicon.json ---
    const enhancedLexPath = path.join(__dirname, '..', 'bible-companion', 'assets', 'training_data', 'enhanced_lexicon.json');
    if (fs.existsSync(enhancedLexPath)) {
      const enhancedLex = JSON.parse(fs.readFileSync(enhancedLexPath, 'utf8'));
      let bibCount = 0;
      for (const entry of enhancedLex) {
        if (!entry.term || !entry.lemmas) continue;
        let greek_lemma = null, greek_strongs = null, hebrew_lemma = null, hebrew_strongs = null;
        const lemmaParts = entry.lemmas.split(',').map(s => s.trim());
        for (const part of lemmaParts) {
          const match = part.match(/([\w\u0590-\u05FF\u0370-\u03FF]+) \((G|H)(\d+)\)/);
          if (match) {
            if (match[2] === 'G') {
              greek_lemma = match[1];
              greek_strongs = 'G' + match[3];
            } else if (match[2] === 'H') {
              hebrew_lemma = match[1];
              hebrew_strongs = 'H' + match[3];
            }
          }
        }
        await client.query(
          'INSERT INTO biblical_lemmatization (english_term, greek_lemma, greek_strongs, hebrew_lemma, hebrew_strongs, definition) VALUES ($1, $2, $3, $4, $5, $6)',
          [entry.term, greek_lemma, greek_strongs, hebrew_lemma, hebrew_strongs, entry.definition || null]
        );
        bibCount++;
      }
      console.log(`✅ Imported ${bibCount} biblical lemmatization entries from enhanced lexicon`);
    }

    client.release();
    console.log('\n🎉 Lemmatization import completed successfully!');
  } catch (error) {
    console.error('❌ Error during lemmatization import:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the import
importLemmatization().catch(console.error); 