# Project Solomon Backend API

A comprehensive backend API for biblical data search, Jesus quotes, and AI-enhanced responses using Google Cloud infrastructure with **Gemini 2.0 Flash** integration.

## 🏗️ Architecture

- **Cloud Run**: Serverless container hosting
- **Cloud SQL**: PostgreSQL database for biblical data
- **Redis**: Caching layer
- **Google AI**: **Gemini 2.5 Pro** integration for enhanced responses
- **Cloud Storage**: Biblical data storage

## 🚀 Quick Start

### Prerequisites

1. Google Cloud CLI installed and authenticated
2. Node.js 18+ installed
3. Access to the `book-guide-7ef1e` project
4. **Gemini 2.5 Pro** API key

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Edit .env with your configuration
nano .env
```

### Local Development

```bash
# Start development server
npm run dev

# The API will be available at http://localhost:8080
```

### Deployment

```bash
# Deploy to Cloud Run
./deploy.sh
```

## 📊 Database Schema

### Biblical Verses Table
- `id`: Primary key
- `book`: Book name (e.g., "John", "Psalm")
- `chapter`: Chapter number
- `verse`: Verse number
- `text`: Verse text
- `translation`: Bible translation (default: ASV)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Jesus Quotes Table
- `id`: Primary key
- `book`: Book name
- `chapter`: Chapter number
- `verse`: Verse number
- `text`: Quote text
- `context`: Context of the quote
- `topic`: Topic categorization
- `created_at`: Creation timestamp

### **Gemini Analysis Table** (NEW)
- `id`: Primary key
- `verse_reference`: Verse reference (e.g., "John 3:16")
- `book`: Book name
- `chapter`: Chapter number
- `verse`: Verse number
- `user_query`: Original user query
- `historical_context`: Historical and cultural context
- `theological_significance`: Theological significance
- `key_themes`: Array of key themes and doctrines
- `practical_applications`: Array of practical applications
- `related_concepts`: Array of related theological concepts
- `scholarly_perspectives`: Scholarly perspectives
- `analysis_confidence`: Confidence score (0.0-1.0)
- `processing_time_ms`: Processing time in milliseconds
- `model_version`: Model version used (gemini-2.0-flash-exp)
- `created_at`: Creation timestamp

### Learning System Tables
- `query_patterns`: Query patterns and metadata
- `ai_responses`: Stored AI responses with biblical references
- `knowledge_sources`: Knowledge base sources
- `knowledge_chunks`: Processed knowledge chunks
- `authority_levels`: Authority hierarchy for content
- `concept_consensus`: Consensus tracking for concepts
- `authority_conflicts`: Conflict detection and resolution
- `processing_jobs`: Background processing jobs

## 🔌 API Endpoints

### Health Check
```
GET /health
```
Returns service health status.

### Biblical Search
```
GET /api/search?query={search_term}&book={book}&chapter={chapter}&verse={verse}&topic={topic}&limit={limit}
```

**Parameters:**
- `query`: Text search term
- `book`: Specific book name
- `chapter`: Chapter number
- `verse`: Verse number
- `topic`: Topic search
- `limit`: Maximum results (default: 50)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "results": [
    {
      "book": "John",
      "chapter": 3,
      "verse": 16,
      "text": "For God so loved the world...",
      "relevance": 0.85
    }
  ]
}
```

### Jesus Quotes
```
GET /api/jesus-quotes?topic={topic}&book={book}&keyword={keyword}&limit={limit}
```

**Parameters:**
- `topic`: Topic filter
- `book`: Book filter
- `keyword`: Keyword search
- `limit`: Maximum results (default: 20)

**Response:**
```json
{
  "success": true,
  "count": 3,
  "quotes": [
    {
      "book": "John",
      "chapter": 3,
      "verse": 16,
      "text": "For God so loved the world...",
      "context": "Jesus speaking to Nicodemus",
      "topic": "Salvation"
    }
  ]
}
```

### **Gemini Analysis** (NEW)
```
GET /api/gemini-analysis?verse_reference={reference}&book={book}&chapter={chapter}&verse={verse}&limit={limit}
```

**Parameters:**
- `verse_reference`: Verse reference (e.g., "John 3:16")
- `book`: Book name
- `chapter`: Chapter number
- `verse`: Verse number
- `limit`: Maximum results (default: 50)

