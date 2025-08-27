# Infrastructure Components & Architecture

Complete documentation for the Docker-based infrastructure and deployment architecture of JBTestSuite.

## 🏗️ Infrastructure Architecture Overview

JBTestSuite uses a containerized microservices architecture with Docker Compose for orchestration, emphasizing scalability, maintainability, and development efficiency.

### Infrastructure Stack
- **Docker** - Container runtime for service isolation
- **Docker Compose** - Multi-service orchestration and networking
- **PostgreSQL** - Primary database with persistent storage
- **Selenium Grid** - Browser automation infrastructure
- **Nginx** - Reverse proxy and load balancing (production)
- **Volume Management** - Persistent data and artifact storage

### Service Architecture
```mermaid
flowchart TB
    subgraph "Load Balancer Layer"
        LB[Nginx Load Balancer]
        SSL[SSL Termination]
    end
    
    subgraph "Application Layer"
        Client[React Client:3000]
        API[FastAPI Server:8000]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL:5432)]
        Cache[Redis Cache:6379]
        Files[File Storage Volume]
    end
    
    subgraph "Automation Layer"
        Grid[Selenium Grid:4444]
        Chrome[Chrome Browsers]
        VNC[VNC Server:7900]
    end
    
    subgraph "Monitoring Layer"
        Logs[Centralized Logs]
        Metrics[Metrics Collection]
        Health[Health Checks]
    end
    
    Users --> LB
    LB --> Client
    LB --> API
    Client --> API
    API --> DB
    API --> Cache
    API --> Grid
    Grid --> Chrome
    Grid --> VNC
    API --> Files
    
    Client -.-> Logs
    API -.-> Logs
    DB -.-> Logs
    Grid -.-> Logs
```

## 🐳 Docker Configuration

### Multi-Stage Frontend Dockerfile

```dockerfile
# client/Dockerfile - Optimized React build
# Stage 1: Build environment
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Production environment
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Create nginx user and set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Switch to non-root user
USER nginx

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Optimized Backend Dockerfile

```dockerfile
# server/Dockerfile - FastAPI with Python optimizations
FROM python:3.11-slim AS base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Create app user
RUN groupadd -r appuser && \
    useradd -r -g appuser -d /app -s /bin/bash -c "App User" appuser

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Development stage
FROM base AS development
COPY requirements-dev.txt .
RUN pip install --no-cache-dir -r requirements-dev.txt

# Copy source code
COPY --chown=appuser:appuser . .

# Switch to app user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Start application with auto-reload
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Production stage
FROM base AS production

# Copy only production dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY --chown=appuser:appuser src/ ./src/
COPY --chown=appuser:appuser alembic/ ./alembic/
COPY --chown=appuser:appuser alembic.ini .

# Create necessary directories
RUN mkdir -p /app/artifacts/screenshots /app/logs && \
    chown -R appuser:appuser /app

# Switch to app user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Start application with production settings
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

## 📋 Docker Compose Configuration

### Development Environment

