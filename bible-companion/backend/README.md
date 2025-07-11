# Solomon Biblical Backend

A comprehensive Google Cloud backend for Project Solomon, providing prioritized biblical data access and agent support.

## 🏗️ Architecture

### Three-Tier Search System
1. **Local Immediate Responses** - Fast local agent/TinyLLaMA processing
2. **Private Biblical Server** - Curated, authoritative biblical data
3. **Gemini Fallback** - Enhanced web search when biblical sources don't have results

### Google Cloud Services
- **Cloud Run** - Serverless backend API
- **Cloud SQL (PostgreSQL)** - Biblical data storage
- **Cloud Memorystore (Redis)** - Caching layer
- **Cloud Storage** - Large dataset storage
- **Firebase** - Authentication and real-time features

## 🚀 Quick Start

### Prerequisites
- Google Cloud CLI installed and authenticated
- Node.js 18+ installed
- PostgreSQL (for local development)

### 1. Clone and Setup
```bash
cd bible-companion/backend
npm install
cp env.example .env
```

### 2. Configure Environment
Edit `.env` with your Google Cloud and API credentials:
```bash
# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=solomon-biblical-data

# Database
DB_HOST=localhost
DB_NAME=solomon_biblical
DB_USER=postgres
DB_PASSWORD=your_password

# APIs
GEMINI_API_KEY=your-gemini-api-key
FIREBASE_PROJECT_ID=your-firebase-project-id
```

### 3. Local Development
```bash
# Start local database (if using Docker)
docker run -d --name postgres-solomon \
  -e POSTGRES_DB=solomon_biblical \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 postgres:14

# Start the server
npm run dev
```

### 4. Deploy to Google Cloud
```bash
# Make deployment script executable
chmod +x scripts/deploy-to-gcp.sh

# Deploy (this will create all necessary services)
./scripts/deploy-to-gcp.sh
```

## 📊 Database Schema

### Biblical Texts
```sql
CREATE TABLE biblical_texts (
  id SERIAL PRIMARY KEY,
  book VARCHAR(50) NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  translation VARCHAR(20) DEFAULT 'ASV',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Jesus Quotes (Priority 1)
```sql
CREATE TABLE jesus_quotes (
  id SERIAL PRIMARY KEY,
  quote TEXT NOT NULL,
  reference VARCHAR(50) NOT NULL,
  book VARCHAR(50) NOT NULL,
  topic VARCHAR(100),
  keywords TEXT[],
  priority INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'
);
```

### Biblical Lexicon (Priority 2)
```sql
CREATE TABLE biblical_lexicon (
  id SERIAL PRIMARY KEY,
  term VARCHAR(100) NOT NULL UNIQUE,
  definition TEXT NOT NULL,
  examples TEXT[],
  priority INTEGER DEFAULT 2,
  metadata JSONB DEFAULT '{}'
);
```

## 🔍 API Endpoints

### Priority Search
```http
POST /api/search/priority
Content-Type: application/json

{
  "query": "heal",
  "priorities": [1, 2, 3],
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jesus_quotes": [...],
    "biblical_texts": [...],
    "lexicon": [...],
    "gemini_results": [...]
  },
  "source": "database",
  "responseTime": 150,
  "totalResults": 25
}
```

### Biblical Data Management
```http
GET /api/biblical/jesus-quotes
GET /api/biblical/verses?book=John&chapter=3
POST /api/biblical/lexicon
PUT /api/biblical/priority/:id
```

### Agent Support
```http
POST /api/agent/query
GET /api/agent/context/:topic
POST /api/agent/enhance
```

### Analytics
```http
GET /api/search/stats
GET /api/search/popular
```

## 🔧 Data Import

### Import Jesus Quotes
```bash
npm run import-data -- --type=jesus-quotes --file=../assets/jesus_quotes_agent_optimized.json
```

### Import Biblical Texts
```bash
npm run import-data -- --type=biblical-texts --file=../assets/bible_asv.json
```

### Import Lexicon
```bash
npm run import-data -- --type=lexicon --file=../assets/solomon_lexicon_250.json
```

## 🎯 Search Priority System

### Priority 1: Jesus Quotes
- Direct sayings of Jesus
- Highest authority and relevance
- Fastest response time

### Priority 2: Biblical Lexicon
- Theological terms and definitions
- Historical context
- Expert commentary

### Priority 3: Complete Biblical Texts
- Full verse content
- Cross-references
- Multiple translations

### Fallback: Gemini Search
- When biblical sources don't have results
- Enhanced with biblical context
- Structured for agent consumption

## 🔐 Security Features

- **Rate Limiting** - 100 requests per 15 minutes per IP
- **CORS Protection** - Configurable allowed origins
- **Input Validation** - Joi schema validation
- **SQL Injection Protection** - Parameterized queries
- **Authentication** - Firebase-based auth middleware
- **HTTPS Only** - Enforced in production

## 📈 Performance Features

- **Redis Caching** - 5-minute cache for search results
- **Database Indexing** - Full-text search indexes
- **Connection Pooling** - Optimized database connections
- **Compression** - Gzip response compression
- **CDN Ready** - Cloud CDN compatible

## 🚀 Deployment

### Google Cloud Run
```bash
# Deploy to Cloud Run
gcloud run deploy solomon-backend \
  --source . \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated
```

### Environment Variables
Set these in Google Cloud Run:
- `DB_HOST` - Cloud SQL connection
- `GEMINI_API_KEY` - Gemini API key
- `FIREBASE_PROJECT_ID` - Firebase project
- `REDIS_HOST` - Cloud Memorystore connection

## 🔍 Monitoring

### Health Check
```http
GET /health
```

### Logs
```bash
# View Cloud Run logs
gcloud logs read --service=solomon-backend --limit=50
```

### Metrics
- Request count and latency
- Database query performance
- Cache hit rates
- Search result statistics

## 🧪 Testing

```bash
# Run tests
npm test

# Test specific endpoints
curl -X POST http://localhost:8080/api/search/priority \
  -H "Content-Type: application/json" \
  -d '{"query": "love", "priorities": [1,2]}'
```

## 📚 Integration with Frontend

### Update AgentService
```typescript
// In your frontend AgentService
const searchBackend = async (query: string) => {
  const response = await fetch('https://your-backend-url/api/search/priority', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, priorities: [1, 2, 3] })
  });
  return response.json();
};
```

## 🎯 Next Steps

1. **Import Data** - Load your biblical datasets
2. **Configure APIs** - Set up Gemini and Firebase
3. **Test Integration** - Verify frontend connectivity
4. **Monitor Performance** - Set up logging and metrics
5. **Scale** - Adjust Cloud Run resources as needed

## 📞 Support

For issues or questions:
- Check the logs: `gcloud logs read --service=solomon-backend`
- Test endpoints: `curl https://your-backend-url/health`
- Review metrics in Google Cloud Console

---

**Built for Project Solomon - Biblical AI Assistant** 🏛️ 