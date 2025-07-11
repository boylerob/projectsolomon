const fs = require('fs');
const path = require('path');

const CSJ_PATH = '/Users/robertboyle/Documents/csj.txt';
const ASV_PATH = path.join(__dirname, '../assets/bible_asv.txt');
const OUTPUT_PATH = path.join(__dirname, '../assets/jesus_words_asv.json');

// Helper: Parse a reference string like "John 3, 1-21" or "Matthew 4, 1-11: Mark 1, 13: Luke 4, 1-13."
function parseReferences(refString) {
  // Remove trailing period and split by colon
  return refString.replace(/\.$/, '').split(':').map(ref => ref.trim()).filter(Boolean);
}

// Helper: Parse a single reference like "John 3, 1-21"
function parseSingleReference(ref) {
  // e.g. "John 3, 1-21" or "Matthew 4, 1-11"
  const match = ref.match(/^(Matthew|Mark|Luke|John)\s+(\d+),\s*([\d\-, ]+)/i);
  if (!match) return null;
  const book = match[1];
  const chapter = match[2];
  const verses = match[3].split(',').map(v => v.trim());
  // Expand ranges (e.g., 1-3)
  let verseList = [];
  for (const v of verses) {
    if (/\d+-\d+/.test(v)) {
      const [start, end] = v.split('-').map(Number);
      for (let i = start; i <= end; i++) verseList.push(i);
    } else if (/\d+/.test(v)) {
      verseList.push(Number(v));
    }
  }
  return { book, chapter, verses: verseList };
}

// Helper: Check if a verse contains Jesus's direct speech
function containsJesusSpeech(verseText) {
  const speechPatterns = [
    /Jesus (said|saith|answered|cried|spake|called|commanded|asked|told|replied)/i,
    /he (said|saith|answered|cried|spake|called|commanded|asked|told|replied)/i,
    /^["""]/, // Starts with quotation marks
    /Verily, verily/i,
    /Truly, truly/i,
    /I say unto you/i,
    /I am the/i,
    /Come unto me/i,
    /Follow me/i,
    /My Father/i,
    /the kingdom of/i,
    /blessed are/i
  ];
  return speechPatterns.some(pattern => pattern.test(verseText));
}

// Helper: Extract verses from ASV text, filtering for Jesus's speech
function extractVersesFromASV(asvLines, { book, chapter, verses }) {
  const results = [];
  for (const v of verses) {
    // e.g. "John 3:16"
    const pattern = new RegExp(`^${book} ${chapter}:${v} `);
    const line = asvLines.find(l => pattern.test(l));
    if (line) {
      const verseText = line.replace(/^.*?:\d+ /, '');
      // Only include verses that contain Jesus's direct speech
      if (containsJesusSpeech(verseText)) {
        results.push(verseText);
      }
    }
  }
  return results.join(' ');
}

function parseCSJFile(asvLines) {
  const lines = fs.readFileSync(CSJ_PATH, 'utf-8').split(/\r?\n/);
  const sayings = [];
  let section = null;
  let context = '';
  let reference = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Section header
    if (/^([IVXLCDM]+|\d+)\s*$/.test(line)) {
      section = line;
      context = '';
      reference = '';
      continue;
    }
    // Section title/context
    if (section && !context && line && !/^\[p\. \d+\]$/.test(line)) {
      context = line;
      continue;
    }
    // Gospel reference
    if (section && context && !reference && /^(Matthew|Mark|Luke|John)/.test(line)) {
      reference = line;
      // For each parsed reference, extract verses from ASV
      const refs = parseReferences(reference);
      let asvText = '';
      for (const ref of refs) {
        const parsed = parseSingleReference(ref);
        if (parsed) {
          asvText += extractVersesFromASV(asvLines, parsed) + ' ';
        }
      }
      if (asvText.trim()) {
        sayings.push({
          reference,
          text: asvText.trim(),
          context,
          section
        });
      }
      continue;
    }
  }
  return sayings.filter(s => s.text && s.reference);
}

function main() {
  const asvLines = fs.readFileSync(ASV_PATH, 'utf-8').split(/\r?\n/);
  const sayings = parseCSJFile(asvLines);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sayings, null, 2));
  console.log(`Extracted ${sayings.length} sayings to ${OUTPUT_PATH}`);
}

if (require.main === module) {
  main();
} 