```yaml
# docker-compose.yml - Development orchestration
version: '3.8'

services:
  # Database service
  postgres:
    image: postgres:16-alpine
    container_name: jbts_postgres
    environment:
      POSTGRES_DB: jbtestsuite
      POSTGRES_USER: jbuser
      POSTGRES_PASSWORD: jbpass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./server/init-db:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U jbuser -d jbtestsuite"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - jbts_network
    restart: unless-stopped

  # Redis cache (optional)
  redis:
    image: redis:7-alpine
    container_name: jbts_redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - jbts_network
    restart: unless-stopped

  # Selenium Grid Hub
  selenium:
    image: selenium/standalone-chromium:latest
    container_name: jbts_selenium
    environment:
      - SE_VNC_PASSWORD=secret
      - SE_SCREEN_WIDTH=1920
      - SE_SCREEN_HEIGHT=1080
      - SE_SCREEN_DEPTH=24
      - SE_START_XVFB=true
      - SE_NODE_MAX_INSTANCES=3
      - SE_NODE_MAX_SESSIONS=3
    ports:
      - "4444:4444"    # Selenium Grid
      - "7900:7900"    # VNC viewer
    volumes:
      - /dev/shm:/dev/shm
      - selenium_data:/opt/selenium/assets
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4444/wd/hub/status"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    networks:
      - jbts_network
    restart: unless-stopped

  # Backend API service
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
      target: development
    container_name: jbts_server
    environment:
      - DATABASE_URL=postgresql+asyncpg://jbuser:jbpass@postgres:5432/jbtestsuite
      - SELENIUM_HUB_URL=http://selenium:4444/wd/hub
      - REDIS_URL=redis://redis:6379
      - ENVIRONMENT=development
      - DEBUG=true
    ports:
      - "8000:8000"
    volumes:
      - ./server/src:/app/src
      - ./server/alembic:/app/alembic
      - artifacts_data:/app/artifacts
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      selenium:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    networks:
      - jbts_network
    restart: unless-stopped

  # Frontend client service
  client:
    build:
      context: ./client
      dockerfile: Dockerfile
      target: development
    container_name: jbts_client
    environment:
      - VITE_API_URL=http://localhost:8000
      - VITE_WS_URL=ws://localhost:8000
      - NODE_ENV=development
    ports:
      - "3000:3000"
    volumes:
      - ./client/src:/app/src
      - ./client/public:/app/public
      - ./client/index.html:/app/index.html
      # Exclude node_modules from volume mount
      - /app/node_modules
    depends_on:
      - server
    networks:
      - jbts_network
    restart: unless-stopped

  # Development tools
  adminer:
    image: adminer:latest
    container_name: jbts_adminer
    ports:
      - "8080:8080"
    environment:
      - ADMINER_DEFAULT_SERVER=postgres
    depends_on:
      - postgres
    networks:
      - jbts_network
    restart: unless-stopped
    profiles:
      - tools

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  selenium_data:
    driver: local
  artifacts_data:
    driver: local

networks:
  jbts_network:
    driver: bridge
    name: jbts_network
```

### Production Environment

```yaml
# docker-compose.prod.yml - Production orchestration
version: '3.8'

services:
  # Nginx reverse proxy and load balancer
  nginx:
    image: nginx:alpine
    container_name: jbts_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/logs:/var/log/nginx
      - artifacts_data:/var/www/artifacts:ro
    depends_on:
      - client
      - server
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - jbts_network
    restart: unless-stopped

  # Database with production optimizations
  postgres:
    image: postgres:16-alpine
    container_name: jbts_postgres
    environment:
      POSTGRES_DB: jbtestsuite
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./server/init-db:/docker-entrypoint-initdb.d
      - ./postgres/conf:/etc/postgresql/conf.d
    command: |
      postgres
      -c shared_preload_libraries=pg_stat_statements
      -c pg_stat_statements.track=all
      -c max_connections=200
      -c shared_buffers=256MB
      -c effective_cache_size=1GB
      -c work_mem=4MB
      -c maintenance_work_mem=64MB
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d jbtestsuite"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - jbts_network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  # Redis for caching and sessions
  redis:
    image: redis:7-alpine
    container_name: jbts_redis
    command: |
      redis-server
      --appendonly yes
      --maxmemory 256MB
      --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
      - ./redis/redis.conf:/usr/local/etc/redis/redis.conf
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - jbts_network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  # Selenium Grid with multiple browser nodes
  selenium-hub:
    image: selenium/hub:latest
    container_name: jbts_selenium_hub
    environment:
      - GRID_MAX_SESSION=16
      - GRID_BROWSER_TIMEOUT=300
      - GRID_TIMEOUT=300
    ports:
      - "4444:4444"
    networks:
      - jbts_network
    restart: unless-stopped

  selenium-chrome:
    image: selenium/node-chromium:latest
    deploy:
      replicas: 3
    environment:
      - HUB_HOST=selenium-hub
      - NODE_MAX_INSTANCES=2
      - NODE_MAX_SESSIONS=2
    volumes:
      - /dev/shm:/dev/shm
    depends_on:
      - selenium-hub
    networks:
      - jbts_network
    restart: unless-stopped

  # Backend API with multiple workers
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
      target: production
    deploy:
      replicas: 2
    environment:
      - DATABASE_URL=postgresql+asyncpg://${DB_USER}:${DB_PASSWORD}@postgres:5432/jbtestsuite
      - SELENIUM_HUB_URL=http://selenium-hub:4444/wd/hub
      - REDIS_URL=redis://redis:6379
      - ENVIRONMENT=production
      - DEBUG=false
      - SECRET_KEY=${SECRET_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - artifacts_data:/app/artifacts
      - logs_data:/app/logs
    depends_on:
      - postgres
      - redis
      - selenium-hub
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - jbts_network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'

  # Frontend static files
  client:
    build:
      context: ./client
      dockerfile: Dockerfile
      target: production
    container_name: jbts_client
    environment:
      - VITE_API_URL=/api
      - VITE_WS_URL=/ws
    networks:
      - jbts_network
    restart: unless-stopped

  # Log aggregation
  filebeat:
    image: docker.elastic.co/beats/filebeat:8.5.0
    container_name: jbts_filebeat
    user: root
    volumes:
      - ./filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - logs_data:/logs
    networks:
      - jbts_network
    restart: unless-stopped
    profiles:
      - monitoring

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  artifacts_data:
    driver: local
  logs_data:
    driver: local

networks:
  jbts_network:
    driver: bridge
    name: jbts_network
```

