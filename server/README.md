# JBTestSuite Server

FastAPI backend server for the JBTestSuite web automation testing platform.

## Features

- REST API with FastAPI
- Async PostgreSQL database with SQLAlchemy 2.0
- Selenium WebDriver integration
- AI-powered test generation with OpenAI
- Real-time WebSocket communication
- Comprehensive test execution and result tracking

## Development

Install dependencies:
```bash
pip install -e ".[dev]"
```

Run server:
```bash
uvicorn src.main:app --reload
```

Run tests:
```bash
pytest
```