**Response:**
```json
{
  "success": true,
  "count": 1,
  "analyses": [
    {
      "verse_reference": "John 3:16",
      "historical_context": "Historical context...",
      "theological_significance": "Theological significance...",
      "key_themes": ["God's Love", "Salvation", "Faith"],
      "practical_applications": ["Personal faith", "Gospel sharing"],
      "processing_time_ms": 7834,
      "model_version": "gemini-2.0-flash-exp"
    }
  ]
}
```

### **Gemini Analysis Statistics** (NEW)
```
GET /api/gemini-analysis/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalAnalyses": 2,
    "averageProcessingTime": 7866,
    "modelStats": [
      {
        "model_version": "gemini-2.0-flash-exp",
        "count": "2"
      }
    ],
    "topVerses": [
      {
        "verse_reference": "John 3:16",
        "analysis_count": 1
      }
    ]
  }
}
```

### **Comprehensive Response** (NEW)
```
POST /api/agent/comprehensive-response
```

**Request Body:**
```json
{
  "query": "What does John 3:16 mean?",
  "context": { "userLevel": "beginner" }
}
```

**Response:**
```json
{
  "success": true,
  "comprehensiveResponse": {
    "primaryAnswer": "John 3:16 is one of the most well-known passages...",
    "supportingReferences": ["John 3:16"],
    "relatedInsights": ["Cross-references..."],
    "practicalApplications": ["Personal applications..."],
    "historicalContext": "Historical context...",
    "theologicalInsights": "Theological significance...",
    "enhancedData": {
      "hasBiblicalData": true,
      "hasGeminiAnalysis": true,
      "isStoredAnalysis": false,
      "geminiProcessingTime": 7834
    }
  }
}
```

### AI-Enhanced Search
```
POST /api/ai-search
```

**Request Body:**
```json
{
  "query": "What does the Bible say about love?",
  "context": "Personal study",
  "useGemini": true
}
```

**Response:**
```json
{
  "success": true,
  "query": "What does the Bible say about love?",
  "biblicalContext": [...],
  "aiResponse": "Based on the biblical passages...",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Learning System Endpoints
```
POST /api/learning/store
GET /api/learning/find-similar?query={query}
GET /api/learning/patterns?limit={limit}
GET /api/learning/stats
```

### Cache Management
```
POST /api/cache/clear
```
Clears all Redis cache.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `GEMINI_API_KEY` | **Gemini 2.5 Pro** API key | Required for AI features |
| `GCS_BUCKET_NAME` | Cloud Storage bucket | `solomon-biblical-data` |
| `PORT` | Server port | `8080` |
| `NODE_ENV` | Environment | `production` |
| `ALLOWED_ORIGINS` | CORS origins | `http://localhost:3000,http://localhost:8081` |

## 🛡️ Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Joi schema validation
- **Compression**: Response compression
- **Non-root User**: Docker security

## 📈 Performance

- **Full-text Search**: PostgreSQL GIN indexes
- **Caching**: Redis for frequently accessed data
- **Gemini Analysis Caching**: 84ms retrieval vs 7.8s generation
- **Connection Pooling**: Efficient database connections
- **Compression**: Reduced bandwidth usage

## 🔍 Monitoring

- **Health Checks**: `/health` endpoint
- **Logging**: Structured logging with timestamps
- **Error Handling**: Comprehensive error responses
- **Metrics**: Request/response monitoring
- **Gemini Analysis Stats**: Performance tracking

## 🚀 Deployment

The backend is deployed to Google Cloud Run with the following specifications:

- **Memory**: 512Mi
- **CPU**: 1 vCPU
- **Max Instances**: 10
- **Min Instances**: 0 (scale to zero)
- **Region**: us-central1
- **Service URL**: `https://solomon-backend-841857698822.us-central1.run.app`

## 📝 Development

### Adding New Endpoints

1. Add route handler in `server.js`
2. Add input validation using Joi
3. Add error handling
4. Update documentation

### Database Migrations

1. Create SQL migration file
2. Test locally
3. Apply to Cloud SQL instance
4. Update schema documentation

### **Gemini Analysis Integration**

The system automatically:
1. Checks for stored analysis before making new API calls
2. Stores new analysis results in the database
3. Tracks processing time and model version
4. Provides statistics on analysis coverage

## 🤝 Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Test deployment locally first

## 📄 License

This project is part of Project Solomon and follows the same licensing terms. 