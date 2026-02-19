# 🏠 House AI — Smart Assistant Microservice

Production-grade AI assistant for **House Mobile**, a smartphone e-commerce platform. Features smart LLM routing, RAG pipeline, emotion-aware responses, and multi-language support (Uzbek, Russian, English).

## Architecture

```
house-ai/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── config.py             # Pydantic settings
│   ├── routes.py             # Health check
│   ├── middleware.py          # CORS, rate limit, logging
│   ├── dependencies.py        # DI + JWT auth
│   ├── ai/
│   │   ├── router.py         # Chat API (REST + WebSocket)
│   │   ├── intent.py         # Intent classification
│   │   ├── emotion.py        # Emotion detection
│   │   ├── memory.py         # Session memory
│   │   ├── recommend.py      # Recommendation engine
│   │   ├── compare.py        # Comparison engine
│   │   ├── rag.py            # RAG pipeline
│   │   ├── language.py        # Multi-language + typo fix
│   │   ├── summarizer.py     # Conversation summarizer
│   │   └── cost_control.py   # Token budget + routing
│   ├── services/
│   │   ├── llm_service.py    # OpenAI client
│   │   ├── supabase_service.py
│   │   ├── redis_service.py
│   │   ├── brave_service.py
│   │   └── currency_service.py
│   └── models/
│       ├── schemas.py
│       └── response_models.py
├── database/
│   └── schema.sql             # Supabase tables + pgvector
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── .env.example
```

## Quick Start

### 1. Prerequisites

- Python 3.11+
- Redis (local or Docker)
- Supabase project (with pgvector enabled)
- OpenAI API key
- Brave Search API key (optional)

### 2. Local Setup

```bash
cd house-ai

# Create virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your API keys
```

### 3. Database Setup (Supabase)

1. Go to your Supabase project → **SQL Editor**
2. Run `database/schema.sql`
3. (Optional) Uncomment the sample data section to insert demo products

### 4. Redis Setup

**Option A: Docker**
```bash
docker run -d --name house-ai-redis -p 6379:6379 redis:7-alpine
```

**Option B: Local install**
```bash
# Windows: Use WSL or download from https://github.com/microsoftarchive/redis/releases
# The app works without Redis (graceful fallback), but caching will be disabled
```

### 5. Run the Server

```bash
# Development
uvicorn app.main:app --host 0.0.0.0 --port 8100 --reload

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8100 --workers 4

# With Gunicorn (Linux)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8100
```

### 6. Verify

```bash
curl http://localhost:8100/health
# → {"status":"healthy","version":"1.0.0",...}

# Interactive docs
# → http://localhost:8100/docs
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/` | API info |
| `POST` | `/api/chat` | Main chat (REST) |
| `WS` | `/api/chat/stream` | Streaming chat (WebSocket) |
| `POST` | `/api/recommend` | Get recommendations |
| `POST` | `/api/compare` | Compare products |
| `POST` | `/api/session` | Create/resume session |

### Chat Example

```bash
curl -X POST http://localhost:8100/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Eng yaxshi gaming telefon qaysi?", "session_id": null}'
```

### WebSocket Streaming

```javascript
const ws = new WebSocket('ws://localhost:8100/api/chat/stream');
ws.onopen = () => ws.send(JSON.stringify({ message: "Best camera phone?", session_id: "abc" }));
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

## Docker Deployment

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f house-ai

# Stop
docker-compose down
```

## Production Deploy (VPS + Nginx)

### 1. Server Setup

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone and configure
git clone <repo> /opt/house-mobile
cd /opt/house-mobile/house-ai
cp .env.example .env
# Edit .env with production values
```

### 2. Nginx Reverse Proxy

```nginx
upstream house_ai {
    server 127.0.0.1:8100;
}

server {
    listen 443 ssl http2;
    server_name ai.housemobile.uz;

    ssl_certificate /etc/letsencrypt/live/ai.housemobile.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ai.housemobile.uz/privkey.pem;

    location / {
        proxy_pass http://house_ai;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/chat/stream {
        proxy_pass http://house_ai;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

### 3. Start

```bash
docker-compose up -d
```

## Scaling Strategy

| Load | Workers | Redis | Strategy |
|------|---------|-------|----------|
| < 100 req/min | 2 | Single | Single VPS |
| 100-500 req/min | 4 | Single | Single VPS, optimize |
| 500-2000 req/min | 8+ | Cluster | Multiple VPS + LB |
| 2000+ req/min | 16+ | Sentinel | K8s + auto-scaling |

## Cost Optimization

- **GPT-4o-mini** handles 85% of queries (~$0.15-0.60/M tokens)
- **GPT-4o** only for complex comparisons (~$5-15/M tokens)
- Redis caching avoids redundant API calls
- Conversation summarization reduces context window
- Daily token budget per user prevents runaway costs
- Embedding with `text-embedding-3-small` ($0.02/M tokens)

**Estimated cost**: ~$5-15/month for 1000 daily active users.

## Monitoring

- Structured JSON logs → pipe to ELK/Grafana Loki
- `/health` endpoint for load balancer checks
- X-Request-ID and X-Response-Time headers on all responses
- Token usage tracked per user in Redis
- Consider adding: Sentry, Prometheus metrics, Datadog APM

## Environment Variables

See `.env.example` for the complete list of configuration options.

## License

Proprietary — House Mobile © 2024