## 🔧 Service Configuration

### Nginx Reverse Proxy

```nginx
# nginx/conf.d/default.conf - Production nginx configuration
upstream client {
    server client:3000;
}

upstream server {
    server server_1:8000;
    server server_2:8000;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=uploads:10m rate=2r/s;

# Caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=static_cache:10m max_size=100m inactive=60m use_temp_path=off;

server {
    listen 80;
    server_name localhost;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Client (React app)
    location / {
        proxy_pass http://client;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Handle React Router
        try_files $uri $uri/ @fallback;
    }

    location @fallback {
        proxy_pass http://client;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://server/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket connections
    location /ws {
        proxy_pass http://server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket specific timeouts
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Static assets with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://client;
        proxy_cache static_cache;
        proxy_cache_valid 200 1h;
        proxy_cache_use_stale error timeout invalid_header updating http_500 http_502 http_503 http_504;
        add_header X-Cache-Status $upstream_cache_status;
        expires 1h;
    }

    # File uploads
    location /api/v1/artifacts/upload {
        limit_req zone=uploads burst=5 nodelay;
        
        client_max_body_size 100M;
        proxy_pass http://server/api/v1/artifacts/upload;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Upload timeouts
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Serve artifacts directly
    location /artifacts/ {
        alias /var/www/artifacts/;
        expires 1d;
        add_header Cache-Control "public, immutable";
        
        # Security for sensitive files
        location ~* \.(log|conf|key|pem)$ {
            deny all;
        }
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# SSL configuration (production)
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Same configuration as HTTP with SSL-specific additions
    # ... (include all location blocks from HTTP config)
}
```

### PostgreSQL Optimization

```conf
# postgres/conf/postgresql.conf - Production database configuration
# Connection settings
max_connections = 200
superuser_reserved_connections = 3

# Memory settings
shared_buffers = 256MB
work_mem = 4MB
maintenance_work_mem = 64MB
effective_cache_size = 1GB

# Checkpoint settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100

# Logging
log_destination = 'stderr'
log_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 10MB
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0

# Query tuning
random_page_cost = 1.1
effective_io_concurrency = 200

# Replication settings (if needed)
wal_level = replica
max_wal_senders = 3
wal_keep_size = 64MB

# Extensions
shared_preload_libraries = 'pg_stat_statements'
```

## 🔍 Monitoring & Health Checks

### Comprehensive Health Check System

