// Simulate pending clarification context
let pendingClarification = false;

function isClarificationQuestion(question) {
  // Only treat as clarification if there is a pending clarification context
  if (!pendingClarification) return false;

  const trimmed = question.trim();
  const lower = trimmed.toLowerCase();

  // Direct, short answers (yes/no/etc.)
  if (/^(yes|no|that's right|exactly|not really|kind of|sort of|absolutely|definitely)[.!]?$/i.test(trimmed)) {
    return true;
  }

  // Very short, fragmentary responses (not a full question)
  if (trimmed.length < 40 && !trimmed.includes('?')) {
    return true;
  }

  // Starts with a clarification phrase and is not a full question
  if (/^(focus on|specifically|personally|regarding|about|in terms of|my|i want|i need|i'm asking|i am asking|i'm looking|i am looking)/i.test(trimmed) && !trimmed.includes('?') && trimmed.length < 80) {
    return true;
  }

  // Otherwise, not a clarification
  return false;
}

// Test cases
const testCases = [
  { text: "What does the Bible say about love?", expect: false },
  { text: "Focus on romantic love in marriage", expect: true },
  { text: "Yes, that's what I meant", expect: true },
  { text: "I'm asking about my marriage specifically", expect: true },
  { text: "What does John 3:16 mean?", expect: false },
  { text: "No, I meant something else", expect: true },
  { text: "My family situation", expect: true },
  { text: "Practical advice for daily life", expect: true },
  { text: "That's exactly what I was looking for", expect: true },
  { text: "I want to understand forgiveness better", expect: true },
  { text: "How can I apply this to my life?", expect: false },
  { text: "My relationship with my spouse", expect: true },
  { text: "Specifically about prayer", expect: true },
  { text: "What is the meaning of salvation?", expect: false },
  { text: "Personal application", expect: true }
];

console.log('Testing Clarification Detection Logic (with pending context):\n');
pendingClarification = true;
testCases.forEach((testCase, index) => {
  const isClarification = isClarificationQuestion(testCase.text);
  console.log(`${index + 1}. "${testCase.text}"`);
  console.log(`   Is clarification: ${isClarification ? 'YES' : 'NO'} (Expected: ${testCase.expect ? 'YES' : 'NO'})`);
  if (isClarification !== testCase.expect) {
    console.log('   ❌ MISMATCH');
  }
  console.log('');
});

console.log('Testing Clarification Detection Logic (no pending context):\n');
pendingClarification = false;
testCases.forEach((testCase, index) => {
  const isClarification = isClarificationQuestion(testCase.text);
  console.log(`${index + 1}. "${testCase.text}"`);
  console.log(`   Is clarification: ${isClarification ? 'YES' : 'NO'} (Expected: NO)`);
  if (isClarification) {
    console.log('   ❌ Should not trigger without pending context');
  }
  console.log('');
}); 