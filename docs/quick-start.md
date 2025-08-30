# Quick Start Guide

Get JBTestSuite up and running in less than 5 minutes! This guide assumes you have Docker installed.

## 🚀 5-Minute Setup

### Step 1: Clone and Navigate
```bash
git clone <repository-url>
cd JBTestSuite
```

### Step 2: Configure Environment (Optional)
```bash
# Copy environment template
cp .env.example .env

# Edit .env to add OpenAI API key (optional for AI features)
# OPENAI_API_KEY=your_api_key_here
```

### Step 3: Start Everything
```bash
docker-compose up --build
```

### Step 4: Verify It's Working
Open these URLs in your browser:
- 🌐 **Application**: http://localhost:3000
- 📚 **API Docs**: http://localhost:8000/docs
- ✅ **Health Check**: http://localhost:8000/health

That's it! JBTestSuite is now running locally.

## 🎯 First Steps

### Create Your First Test Case

1. **Open the application**: Navigate to http://localhost:3000
2. **Click "New Test"**: Use the primary action button
3. **Fill in basic details**:
   ```
   Name: Login Test
   Description: Test user login functionality
   Category: Authentication
   Priority: High
   ```
4. **Add test steps**:
   - Step 1: Navigate to login page
   - Step 2: Enter username
   - Step 3: Enter password
   - Step 4: Click login button
   - Step 5: Verify successful login
5. **Save the test case**

### Explore the API

Visit http://localhost:8000/docs to explore the interactive API documentation:

1. **View available endpoints**: Browse the automatically generated API docs
2. **Try it out**: Use the "Try it out" button to test endpoints
3. **Example API call**:
   ```bash
   curl -X GET "http://localhost:8000/api/v1/tests/" \
     -H "accept: application/json"
   ```

### Monitor with Selenium Grid

Check browser automation capabilities:
1. **Grid Console**: http://localhost:4444
2. **VNC Viewer**: http://localhost:7900 (password: `secret`)
3. Watch browser automation in real-time during test execution

## 🔧 Key Features to Try

### 1. Test Management
- ✅ Create, edit, and delete test cases
- 🏷️ Organize with categories and tags
- 📊 Filter and search functionality
- 📝 Step-by-step test definitions

### 2. Real-time Updates
- 🔄 Live progress monitoring
- 📡 WebSocket-powered updates
- 🔔 Instant notifications

### 3. Browser Automation (Selenium)
- 🌐 Automated web testing
- 📸 Screenshot capture
- 🖱️ Element interactions
- ⏱️ Configurable timeouts

### 4. AI Integration (Optional)
If you added an OpenAI API key:
- 🤖 AI-powered test generation
- 👁️ Screenshot analysis with ChatGPT Vision
- 💡 Intelligent test suggestions

## 📊 Understanding the Interface

### Main Navigation
```
┌─ Tests ──────────────────────────┐
│  📋 Test Cases List              │
│  ➕ Create New Test              │
│  🔍 Search & Filter              │
│  📊 Execution History            │
└──────────────────────────────────┘
```

### Test Case Details
```
Test Case: "Login Test"
├── Basic Info (Name, Description, Priority)
├── Test Steps (Sequential actions)
├── Configuration (Timeouts, Retry logic)
└── Execution History (Past runs)
```

### API Endpoints Overview
```
GET    /api/v1/tests/           # List test cases
POST   /api/v1/tests/           # Create test case  
GET    /api/v1/tests/{id}       # Get specific test
PUT    /api/v1/tests/{id}       # Update test case
DELETE /api/v1/tests/{id}       # Delete test case
GET    /api/v1/tests/search     # Search test cases
```

## 🛠️ Development Workflow

### Making Changes

1. **Frontend changes**: Edit files in `client/src/`
   ```bash
   # Changes auto-reload in development mode
   # Visit http://localhost:3000 to see updates
   ```

2. **Backend changes**: Edit files in `server/src/`
   ```bash
   # FastAPI auto-reloads on file changes
   # API updates immediately available
   ```

3. **Database changes**: Create migrations
   ```bash
   docker-compose exec server alembic revision --autogenerate -m "description"
   docker-compose exec server alembic upgrade head
   ```

### Useful Commands

```bash
# View service logs
docker-compose logs -f server    # Backend logs
docker-compose logs -f client    # Frontend logs
docker-compose logs -f postgres  # Database logs

# Execute commands in containers
docker-compose exec server bash  # Access server container
docker-compose exec client sh    # Access client container

# Stop services
docker-compose down              # Stop all services
docker-compose down -v           # Stop and remove volumes
```

## 🎯 Common Use Cases

### Test Case Creation Patterns

1. **Simple UI Test**:
   - Navigate to page
   - Interact with elements
   - Verify results

2. **API Integration Test**:
   - Send HTTP requests
   - Validate responses
   - Check data persistence

3. **End-to-End Workflow**:
   - Multiple page navigation
   - Form submissions
   - Complex user journeys

### Data Organization

```
Categories:
├── Authentication (Login, Logout, Registration)
├── Core Features (CRUD operations)
├── Integration (API calls, Third-party)
└── Regression (Bug fixes, Edge cases)

Priority Levels:
├── Critical (Must pass for release)
├── High (Important functionality)  
├── Medium (Standard features)
└── Low (Nice-to-have features)
```

## 🚦 Next Steps

### Immediate Actions
1. ✅ Create 3-5 test cases covering your main features
2. 🏷️ Set up your category and tagging system
3. 🔧 Configure environment variables for your needs
4. 📖 Review the [API Documentation](api/README.md)

### Short-term Goals
- 📚 Read the [Architecture Overview](architecture.md)
- 🛠️ Set up [Development Environment](development/setup.md)
- 🎯 Explore [Advanced Features](features/)
- 🚀 Plan your [Production Deployment](deployment/production.md)

### Long-term Integration
- 🔄 Set up CI/CD pipelines
- 📊 Configure monitoring and analytics  
- 🤖 Integrate AI-powered testing
- 📈 Scale for team collaboration

## ⚡ Performance Tips

### Development
- Use `docker-compose up -d` to run in background
- Keep Docker Desktop running for best performance
- Allocate sufficient memory to Docker (8GB+ recommended)

### Production
- Use environment-specific configuration
- Enable production optimizations
- Set up proper monitoring
- Configure automated backups

## 🆘 Need Help?

### Quick Troubleshooting
- **Port conflicts**: Change ports in `docker-compose.yml`
- **Permission issues**: Run with `sudo` or fix Docker permissions
- **Memory issues**: Increase Docker memory allocation
- **Build failures**: Try `docker system prune -a` and rebuild

### Documentation Resources
- 📋 [Installation Guide](installation.md) - Detailed setup instructions
- 🏗️ [Architecture](architecture.md) - System design overview
- 🔧 [Development Setup](development/setup.md) - Development environment
- 🐛 [Troubleshooting](troubleshooting/common-issues.md) - Common problems

### Community Support
- 📝 Create issues for bugs or questions
- 💡 Submit feature requests
- 🤝 Contribute improvements
- 📖 Help improve documentation

---

*Ready to build amazing automated tests? Start creating your first test case now! 🚀*