```python
# core/health.py - Advanced health checking
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import asyncio
import psutil
import aiohttp
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_async_session
from src.core.config import settings
from src.integrations.selenium.webdriver_manager import webdriver_manager
from src.integrations.ai.openai_client import openai_client

class HealthChecker:
    """
    Comprehensive system health monitoring.
    
    Performs deep health checks on all system components
    including database, external services, and system resources.
    """
    
    def __init__(self):
        self.last_check_time = None
        self.cached_results = {}
        self.cache_duration = timedelta(seconds=30)
    
    async def get_system_health(self, include_detailed: bool = False) -> Dict[str, Any]:
        """
        Get comprehensive system health status.
        
        Args:
            include_detailed: Include detailed diagnostic information
            
        Returns:
            System health report
        """
        # Check cache
        if (self.last_check_time and 
            datetime.utcnow() - self.last_check_time < self.cache_duration):
            return self.cached_results
        
        # Perform health checks
        health_checks = [
            self._check_database(),
            self._check_redis(),
            self._check_selenium(),
            self._check_openai(),
            self._check_system_resources(),
            self._check_disk_space(),
        ]
        
        if include_detailed:
            health_checks.extend([
                self._check_network_connectivity(),
                self._check_file_permissions(),
                self._check_environment_config()
            ])
        
        # Run checks concurrently
        results = await asyncio.gather(*health_checks, return_exceptions=True)
        
        # Process results
        health_report = {
            "overall_status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "database": results[0] if not isinstance(results[0], Exception) else {"status": "error", "error": str(results[0])},
                "redis": results[1] if not isinstance(results[1], Exception) else {"status": "error", "error": str(results[1])},
                "selenium": results[2] if not isinstance(results[2], Exception) else {"status": "error", "error": str(results[2])},
                "openai": results[3] if not isinstance(results[3], Exception) else {"status": "error", "error": str(results[3])},
            },
            "system": {
                "resources": results[4] if not isinstance(results[4], Exception) else {"status": "error", "error": str(results[4])},
                "disk": results[5] if not isinstance(results[5], Exception) else {"status": "error", "error": str(results[5])},
            }
        }
        
        if include_detailed:
            health_report["diagnostics"] = {
                "network": results[6] if len(results) > 6 and not isinstance(results[6], Exception) else None,
                "permissions": results[7] if len(results) > 7 and not isinstance(results[7], Exception) else None,
                "config": results[8] if len(results) > 8 and not isinstance(results[8], Exception) else None,
            }
        
        # Determine overall status
        service_statuses = [service.get("status", "unknown") for service in health_report["services"].values()]
        system_statuses = [system.get("status", "unknown") for system in health_report["system"].values()]
        
        all_statuses = service_statuses + system_statuses
        if "critical" in all_statuses:
            health_report["overall_status"] = "critical"
        elif "warning" in all_statuses:
            health_report["overall_status"] = "warning"
        elif any(status not in ["healthy", "optional"] for status in all_statuses):
            health_report["overall_status"] = "degraded"
        
        # Cache results
        self.last_check_time = datetime.utcnow()
        self.cached_results = health_report
        
        return health_report
    
    async def _check_database(self) -> Dict[str, Any]:
        """Check database connectivity and performance."""
        try:
            start_time = datetime.utcnow()
            
            async with AsyncSession() as session:
                # Basic connectivity
                result = await session.execute(text("SELECT 1"))
                result.scalar()
                
                # Check database size and connections
                db_info = await session.execute(text("""
                    SELECT 
                        pg_database_size(current_database()) as db_size,
                        (SELECT count(*) FROM pg_stat_activity) as active_connections,
                        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
                """))
                db_size, active_connections, max_connections = db_info.fetchone()
                
                # Check table counts
                table_counts = await session.execute(text("""
                    SELECT 
                        (SELECT count(*) FROM test_cases) as test_cases,
                        (SELECT count(*) FROM test_executions) as test_executions
                """))
                test_cases_count, executions_count = table_counts.fetchone()
            
            response_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            
            status = "healthy"
            if response_time > 1000:  # > 1 second
                status = "warning"
            if active_connections / max_connections > 0.8:
                status = "warning"
            
            return {
                "status": status,
                "response_time_ms": round(response_time, 2),
                "database_size_mb": round(db_size / (1024 * 1024), 2),
                "active_connections": active_connections,
                "max_connections": max_connections,
                "connection_usage_percent": round((active_connections / max_connections) * 100, 1),
                "tables": {
                    "test_cases": test_cases_count,
                    "test_executions": executions_count
                }
            }
            
        except Exception as e:
            return {
                "status": "critical",
                "error": str(e)
            }
    
    async def _check_redis(self) -> Dict[str, Any]:
        """Check Redis cache connectivity and stats."""
        try:
            import redis.asyncio as redis
            
            start_time = datetime.utcnow()
            
            # Connect to Redis
            redis_client = redis.from_url(settings.REDIS_URL or "redis://redis:6379")
            
            # Test basic operations
            await redis_client.ping()
            await redis_client.set("health_check", "test", ex=10)
            value = await redis_client.get("health_check")
            
            # Get Redis info
            info = await redis_client.info()
            
            response_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            
            status = "healthy"
            memory_usage = info.get('used_memory', 0) / info.get('maxmemory', 1)
            if memory_usage > 0.8:
                status = "warning"
            
            return {
                "status": status,
                "response_time_ms": round(response_time, 2),
                "memory_usage_mb": round(info.get('used_memory', 0) / (1024 * 1024), 2),
                "memory_usage_percent": round(memory_usage * 100, 1),
                "connected_clients": info.get('connected_clients', 0),
                "keyspace_hits": info.get('keyspace_hits', 0),
                "keyspace_misses": info.get('keyspace_misses', 0)
            }
            
        except Exception as e:
            return {
                "status": "optional",  # Redis is optional
                "error": str(e)
            }
    
    async def _check_selenium(self) -> Dict[str, Any]:
        """Check Selenium Grid connectivity and capacity."""
        try:
            return await webdriver_manager.health_check()
        except Exception as e:
            return {
                "status": "critical",
                "error": str(e)
            }
    
    async def _check_openai(self) -> Dict[str, Any]:
        """Check OpenAI API connectivity and quota."""
        try:
            if not settings.OPENAI_API_KEY:
                return {
                    "status": "optional",
                    "message": "OpenAI API key not configured"
                }
            
            # This would check API status and usage
            stats = await openai_client.get_api_usage_stats()
            
            return {
                "status": "healthy",
                **stats
            }
            
        except Exception as e:
            return {
                "status": "optional",  # OpenAI is optional
                "error": str(e)
            }
    
    async def _check_system_resources(self) -> Dict[str, Any]:
        """Check system resource utilization."""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # Memory usage
            memory = psutil.virtual_memory()
            
            # Process information
            process = psutil.Process()
            process_memory = process.memory_info()
            
            status = "healthy"
            if cpu_percent > 80 or memory.percent > 85:
                status = "warning"
            if cpu_percent > 95 or memory.percent > 95:
                status = "critical"
            
            return {
                "status": status,
                "cpu": {
                    "usage_percent": round(cpu_percent, 1),
                    "count": cpu_count,
                    "load_average": list(psutil.getloadavg()) if hasattr(psutil, 'getloadavg') else None
                },
                "memory": {
                    "total_mb": round(memory.total / (1024 * 1024), 2),
                    "available_mb": round(memory.available / (1024 * 1024), 2),
                    "usage_percent": round(memory.percent, 1),
                    "process_memory_mb": round(process_memory.rss / (1024 * 1024), 2)
                }
            }
            
        except Exception as e:
            return {
                "status": "warning",
                "error": str(e)
            }
    
    async def _check_disk_space(self) -> Dict[str, Any]:
        """Check disk space usage."""
        try:
            disk_usage = psutil.disk_usage('/')
            
            usage_percent = (disk_usage.used / disk_usage.total) * 100
            
            status = "healthy"
            if usage_percent > 80:
                status = "warning"
            if usage_percent > 95:
                status = "critical"
            
            return {
                "status": status,
                "total_gb": round(disk_usage.total / (1024 ** 3), 2),
                "used_gb": round(disk_usage.used / (1024 ** 3), 2),
                "free_gb": round(disk_usage.free / (1024 ** 3), 2),
                "usage_percent": round(usage_percent, 1)
            }
            
        except Exception as e:
            return {
                "status": "warning",
                "error": str(e)
            }
    
    async def _check_network_connectivity(self) -> Dict[str, Any]:
        """Check external network connectivity."""
        try:
            test_urls = [
                "https://api.openai.com",
                "https://www.google.com",
                "https://httpbin.org/ip"
            ]
            
            results = {}
            
            async with aiohttp.ClientSession() as session:
                for url in test_urls:
                    try:
                        start_time = datetime.utcnow()
                        async with session.get(url, timeout=10) as response:
                            response_time = (datetime.utcnow() - start_time).total_seconds() * 1000
                            results[url] = {
                                "status": "reachable",
                                "response_time_ms": round(response_time, 2),
                                "status_code": response.status
                            }
                    except Exception as e:
                        results[url] = {
                            "status": "unreachable",
                            "error": str(e)
                        }
            
            return {
                "status": "healthy",
                "external_connectivity": results
            }
            
        except Exception as e:
            return {
                "status": "warning",
                "error": str(e)
            }

# Global health checker instance
health_checker = HealthChecker()
```

