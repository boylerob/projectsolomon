# Training Data ReadMe - TinyLlama Agent Development

## Overview
This document tracks insights, techniques, and strategies for training our TinyLlama agent to provide more targeted biblical responses.

## Current Scoring System (LexiconService)

### Multi-Factor Scoring Algorithm
Our existing `LexiconService` already implements a sophisticated scoring system that can be leveraged for training data generation:

```typescript
const totalScore = (
  relevance * 0.35 +      // 35% weight for relevance
  contextual * 0.25 +     // 25% weight for context  
  diversity * 0.20 +      // 20% weight for diversity
  userPreference * 0.15 + // 15% weight for user preference
  temporal * 0.05         // 5% weight for temporal factors
);
```

### Individual Scoring Methods
1. **`calculateRelevanceScore()`** - Keyword matching and semantic similarity
2. **`calculateContextualScore()`** - Topic continuity and conversation flow
3. **`calculateDiversityScore()`** - Avoids repetitive responses
4. **`calculateUserPreferenceScore()`** - Matches user's tone and interaction style
5. **`calculateTemporalScore()`** - Considers conversation length and timing

## Training Data Strategy

### Preference Learning Approach
- Use existing scoring system to create preference pairs
- Higher scored responses become "preferred" examples
- Lower scored responses become "rejected" examples
- Incorporate all existing lexicons, biblical metadata, and service responses

### Training Data Structure
```json
{
  "question": "What does the Bible say about forgiveness?",
  "chosen": "high_scoring_response_from_lexicon",
  "rejected": "low_scoring_response_from_lexicon", 
  "score": 0.85,
  "context": {
    "spiritual_maturity": "beginner",
    "preferred_tone": "pastoral",
    "interaction_style": "conversational"
  }
}
```

## Existing Assets for Training

### Current Services with Scoring
- **LexiconService**: Response patterns with confidence scores
- **QuestionParserService**: Question understanding and categorization
- **ImmediateAnswerService**: Factual biblical answers
- **KnowledgeEnhancementService**: Thematic connections and theological concepts
- **AgentService**: Conversation flow and context handling

### Data Sources
- `assets/solomon_lexicon_250.json` - AI training data
- `assets/response-lexicon.json` - Response patterns
- `assets/clarification-lexicon.json` - Clarification triggers
- `assets/bible_asv.json` - Complete Bible text
- `assets/biblical_people.json` - Biblical person metadata

### Jesus Quotes Databases
- `assets/jesus_quotes_comprehensive.json` - 304 quotes from unstructured file (Gospels, Acts, Revelation)
- `assets/jesus_words_asv.json` - 84 quotes from ASV Bible with context and sections
- `assets/jesus_words.json` - 5 curated high-impact quotes with keywords
- `assets/jesus_quotes_merged.json` - 392 total unique quotes from all sources

**Database Analysis Results:**
- **Comprehensive DB**: Most extensive (304 refs), covers all Gospels + Acts + Revelation
- **ASV DB**: Contextual format with narrative sections and theological themes
- **Simple DB**: Curated selection with keywords and context tags
- **Merged DB**: Complete collection with source tracking for training data generation

**Coverage by Book:**
- John: 83 references (most extensive)
- Matthew: 76 references
- Luke: 69 references  
- Mark: 54 references
- Acts: 19 references (Jesus's words to Paul)
- Revelation: 3 references (Jesus's words to John)

## Future Training Enhancements

### Biblical Accuracy Scoring
- Add biblical reference validation
- Score theological soundness
- Weight responses based on scriptural support

### User Context Adaptation
- Train on different spiritual maturity levels
- Adapt to user interaction styles
- Personalize based on study topics

### Conversation Flow Optimization
- Improve clarification detection
- Better follow-up question generation
- Enhanced context preservation

## Notes and Ideas

### [Date: Current]
- Existing scoring system is sophisticated and ready for training data generation
- LexiconService provides excellent foundation for preference learning
- All current services can contribute to training data quality

### Next Steps
1. Generate preference pairs from existing lexicons
2. Create training dataset with biblical accuracy metrics
3. Implement biblical reference validation in scoring
4. Develop user context adaptation training
5. Integrate Jesus quotes databases into biblical authority ranking system
6. Create training data from Jesus's words for theological accuracy scoring

---

*This document will be updated as we develop more targeted response techniques for the agent.* 