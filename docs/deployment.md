# Deployment Documentation

## Overview

devCollab is designed for cloud deployment with separate hosting for frontend and backend. The frontend is deployed as a static site to Vercel, while the backend runs as a containerized application on Render.

## Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend     │    │    Backend      │    │   Database      │
│   (Vercel)     │    │   (Render)      │    │ (Render/PG)    │
│                 │    │                 │    │                 │
│ - Static CDN   │    │ - Container     │    │ - Managed DB    │
│ - Edge Network │    │ - Auto-scaling  │    │ - Backups       │
│ - HTTPS        │    │ - HTTPS         │    │ - SSL/TLS       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account
- GitHub repository connected to Vercel
- Environment variables configured

### Deployment Steps

#### 1. Connect Repository to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from frontend directory
cd frontend
vercel --prod
```

#### 2. Configure Project Settings
In Vercel dashboard:
- Set **Build Command**: `npm run build`
- Set **Output Directory**: `dist`
- Set **Node.js Version**: `20.x`
- Configure environment variables

#### 3. Environment Variables
Set these in Vercel dashboard:
```
VITE_API_URL=https://your-backend-url.onrender.com
VITE_WS_URL=https://your-backend-url.onrender.com
```

### Vercel Configuration Files

#### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "NODE_VERSION": "20"
  }
}
```

#### .vercelignore
```
node_modules
.git
.env
.env.local
.env.production
README.md
```

### Automatic Deployment
Vercel automatically deploys on:
- Push to main branch
- Pull request creation/updates
- Manual deployment via dashboard

## Backend Deployment (Render)

### Prerequisites
- Render account
- Docker container built and pushed to registry
- Environment variables configured

### Deployment Steps

#### 1. Prepare Docker Image
```bash
# Build and tag Docker image
docker build -t your-registry/devcollab-backend:latest ./backend

# Push to registry (Docker Hub, GitHub Container Registry, etc.)
docker push your-registry/devcollab-backend:latest
```

#### 2. Create Render Service
In Render dashboard:
1. Click "New +" → "Web Service"
2. Connect your Git repository
3. Select "Docker" as runtime
4. Configure service settings

#### 3. Service Configuration
```yaml
# render.yaml (in repository root)
services:
  - type: web
    name: devcollab-backend
    env: docker
    repo: https://github.com/yourusername/devCollab
    rootDir: backend
    dockerfilePath: ./backend/Dockerfile
    plan: free
    region: oregon
    branch: main
    healthCheckPath: /health
    envVars:
      - key: DATABASE_URL
        value: ${DATABASE_URL}
      - key: REDIS_URL
        value: ${REDIS_URL}
      - key: JWT_SECRET
        value: ${JWT_SECRET}
      - key: JWT_ALGORITHM
        value: HS256
      - key: JWT_EXPIRE_MINUTES
        value: 30
      - key: FRONTEND_URL
        value: https://your-app.vercel.app
      - key: BACKEND_URL
        value: https://your-app.onrender.com
      - key: ENVIRONMENT
        value: production
      - key: ALLOWED_ORIGINS
        value: https://your-app.vercel.app
      - key: WEBSOCKET_CORS_ALLOWED_ORIGINS
        value: https://your-app.vercel.app
```

#### 4. Database Setup
Render provides managed PostgreSQL:
1. In Render dashboard, click "New +" → "PostgreSQL"
2. Choose instance size and region
3. Database will be created with connection string
4. Add connection string to environment variables

#### 5. Redis Setup
For Redis, you have options:
- **Render Redis**: Managed Redis service
- **Upstash Redis**: Serverless Redis with generous free tier
- **Redis Cloud**: Redis Labs managed service

Example with Upstash:
```bash
# Create Redis database
npm install -g @upstash/cli
upstash redis create

# Get connection string and add to environment variables
```

## Environment Configuration

### Production Environment Variables

#### Backend Environment
```env
# Database (Render PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database

# Redis (Upstash/Render Redis)
REDIS_URL=redis://username:password@host:port

# JWT Configuration
JWT_SECRET=your-super-secure-production-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30

# Frontend URL
FRONTEND_URL=https://your-app.vercel.app

# Backend URL
BACKEND_URL=https://your-app.onrender.com

# Environment
ENVIRONMENT=production

# CORS Settings
ALLOWED_ORIGINS=https://your-app.vercel.app
WEBSOCKET_CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```

