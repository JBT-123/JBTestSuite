# Development Setup

Complete guide for setting up a local development environment for JBTestSuite.

## 🎯 Prerequisites

Before starting, ensure you have:
- **Docker Desktop** installed and running
- **Git** for version control
- **Code Editor** (VS Code recommended)
- **Node.js 18+** (for client-side development)
- **Python 3.11+** (for server-side development)

## 🚀 Quick Development Setup

### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd JBTestSuite

# Create environment file
cp .env.example .env

# Edit .env with your preferences
# Add OpenAI API key if you want AI features
```

### 2. Start Development Environment
```bash
# Start all services in development mode
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

### 3. Access Development Services
- **Frontend**: http://localhost:3000 (React dev server with hot reload)
- **Backend**: http://localhost:8000 (FastAPI with auto-reload)
- **API Docs**: http://localhost:8000/docs (Interactive documentation)
- **Database**: localhost:5432 (PostgreSQL with persistent data)
- **Selenium**: http://localhost:4444 (WebDriver grid)
- **VNC**: http://localhost:7900 (Browser view, password: `secret`)

## 🏗️ Architecture for Developers

### Project Structure
```
JBTestSuite/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── routes/         # File-based routing pages
│   │   ├── types/          # TypeScript definitions
│   │   ├── utils/          # Utility functions
│   │   └── api/            # API client layer
│   ├── Dockerfile          # Client container config
│   └── package.json        # Dependencies and scripts
├── server/                 # FastAPI backend
│   ├── src/
│   │   ├── api/            # FastAPI routers
│   │   ├── core/           # Core configuration
│   │   ├── models/         # SQLAlchemy models
│   │   ├── services/       # Business logic
│   │   └── ai/             # AI integration
│   ├── alembic/            # Database migrations
│   ├── Dockerfile          # Server container config
│   └── pyproject.toml      # Python dependencies
├── docker-compose.yml      # Development orchestration
└── .env                    # Environment configuration
```

### Development Workflow
```mermaid
flowchart LR
    Dev[Developer] --> Code[Code Changes]
    Code --> Client[Client Auto-reload]
    Code --> Server[Server Auto-reload]
    Client --> Browser[Browser Update]
    Server --> API[API Update]
    API --> DB[(Database)]
    API --> Selenium[Selenium Grid]
```

## 💻 Frontend Development

### Technology Stack
- **React 18** with TypeScript
- **TanStack Router** for file-based routing
- **TanStack Query** for server state management
- **Tailwind CSS** for styling
- **Vite** for build tooling

### Development Commands
```bash
cd client

# Install dependencies
npm install

# Start development server (if not using Docker)
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint and format
npm run lint
npm run format
npm run check          # Format + lint fix
```

### Key Development Patterns

#### Component Structure
```typescript
// components/TestCaseCard.tsx
import { TestCaseListResponse } from '@/types'

interface TestCaseCardProps {
  testCase: TestCaseListResponse
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function TestCaseCard({ testCase, onEdit, onDelete }: TestCaseCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold">{testCase.name}</h3>
      <p className="text-gray-600">{testCase.description}</p>
      {/* Component content */}
    </div>
  )
}
```

#### Custom Hooks
```typescript
// hooks/useTestCases.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { testCasesApi } from '@/api'

export function useTestCases() {
  const queryClient = useQueryClient()

  const {
    data: testCases,
    isLoading,
    error
  } = useQuery({
    queryKey: ['testCases'],
    queryFn: testCasesApi.getAll
  })

  const createMutation = useMutation({
    mutationFn: testCasesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testCases'] })
    }
  })

  return {
    testCases,
    isLoading,
    error,
    createTestCase: createMutation.mutate
  }
}
```

#### File-based Routing
```typescript
// routes/tests.tsx - Main tests page
export function TestsPage() {
  const { testCases, isLoading } = useTestCases()
  
  if (isLoading) return <Loading />
  
  return (
    <div>
      <h1>Test Cases</h1>
      <TestCaseList testCases={testCases} />
    </div>
  )
}

// routes/tests.$testId.tsx - Test detail page  
export function TestDetailPage() {
  const { testId } = useParams()
  const { testCase } = useTestCase(testId)
  
  return <TestCaseDetail testCase={testCase} />
}
```

### Styling Guidelines
- Use Tailwind CSS utility classes
- Create reusable component variants
- Maintain responsive design principles
- Follow accessibility best practices

## 🖥️ Backend Development

### Technology Stack
- **FastAPI** with async/await
- **SQLAlchemy 2.0** async ORM
- **Alembic** for database migrations
- **Pydantic** for data validation
- **PostgreSQL 16** database

### Development Commands
```bash
cd server

# Create virtual environment (optional if using Docker)
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install -e ".[dev]"

# Start server (if not using Docker)
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest

# Code formatting
black src/
isort src/
mypy src/

# Database operations
alembic upgrade head                                    # Apply migrations
alembic revision --autogenerate -m "description"       # Create migration
```

### Key Development Patterns

#### API Endpoint Structure
```python
# api/v1/tests.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_async_session
from src.models import TestCase
from src.api.schemas import TestCaseCreate, TestCaseResponse

router = APIRouter(prefix="/tests", tags=["tests"])

@router.post("/", response_model=TestCaseResponse)
async def create_test(
    test_data: TestCaseCreate,
    session: AsyncSession = Depends(get_async_session)
):
    test_case = TestCase(**test_data.model_dump())
    session.add(test_case)
    await session.commit()
    await session.refresh(test_case)
    return TestCaseResponse.model_validate(test_case)
```

