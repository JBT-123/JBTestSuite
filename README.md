# JBTestSuite - Full-Stack Web Automation Platform

A complete full-stack application for web automation testing with AI integration.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- (Optional) OpenAI API key for AI features

### Running the Application

1. **Clone and navigate to the project:**
   ```bash
   git clone <repository-url>
   cd JBTestSuite
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key if needed
   ```

3. **Start all services:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - **Client (React)**: http://localhost:3000
   - **API Documentation**: http://localhost:8000/docs
   - **API Health Check**: http://localhost:8000/health
   - **Selenium Grid**: http://localhost:4444 (VNC: http://localhost:7900)

## 🏗️ Architecture

- **Client**: React 18 + TypeScript + TanStack Router + Tailwind CSS
- **Server**: FastAPI + async SQLAlchemy 2.0 + PostgreSQL 16
- **Automation**: Selenium WebDriver with Chromium
- **AI Integration**: OpenAI API (ChatGPT + Vision)
- **Infrastructure**: Docker Compose orchestration

## 📁 Project Structure

```
JBTestSuite/
├── client/                 # React frontend
├── server/                 # FastAPI backend
├── docker-compose.yml      # Multi-service orchestration
├── .env                    # Environment configuration
└── README.md              # This file
```

## ✅ Verification

After starting services with `docker-compose up --build`, verify:

1. **All services are running:**
   ```bash
   docker-compose ps
   # All services should show "healthy" status
   ```

2. **Application endpoints:**
   - Client: http://localhost:3000 (React app)
   - API: http://localhost:8000/health (should return {"status": "healthy"})
   - API Docs: http://localhost:8000/docs (interactive documentation)
   - Selenium: http://localhost:4444 (grid console)
   - VNC: http://localhost:7900 (browser view, password: secret)

3. **Database connectivity:**
   ```bash
   curl http://localhost:8000/api/v1/health/database
   # Should return {"status": "healthy", "database": "connected"}
   ```

## 🛠️ Development

### Services Overview

- **postgres**: PostgreSQL 16 database (port 5432)
- **selenium**: Chromium browser automation (port 4444, VNC 7900)
- **server**: FastAPI backend (port 8000)
- **client**: React frontend (port 3000)

### Health Checks

All services include health checks for reliable startup:

```bash
# Check all service health
docker-compose ps

# View server logs
docker-compose logs -f server

# Check API health
curl http://localhost:8000/health
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://jbuser:jbpass@postgres:5432/jbtestsuite` |
| `SELENIUM_HUB_URL` | Selenium Grid URL | `http://selenium:4444/wd/hub` |
| `OPENAI_API_KEY` | OpenAI API key (optional) | empty |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000,http://127.0.0.1:3000` |

### Development Mode

The setup includes:
- **Hot reloading** for both client and server
- **Volume mounting** for live code changes
- **Debug logging** enabled
- **Database persistence** across restarts

## 📖 Documentation

Comprehensive documentation is available in the `docs/` folder:

### 📚 Getting Started
- **[Installation Guide](docs/installation.md)** - Complete setup instructions
- **[Quick Start Guide](docs/quick-start.md)** - Get running in 5 minutes
- **[Architecture Overview](docs/architecture.md)** - System design and components

### 🛠️ Development
- **[Development Setup](docs/development/setup.md)** - Local development environment
- **[API Documentation](docs/api/README.md)** - Complete REST API reference
- **[Frontend Guide](docs/frontend/README.md)** - React/TypeScript client docs
- **[Backend Guide](docs/backend/README.md)** - FastAPI server documentation

### ✨ Features
- **[Test Management](docs/features/test-management.md)** - Creating and organizing tests
- **[Selenium Integration](docs/features/selenium.md)** - Browser automation
- **[AI Integration](docs/features/ai.md)** - OpenAI-powered testing
- **[Real-time Features](docs/features/websockets.md)** - Live monitoring

### 🚀 Deployment & Troubleshooting
- **[Docker Guide](docs/deployment/docker.md)** - Container deployment
- **[Production Setup](docs/deployment/production.md)** - Production configuration
- **[Common Issues](docs/troubleshooting/common-issues.md)** - Troubleshooting guide
- **[FAQ](docs/troubleshooting/faq.md)** - Frequently asked questions

### 🎯 Interactive API Documentation
Once running, visit http://localhost:8000/docs for interactive API documentation.

## 🎯 Project Roadmap

This is Phase 1 foundation setup. See `/claude/plans/` for implementation roadmap:

- **Phase 2**: Core test management features
- **Phase 3**: Selenium integration and execution
- **Phase 4**: AI-powered test generation
- **Phase 5**: Real-time monitoring and WebSockets

## 🐛 Quick Troubleshooting

### Common Issues

1. **Services won't start**: Check Docker is running and ports aren't in use
2. **Database connection issues**: Ensure PostgreSQL service is healthy
3. **Permission errors**: Check file permissions and Docker daemon access

### Useful Commands

```bash
# Stop all services
docker-compose down

# Rebuild specific service
docker-compose up --build server

# View service logs
docker-compose logs -f [service-name]

# Reset everything (caution: deletes data)
docker-compose down -v && docker-compose up --build
```

## 📝 License

[Add your license information here]