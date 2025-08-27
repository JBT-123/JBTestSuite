# Installation Guide

This guide will help you set up JBTestSuite on your local machine or server environment.

## 📋 Prerequisites

### System Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+ recommended)
- **RAM**: Minimum 8GB, recommended 16GB+
- **Storage**: At least 10GB free space
- **Network**: Internet connection for downloading dependencies and AI features

### Required Software

#### Docker & Docker Compose (Recommended)
- **Docker Desktop**: Latest stable version
  - [Download for Windows](https://docs.docker.com/desktop/install/windows-install/)
  - [Download for macOS](https://docs.docker.com/desktop/install/mac-install/)
  - [Download for Linux](https://docs.docker.com/desktop/install/linux-install/)
- **Docker Compose**: Included with Docker Desktop, or install separately for Linux

#### Alternative: Manual Installation
If you prefer not to use Docker:
- **Node.js**: Version 18.0 or higher
- **Python**: Version 3.11 or higher
- **PostgreSQL**: Version 16 or higher
- **Git**: For cloning the repository

## 🚀 Quick Installation (Docker - Recommended)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd JBTestSuite
```

### 2. Environment Setup
```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment file with your settings
# Required: Add your OpenAI API key for AI features (optional)
```

### 3. Start All Services
```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

### 4. Verify Installation
Visit these URLs to confirm everything is working:
- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **API Health Check**: http://localhost:8000/health
- **Selenium Grid**: http://localhost:4444
- **VNC Viewer**: http://localhost:7900 (password: `secret`)

## 🛠️ Manual Installation

### 1. Database Setup (PostgreSQL)

#### Install PostgreSQL 16
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-16 postgresql-contrib

# macOS (with Homebrew)
brew install postgresql@16

# Windows: Download from https://www.postgresql.org/download/windows/
```

#### Create Database
```sql
-- Connect to PostgreSQL as superuser
sudo -u postgres psql

-- Create database and user
CREATE DATABASE jbtestsuite;
CREATE USER jbuser WITH PASSWORD 'jbpass';
GRANT ALL PRIVILEGES ON DATABASE jbtestsuite TO jbuser;
\q
```

### 2. Backend Setup (FastAPI)

```bash
cd server

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Set environment variables
export DATABASE_URL="postgresql+asyncpg://jbuser:jbpass@localhost:5432/jbtestsuite"
export OPENAI_API_KEY="your_openai_api_key_here"  # Optional

# Run database migrations
alembic upgrade head

# Start the server
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup (React)

```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Selenium Setup (Optional)

For automated browser testing, you'll need Selenium WebDriver:

```bash
# Install Chrome/Chromium browser
# Ubuntu:
sudo apt install chromium-browser
# macOS:
brew install --cask google-chrome

# Install ChromeDriver
# Option 1: Use webdriver-manager (Python)
pip install webdriver-manager

# Option 2: Download manually from:
# https://chromedriver.chromium.org/
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
DATABASE_URL=postgresql+asyncpg://jbuser:jbpass@postgres:5432/jbtestsuite

# API Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production
ENVIRONMENT=development
DEBUG=true

# CORS Settings
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# AI Integration (Optional)
OPENAI_API_KEY=your_openai_api_key_here

# Selenium Configuration
SELENIUM_HUB_URL=http://selenium:4444/wd/hub

# Application Settings
MAX_UPLOAD_SIZE=10485760  # 10MB
RATE_LIMIT_PER_MINUTE=100
```

### Docker Compose Override

For development customization, create `docker-compose.override.yml`:

```yaml
version: '3.8'

services:
  server:
    environment:
      - DEBUG=true
      - LOG_LEVEL=debug
    ports:
      - "8001:8000"  # Alternative port
    
  client:
    environment:
      - VITE_API_URL=http://localhost:8001
    volumes:
      - ./client/src:/app/src:ro  # Live reload
```

## ✅ Verification

### Health Checks

#### API Health Check
```bash
curl http://localhost:8000/health
# Expected response: {"status": "healthy"}
```

#### Database Connectivity
```bash
curl http://localhost:8000/api/v1/health/database
# Expected response: {"status": "healthy", "database": "connected"}
```

#### Frontend Accessibility
Visit http://localhost:3000 and verify:
- Page loads without errors
- Navigation works correctly
- API calls are successful (check browser dev tools)

### Service Status
```bash
# Check all Docker services
docker-compose ps

# Expected output showing all services as "healthy" or "running"
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 3000, 8000, or 5432
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or change ports in docker-compose.yml
```

#### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS

# Test connection manually
psql -h localhost -U jbuser -d jbtestsuite
```

#### Docker Issues
```bash
# Reset Docker environment
docker-compose down -v
docker system prune -a
docker-compose up --build

# Check Docker daemon
docker version
docker-compose --version
```

#### Permission Issues (Linux)
```bash
# Fix Docker permissions
sudo usermod -aG docker $USER
# Log out and back in

# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x scripts/*.sh
```

### Performance Issues

#### Slow Database Queries
```bash
# Check database performance
docker-compose exec postgres psql -U jbuser -d jbtestsuite -c "\
  SELECT query, mean_exec_time, calls \
  FROM pg_stat_statements \
  ORDER BY mean_exec_time DESC \
  LIMIT 10;"
```

#### High Memory Usage
```bash
# Monitor resource usage
docker stats

# Adjust memory limits in docker-compose.yml if needed
```

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker-compose up --build

# Run any new migrations
docker-compose exec server alembic upgrade head
```

### Database Maintenance
```bash
# Backup database
docker-compose exec postgres pg_dump -U jbuser jbtestsuite > backup.sql

# Restore database
docker-compose exec -T postgres psql -U jbuser jbtestsuite < backup.sql
```

## 🌐 Production Deployment

For production deployment, see the [Production Setup Guide](deployment/production.md).

---

*Need help? Check the [FAQ](troubleshooting/faq.md) or [Common Issues](troubleshooting/common-issues.md) documentation.*