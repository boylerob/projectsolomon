-- Enable full-text search extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Biblical verses table
CREATE TABLE IF NOT EXISTS biblical_verses (
    id SERIAL PRIMARY KEY,
    book VARCHAR(50) NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text TEXT NOT NULL,
    translation VARCHAR(10) DEFAULT 'ASV',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jesus quotes table
CREATE TABLE IF NOT EXISTS jesus_quotes (
    id SERIAL PRIMARY KEY,
    book VARCHAR(50) NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text TEXT NOT NULL,
    context TEXT,
    topic VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_biblical_verses_book_chapter_verse ON biblical_verses(book, chapter, verse);
CREATE INDEX IF NOT EXISTS idx_biblical_verses_text_gin ON biblical_verses USING gin(to_tsvector('english', text));
CREATE INDEX IF NOT EXISTS idx_jesus_quotes_book_chapter_verse ON jesus_quotes(book, chapter, verse);
CREATE INDEX IF NOT EXISTS idx_jesus_quotes_text_gin ON jesus_quotes USING gin(to_tsvector('english', text));
CREATE INDEX IF NOT EXISTS idx_jesus_quotes_topic ON jesus_quotes(topic);

-- Create full-text search function
CREATE OR REPLACE FUNCTION search_biblical_verses(search_query TEXT)
RETURNS TABLE(
    book VARCHAR(50),
    chapter INTEGER,
    verse INTEGER,
    text TEXT,
    relevance REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bv.book,
        bv.chapter,
        bv.verse,
        bv.text,
        ts_rank(to_tsvector('english', bv.text), plainto_tsquery('english', search_query)) as relevance
    FROM biblical_verses bv
    WHERE to_tsvector('english', bv.text) @@ plainto_tsquery('english', search_query)
    ORDER BY relevance DESC, bv.book, bv.chapter, bv.verse;
END;
$$ LANGUAGE plpgsql;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_biblical_verses_updated_at 
    BEFORE UPDATE ON biblical_verses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (you can replace this with your actual biblical data)
INSERT INTO biblical_verses (book, chapter, verse, text) VALUES
('John', 3, 16, 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth on him should not perish, but have eternal life.'),
('Psalm', 23, 1, 'The LORD is my shepherd; I shall not want.'),
('Matthew', 28, 19, 'Go ye therefore, and make disciples of all the nations, baptizing them into the name of the Father and of the Son and of the Holy Spirit:'),
('Romans', 8, 28, 'And we know that to them that love God all things work together for good, even to them that are called according to his purpose.')
ON CONFLICT DO NOTHING;

-- Insert sample Jesus quotes
INSERT INTO jesus_quotes (book, chapter, verse, text, context, topic) VALUES
('John', 3, 16, 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth on him should not perish, but have eternal life.', 'Jesus speaking to Nicodemus about salvation', 'Salvation'),
('Matthew', 28, 19, 'Go ye therefore, and make disciples of all the nations, baptizing them into the name of the Father and of the Son and of the Holy Spirit:', 'The Great Commission', 'Discipleship'),
('John', 14, 6, 'I am the way, and the truth, and the life: no one cometh unto the Father, but by me.', 'Jesus speaking to Thomas about the way to the Father', 'Truth'),
('Matthew', 5, 3, 'Blessed are the poor in spirit: for theirs is the kingdom of heaven.', 'The Beatitudes', 'Blessedness')
ON CONFLICT DO NOTHING; 