#### Frontend Environment
```env
# API URLs (Vercel environment variables)
VITE_API_URL=https://your-app.onrender.com
VITE_WS_URL=https://your-app.onrender.com
```

## Docker Configuration

### Production Dockerfile
```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app
RUN chown -R app:app /app
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Multi-stage Dockerfile (Optimized)
```dockerfile
# backend/Dockerfile.prod
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Security
RUN useradd --create-home --shell /bin/bash app
RUN chown -R app:app /app
USER app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## CI/CD Pipeline

### GitHub Actions Workflow

#### .github/workflows/deploy.yml
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run frontend tests
        run: |
          cd frontend
          npm test
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install backend dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Run backend tests
        run: |
          cd backend
          pytest

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: ghcr.io/${{ github.repository }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

## Monitoring and Logging

### Application Monitoring

#### Health Checks
```python
# backend/app/main.py
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "devCollab API",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }
```

#### Error Tracking
```python
# Error logging
import logging
import sentry_sdk

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment=os.getenv("ENVIRONMENT", "development")
)

logger = logging.getLogger(__name__)
```

#### Performance Monitoring
```javascript
// Frontend performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric) {
  // Send to your analytics service
  gtag('event', metric.name, {
    value: metric.value,
    event_category: 'Web Vitals'
  })
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

### Log Management
```python
# Structured logging
import structlog

logger = structlog.get_logger()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(
        "request_started",
        method=request.method,
        url=str(request.url),
        client_ip=request.client.host
    )
    
    response = await call_next(request)
    
    logger.info(
        "request_completed",
        status_code=response.status_code,
        duration=time.time() - start_time
    )
    
    return response
```

## Security Considerations

### HTTPS Configuration
- Frontend: Automatic HTTPS via Vercel
- Backend: Automatic HTTPS via Render
- WebSocket: Secure WebSocket (wss://) connections

### Environment Security
```bash
# Use production secrets
JWT_SECRET=$(openssl rand -base64 32)
DATABASE_URL="postgresql://user:$(openssl rand -base64 16)@host:port/db"

# Secure headers in FastAPI
app.add_middleware(
    SecurityHeadersMiddleware,
    headers={
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
    }
)
```

### Rate Limiting
```python
# Implement rate limiting
from slowapi import Limiter, _get_rate_limit
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/auth/login")
@limiter.limit("5/minute")
async def login(request: Request):
    # Login logic
```

## Scaling Considerations

### Horizontal Scaling
- **Frontend**: Automatic scaling via Vercel Edge Network
- **Backend**: Configure multiple instances in Render
- **Database**: Connection pooling and read replicas
- **Redis**: Clustered Redis for high availability

### Performance Optimization
- **CDN**: Vercel Edge Network for static assets
- **Caching**: Redis caching for frequently accessed data
- **Database**: Optimized queries and indexing
- **Compression**: Gzip compression for API responses

### Backup Strategy
- **Database**: Automated daily backups via Render
- **Code**: Version control with Git
- **Configuration**: Environment variables backup
- **Assets**: Immutable deployments via CDN

## Troubleshooting

### Common Issues

#### Frontend Deployment Issues
```bash
# Check build locally
cd frontend
npm run build

# Verify build output
ls -la dist/

# Test production build locally
npm run preview
```

#### Backend Deployment Issues
```bash
# Check Docker image
docker build -t test ./backend
docker run -p 8000:8000 test

# Check logs
docker logs <container_id>

# Test health endpoint
curl https://your-app.onrender.com/health
```

#### Database Connection Issues
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check connection string format
echo $DATABASE_URL
```

### Debugging Tools
- **Vercel Logs**: Dashboard → Functions → Logs
- **Render Logs**: Dashboard → Services → Logs
- **Database Logs**: Dashboard → Database → Logs
- **Browser DevTools**: Network tab for API calls

This deployment setup ensures a robust, scalable production environment for devCollab with proper monitoring and security measures.
