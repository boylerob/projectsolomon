-- Lemmatization Database Schema
-- Comprehensive English word forms and their lemmas

-- Main lemmatization table
CREATE TABLE IF NOT EXISTS english_lemmatization (
  id SERIAL PRIMARY KEY,
  word_form VARCHAR(100) NOT NULL,
  lemma VARCHAR(100) NOT NULL,
  part_of_speech VARCHAR(20),
  frequency INTEGER DEFAULT 0,
  is_common BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Biblical terms with Greek/Hebrew lemmas
CREATE TABLE IF NOT EXISTS biblical_lemmatization (
  id SERIAL PRIMARY KEY,
  english_term VARCHAR(100) NOT NULL,
  greek_lemma VARCHAR(100),
  greek_strongs VARCHAR(20),
  hebrew_lemma VARCHAR(100),
  hebrew_strongs VARCHAR(20),
  definition TEXT,
  usage_context TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verb forms mapping (expanded from current hardcoded version)
CREATE TABLE IF NOT EXISTS verb_forms (
  id SERIAL PRIMARY KEY,
  base_verb VARCHAR(100) NOT NULL,
  present_singular VARCHAR(100),
  present_plural VARCHAR(100),
  past_simple VARCHAR(100),
  past_participle VARCHAR(100),
  present_participle VARCHAR(100),
  is_biblical BOOLEAN DEFAULT false,
  frequency INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_english_lemmatization_word_form ON english_lemmatization(word_form);
CREATE INDEX IF NOT EXISTS idx_english_lemmatization_lemma ON english_lemmatization(lemma);
CREATE INDEX IF NOT EXISTS idx_english_lemmatization_pos ON english_lemmatization(part_of_speech);
CREATE INDEX IF NOT EXISTS idx_biblical_lemmatization_english ON biblical_lemmatization(english_term);
CREATE INDEX IF NOT EXISTS idx_biblical_lemmatization_greek ON biblical_lemmatization(greek_strongs);
CREATE INDEX IF NOT EXISTS idx_biblical_lemmatization_hebrew ON biblical_lemmatization(hebrew_strongs);
CREATE INDEX IF NOT EXISTS idx_verb_forms_base ON verb_forms(base_verb);
CREATE INDEX IF NOT EXISTS idx_verb_forms_biblical ON verb_forms(is_biblical); 