# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# JBTestSuite - Full-Stack Web Automation Platform

A complete full-stack application for web automation testing with AI integration.

## Architecture Overview

```mermaid
flowchart LR
  subgraph Client["Client (React + TS)"]
    R[TanStack Router]
    Q[TanStack Query]
    WS[WebSocket]
  end

  subgraph Server["FastAPI (Python)"]
    API[REST Routers]
    ORCH[Run Orchestrator]
    SEL[Selenium Controller]
    LLM[ChatGPT / ChatGPT Vision Adapters]
    FS[[Artifacts Volume]]
  end

  subgraph Data["Data Layer"]
    PG[(PostgreSQL 16)]
    MIG[Alembic Migrations]
  end

  subgraph Selenium["Selenium"]
    CHROME[selenium/standalone-chromium]
  end

  %% Client ⇄ Server
  R --> API
  Q --> API
  WS <--> API

  %% Server internals
  API --> ORCH
  ORCH --> SEL
  SEL <--> CHROME
  ORCH --> FS

  %% DB connections
  API --> PG
  ORCH --> PG
  MIG --> PG

  %% LLM adapters
  LLM <--> ORCH
```

## Project Structure

```
JBTestSuite/
├── client/
│   ├── src/
│   │   ├── routes/          # File-based routing
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── Dockerfile
│   └── package.json
├── server/
│   ├── src/
│   │   ├── api/             # FastAPI routers
│   │   ├── core/            # Core configuration
│   │   ├── models/          # SQLAlchemy models
│   │   ├── services/        # Business logic
│   │   ├── selenium/        # Browser automation
│   │   └── ai/              # AI integration
│   ├── alembic/             # Database migrations
│   ├── Dockerfile
│   └── pyproject.toml
├── docker-compose.yml       # Multi-service orchestration
└── README.md
```

## Development Commands

### Docker (Primary Development Method)
```bash
# Build and start all services (Client, Server, PostgreSQL, Selenium)
docker-compose up --build

# Stop all services
docker-compose down

# View logs for specific service
docker-compose logs -f [client|server|postgres|selenium]
```

Services run on:
- Client: http://localhost:3000
- Server API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432
- Selenium Grid: http://localhost:4444

### Client (React/TypeScript)
From `client/` directory:
```bash
# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Linting and formatting
npm run lint
npm run format
npm run check  # Format and fix lint issues
```

### Server (Python/FastAPI)
From `server/` directory:
```bash
# Install with dev dependencies
pip install -e ".[dev]"

# Start FastAPI server
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

# Code quality tools
black src/           # Format code
isort src/           # Sort imports
mypy src/            # Type checking
pytest               # Run tests

# Database migrations
alembic upgrade head # Apply latest migrations
alembic revision --autogenerate -m "description"  # Create new migration
```

## Core Features Implementation

### 1. Test Management
- CRUD operations for test cases with SQLAlchemy models
- Test case organization and categorization
- Test execution history and results tracking
- RESTful API endpoints for all test operations

### 2. Selenium Integration
- WebDriver management with selenium/standalone-chromium
- Screenshot capture during test execution
- Element interaction and validation methods
- Browser session handling and cleanup

### 3. AI Integration
- OpenAI API integration for test case generation
- ChatGPT Vision for screenshot analysis
- AI-powered test result interpretation
- Structured prompts for consistent AI responses

### 4. Real-time Features
- WebSocket connections for live test monitoring
- Real-time progress updates during execution
- Live screenshot streaming
- Connection management and broadcasting

### 5. Data Management
- PostgreSQL 16 with async SQLAlchemy 2.0
- Alembic migrations for schema versioning
- Proper database models and relationships
- Connection pooling and session management

## Technology Stack

### Server (FastAPI + Python)
- **FastAPI** with async/await patterns and dependency injection
- **SQLAlchemy 2.0** with async sessions
- **Alembic** for database migrations
- **PostgreSQL 16** as primary database
- **Selenium WebDriver** for browser automation
- **OpenAI API** integration (ChatGPT + Vision)
- **WebSockets** for real-time communication
- **Pydantic** models for data validation

### Client (React + TypeScript)
- **React 18+** with modern hooks and patterns
- **TanStack Router** for file-based routing
- **TanStack Query** for server state management
- **WebSocket** client for real-time updates
- **Tailwind CSS** for styling
- **TypeScript** with strict configuration

### Infrastructure
- **Docker** containers for all services
- **Docker Compose** for development orchestration
- **PostgreSQL** container with persistent storage
- **Selenium Grid** (standalone-chromium)
- **Volume mounting** for artifacts and development

## Environment Variables

Required environment variables:
```env
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/jbtestsuite

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Selenium
SELENIUM_HUB_URL=http://selenium:4444/wd/hub

# Application
ENVIRONMENT=development
SECRET_KEY=your_secret_key
```

## Code Conventions

### TypeScript/React
- Use TanStack Router file-based routing patterns
- Leverage TanStack Query for all server state
- Implement proper TypeScript types for all API responses
- Follow React best practices with custom hooks
- Use Tailwind CSS utility classes
- Prettier config: no semicolons, single quotes, trailing commas

### Python/FastAPI
- Use async/await patterns throughout
- SQLAlchemy 2.0 declarative syntax with async sessions
- Pydantic models for request/response validation
- Dependency injection for database sessions
- Proper error handling with HTTP status codes
- Use black, isort, and mypy for code quality

### Database
- Use Alembic for all schema changes
- Follow naming conventions for tables and columns
- Implement proper indexes for query performance
- Use database constraints for data integrity

## Key Dependencies

### Client
- `@tanstack/react-router`: File-based routing with type safety
- `@tanstack/react-query`: Server state management
- `tailwindcss`: Utility-first CSS framework
- `vitest`: Fast unit testing framework

### Server
- `fastapi[standard]`: Web framework with automatic docs
- `sqlalchemy[asyncio]`: Async database ORM
- `alembic`: Database migration tool
- `pydantic`: Data validation and serialization
- `selenium`: Browser automation
- `openai`: AI integration
- `websockets`: Real-time communication