## 📊 Container Monitoring

### Docker Container Statistics

```bash
#!/bin/bash
# scripts/monitor.sh - Container monitoring script

# Function to get container stats
get_container_stats() {
    echo "=== Container Statistics ==="
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
    echo ""
}

# Function to check container health
check_container_health() {
    echo "=== Container Health Status ==="
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "label=com.docker.compose.project=jbtestsuite"
    echo ""
}

# Function to check disk usage
check_disk_usage() {
    echo "=== Docker Disk Usage ==="
    docker system df
    echo ""
}

# Function to check logs for errors
check_error_logs() {
    echo "=== Recent Error Logs ==="
    
    services=("jbts_server" "jbts_client" "jbts_postgres" "jbts_selenium")
    
    for service in "${services[@]}"; do
        echo "--- $service ---"
        docker logs --tail=10 --since=1h "$service" 2>&1 | grep -i "error\|exception\|failed" | head -5 || echo "No recent errors"
        echo ""
    done
}

# Function to perform health checks
perform_health_checks() {
    echo "=== Health Check Results ==="
    
    # Database health
    echo -n "Database: "
    if docker exec jbts_postgres pg_isready -U jbuser -d jbtestsuite &>/dev/null; then
        echo "✅ Healthy"
    else
        echo "❌ Unhealthy"
    fi
    
    # API health
    echo -n "API Server: "
    if curl -f http://localhost:8000/health &>/dev/null; then
        echo "✅ Healthy"
    else
        echo "❌ Unhealthy"
    fi
    
    # Client health
    echo -n "Client: "
    if curl -f http://localhost:3000 &>/dev/null; then
        echo "✅ Healthy"
    else
        echo "❌ Unhealthy"
    fi
    
    # Selenium health
    echo -n "Selenium: "
    if curl -f http://localhost:4444/wd/hub/status &>/dev/null; then
        echo "✅ Healthy"
    else
        echo "❌ Unhealthy"
    fi
    
    echo ""
}

# Main monitoring function
main_monitor() {
    echo "JBTestSuite Infrastructure Monitor"
    echo "=================================="
    echo "$(date)"
    echo ""
    
    get_container_stats
    check_container_health
    perform_health_checks
    check_disk_usage
    check_error_logs
}

# Run monitoring
main_monitor

# Optional: Save to log file
if [[ "$1" == "--log" ]]; then
    main_monitor > "/tmp/jbts_monitor_$(date +%Y%m%d_%H%M%S).log"
    echo "Monitoring report saved to /tmp/"
fi
```

