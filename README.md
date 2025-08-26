# JBTestSuite

**Full-Stack Web Automation Platform with AI Integration**

A complete full-stack application for web automation testing featuring real-time WebSocket updates, AI-powered test analysis, and comprehensive test management capabilities.

## 🚀 Quick Start

### 1. Environment Setup (Required)

Before running the application, you must configure environment variables:

```bash
# Copy the example environment file
cp .env.example .env
```

Edit the `.env` file with your actual values:

```bash
# Required: Set a secure database password
POSTGRES_PASSWORD=your-secure-database-password

# Required: Add your OpenAI API key from https://platform.openai.com/api-keys
OPENAI_API_KEY=your-openai-api-key

# Recommended: Generate a secure secret key
SECRET_KEY=your-secret-key
```

**Generate secure values:**
```bash
# Generate secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate database password
python -c "import secrets; print(secrets.token_urlsafe(16))"
```

### 2. Run with Docker

```bash
# Build and start all services
docker-compose up --build
```

### 3. Access the Application

- **Client (React)**: [http://localhost:3000](http://localhost:3000)
- **Server API**: [http://localhost:8000](http://localhost:8000)
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Selenium Grid**: [http://localhost:4444](http://localhost:4444)

## 🛑 Stop Services

```bash
docker-compose down
```

## ✅ Verify Setup Success

After running `docker-compose up --build`, verify everything is working:

### 1. Check All Services Are Running
```bash
docker-compose ps
```
You should see 4 services running: `client`, `server`, `postgres`, `selenium`

### 2. Test API Endpoints
```bash
# Health check
curl http://localhost:8000/health
# Should return: {"status":"healthy"}

# Test cases endpoint  
curl http://localhost:8000/api/test-cases/
# Should return: []
```

### 3. Access the Application
- **Frontend**: [http://localhost:3000](http://localhost:3000) - Should show JBTestSuite interface
- **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs) - Should show FastAPI documentation
- **Selenium Grid**: [http://localhost:4444](http://localhost:4444) - Should show Selenium Grid console

### 4. Test Basic Functionality
1. Open [http://localhost:3000](http://localhost:3000)
2. Click "Create Test Case"
3. Fill in test details (e.g., Name: "Google Test", URL: "https://google.com")
4. Click "Create" - should create successfully
5. Click "Execute" - should show real-time execution updates
6. Check execution log shows progress and completion

**✅ If all steps work, your setup is successful!**

## 📋 Features

- **🔄 Real-time test execution** with WebSocket updates
- **🤖 AI-powered test analysis** using OpenAI GPT
- **📸 Screenshot capture** during test execution
- **🌐 Selenium browser automation** 
- **📊 Comprehensive test management** with execution history
- **🔒 Secure configuration** with environment variables
- **🐳 Docker containerized** for easy deployment

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + TanStack Router + TanStack Query
- **Backend**: FastAPI + SQLAlchemy 2.0 + PostgreSQL 16
- **Automation**: Selenium WebDriver + Chromium
- **AI**: OpenAI GPT-4 + Vision API
- **Real-time**: WebSockets for live updates
- **Infrastructure**: Docker + Docker Compose

## 📖 Documentation

- **[Environment Setup](#-quick-start)** - Environment configuration is covered in Quick Start section above
- **[Development Guide](CLAUDE.md)** - Complete development documentation
- **[API Documentation](http://localhost:8000/docs)** - Interactive API docs (when running)

## 🔐 Security

- Environment variables for all sensitive configuration
- Automatic secret key generation for development
- No hardcoded credentials in source code
- Production-ready security practices

## 📁 Project Structure

```
JBTestSuite/
├── client/                 # React frontend
├── server/                 # FastAPI backend
├── .env.example           # Environment configuration template
├── docker-compose.yml     # Multi-service orchestration
└── README.md              # This file
```

## 🚨 Troubleshooting

### Environment Variables Not Loading
1. Ensure `.env` file exists in the root directory
2. Check variable names match `.env.example` exactly
3. Restart Docker containers: `docker-compose down && docker-compose up --build`

### Database Connection Issues
1. Verify `POSTGRES_PASSWORD` is set in `.env`
2. Check Docker containers are running: `docker-compose ps`
3. View logs: `docker-compose logs postgres`
4. **If database tables don't exist**, run: `docker-compose exec server alembic upgrade head`
5. **For fresh setup**, use: `docker-compose down -v && docker-compose up --build`

### Application Not Loading
1. **Check all services are running**: `docker-compose ps`
2. **View service logs**: `docker-compose logs [service-name]`
3. **Restart specific service**: `docker-compose restart server`
4. **Full restart**: `docker-compose down && docker-compose up`

### WebSocket Issues (Real-time Updates Not Working)
1. Check browser console for WebSocket connection errors
2. Verify server logs show: `"WebSocket /api/ws/test_updates" [accepted]`
3. Test WebSocket manually: Visit `ws://localhost:8000/api/ws/test_updates`

### Test Execution Issues
1. **Selenium not working**: Check `docker-compose logs selenium`
2. **Screenshots not saving**: Check `server/artifacts/` directory permissions
3. **Tests get stuck**: Check if Selenium Grid is accessible at `http://localhost:4444`

### OpenAI API Issues
1. Verify `OPENAI_API_KEY` is valid and has sufficient credits
2. Check API key format (should start with `sk-`)
3. View server logs: `docker-compose logs server`
4. **Note**: AI features will show error messages if API key is invalid, but basic testing still works

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