#### Database Model Structure
```python
# models/test_definition.py
from sqlalchemy import Column, String, Boolean, Integer, Text, ARRAY
from sqlalchemy.orm import relationship
from src.models.base import BaseModel

class TestCase(BaseModel):
    __tablename__ = "test_cases"
    
    name = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="draft")
    priority = Column(String, default="medium")
    tags = Column(ARRAY(String), default=[])
    is_automated = Column(Boolean, default=False)
    retry_count = Column(Integer, default=0)
    
    # Relationship
    steps = relationship("TestStep", back_populates="test_case")
```

#### Pydantic Schema Structure
```python
# api/schemas/test_definition.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class TestCaseBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "draft"
    priority: Optional[str] = "medium"
    tags: Optional[List[str]] = []
    is_automated: bool = False
    retry_count: int = 0

class TestCaseCreate(TestCaseBase):
    pass

class TestCaseResponse(TestCaseBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
```

### Database Development

#### Migration Workflow
```bash
# Create a new migration
docker-compose exec server alembic revision --autogenerate -m "add test_executions table"

# Review the generated migration file
# Edit if necessary

# Apply migration
docker-compose exec server alembic upgrade head

# Check migration status
docker-compose exec server alembic current
```

#### Database Connection
```python
# core/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(engine, class_=AsyncSession)

async def get_async_session():
    async with SessionLocal() as session:
        yield session
```

## 🧪 Testing

### Frontend Testing
```bash
cd client

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Backend Testing
```bash
cd server

# Run all tests
pytest

# Run with coverage
pytest --cov=src

# Run specific test file
pytest tests/test_api_tests.py

# Run tests with verbose output
pytest -v
```

### Integration Testing
```bash
# Test the full stack
docker-compose exec server pytest tests/test_integration.py
```

## 🔧 Development Tools

### VS Code Extensions
```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.black-formatter",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json"
  ]
}
```

### VS Code Settings
```json
{
  "python.defaultInterpreterPath": "./server/venv/bin/python",
  "python.formatting.provider": "black",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "typescript",
    "typescriptreact": "typescriptreact"
  }
}
```

## 🐛 Debugging

### Frontend Debugging
```javascript
// Use React Developer Tools
// Enable TanStack Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <div>
      {/* Your app */}
      <ReactQueryDevtools initialIsOpen={false} />
    </div>
  )
}
```

### Backend Debugging
```python
# Use debugging breakpoints
import debugpy
debugpy.listen(5678)

# Add breakpoint
debugpy.breakpoint()
```

### Docker Debugging
```bash
# View logs for specific service
docker-compose logs -f server
docker-compose logs -f client

# Access container shell
docker-compose exec server bash
docker-compose exec client sh

# Check container stats
docker stats
```

## 🌐 Environment Configuration

### Development Environment Variables
```env
# .env file
DATABASE_URL=postgresql+asyncpg://jbuser:jbpass@postgres:5432/jbtestsuite
ENVIRONMENT=development
DEBUG=true
SECRET_KEY=dev-secret-key-change-in-production

# Optional: AI features
OPENAI_API_KEY=your_api_key_here

# CORS settings
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Selenium
SELENIUM_HUB_URL=http://selenium:4444/wd/hub
```

### Docker Compose Override
Create `docker-compose.override.yml` for local customization:
```yaml
version: '3.8'

services:
  server:
    environment:
      - DEBUG=true
      - LOG_LEVEL=debug
    volumes:
      - ./server/src:/app/src
  
  client:
    volumes:
      - ./client/src:/app/src
      - ./client/public:/app/public
```

## 🔄 Hot Reload Development

### Frontend Hot Reload
- Vite automatically reloads on file changes
- Component state is preserved when possible
- Fast refresh for React components

### Backend Hot Reload
- FastAPI auto-reloads on Python file changes
- Database connections are maintained
- API endpoints update immediately

## 📊 Performance Monitoring

### Development Metrics
```bash
# Monitor resource usage
docker stats

# Check database performance
docker-compose exec postgres psql -U jbuser -d jbtestsuite -c "\
  SELECT query, mean_exec_time, calls \
  FROM pg_stat_statements \
  ORDER BY mean_exec_time DESC \
  LIMIT 10;"
```

### Profiling
```python
# Backend profiling
import cProfile
cProfile.run('your_function()')

# Database query analysis
from sqlalchemy import event
event.listen(engine, "before_cursor_execute", log_queries)
```

## 🔒 Development Security

### Environment Security
- Never commit `.env` files
- Use different secrets for development
- Keep API keys secure
- Regularly rotate development credentials

### Code Security
- Run security linters
- Validate all inputs
- Use parameterized queries
- Implement proper error handling

## 🚀 Next Steps

1. **Set up your development environment** using the quick setup
2. **Explore the codebase** and understand the architecture
3. **Make your first changes** and see hot reload in action
4. **Run tests** to ensure everything works correctly
5. **Read the [API Documentation](../api/README.md)** for detailed endpoint information

---

*Happy coding! The development environment is designed to be productive and efficient. If you encounter issues, check the [Troubleshooting Guide](../troubleshooting/common-issues.md).*