## 🚀 Deployment Strategies

### Blue-Green Deployment Script

```bash
#!/bin/bash
# scripts/deploy.sh - Blue-green deployment script

set -e

PROJECT_NAME="jbtestsuite"
BLUE_COMPOSE="docker-compose.blue.yml"
GREEN_COMPOSE="docker-compose.green.yml"
CURRENT_FILE="/tmp/${PROJECT_NAME}_current_env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Get current environment
get_current_env() {
    if [[ -f "$CURRENT_FILE" ]]; then
        cat "$CURRENT_FILE"
    else
        echo "blue"
    fi
}

# Get next environment
get_next_env() {
    current=$(get_current_env)
    if [[ "$current" == "blue" ]]; then
        echo "green"
    else
        echo "blue"
    fi
}

# Health check function
health_check() {
    local url=$1
    local max_attempts=30
    local attempt=1
    
    log "Performing health check on $url"
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "$url" > /dev/null; then
            log "Health check passed (attempt $attempt)"
            return 0
        fi
        
        log "Health check failed (attempt $attempt/$max_attempts), retrying in 5s..."
        sleep 5
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
}

# Run database migrations
run_migrations() {
    local compose_file=$1
    log "Running database migrations..."
    
    docker-compose -f "$compose_file" exec -T server alembic upgrade head
}

# Deploy new environment
deploy() {
    local current_env=$(get_current_env)
    local next_env=$(get_next_env)
    local next_compose="docker-compose.${next_env}.yml"
    
    log "Starting blue-green deployment"
    log "Current environment: $current_env"
    log "Deploying to: $next_env"
    
    # Build and start new environment
    log "Building and starting $next_env environment..."
    docker-compose -f "$next_compose" up -d --build
    
    # Wait for services to be ready
    sleep 30
    
    # Run migrations on new environment
    run_migrations "$next_compose"
    
    # Health check new environment
    health_check "http://localhost:8000/health"
    health_check "http://localhost:3000"
    
    # Update load balancer to point to new environment
    log "Switching traffic to $next_env environment..."
    # This would update your load balancer configuration
    # For example, updating nginx upstream servers
    
    # Verify traffic switch
    sleep 10
    health_check "http://localhost/health"
    
    # Stop old environment
    if [[ -f "docker-compose.${current_env}.yml" ]]; then
        log "Stopping $current_env environment..."
        docker-compose -f "docker-compose.${current_env}.yml" down
    fi
    
    # Update current environment marker
    echo "$next_env" > "$CURRENT_FILE"
    
    log "Deployment completed successfully!"
    log "New environment: $next_env"
}

# Rollback function
rollback() {
    local current_env=$(get_current_env)
    local previous_env
    
    if [[ "$current_env" == "blue" ]]; then
        previous_env="green"
    else
        previous_env="blue"
    fi
    
    local previous_compose="docker-compose.${previous_env}.yml"
    
    warn "Rolling back to $previous_env environment..."
    
    # Check if previous environment exists
    if ! docker-compose -f "$previous_compose" ps | grep -q "Up"; then
        error "Previous environment ($previous_env) is not running"
    fi
    
    # Switch traffic back
    log "Switching traffic back to $previous_env..."
    # Update load balancer to point back to previous environment
    
    # Verify rollback
    health_check "http://localhost/health"
    
    # Stop current environment
    docker-compose -f "docker-compose.${current_env}.yml" down
    
    # Update environment marker
    echo "$previous_env" > "$CURRENT_FILE"
    
    log "Rollback completed successfully!"
}

# Main command handler
case "$1" in
    deploy)
        deploy
        ;;
    rollback)
        rollback
        ;;
    status)
        current_env=$(get_current_env)
        log "Current environment: $current_env"
        docker-compose -f "docker-compose.${current_env}.yml" ps
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|status}"
        exit 1
        ;;
esac
```

---

*This infrastructure architecture provides a robust, scalable foundation for JBTestSuite with comprehensive monitoring, health checking, and deployment automation.*