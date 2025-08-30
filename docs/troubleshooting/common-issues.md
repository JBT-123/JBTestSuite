# Common Issues & Solutions

Comprehensive troubleshooting guide for common problems encountered when using JBTestSuite.

## 🚨 Quick Diagnostic Commands

Before diving into specific issues, run these commands to gather system information:

```bash
# Check Docker status
docker --version
docker-compose --version
docker system info

# Check service status
docker-compose ps

# View recent logs
docker-compose logs --tail=50

# Check resource usage
docker stats --no-stream
```

## 🐳 Docker & Docker Compose Issues

### Issue: "Port already in use"
```
Error: bind: address already in use
```

**Solutions:**
1. **Find and stop conflicting process:**
   ```bash
   # Find process using port (Linux/Mac)
   lsof -i :3000
   lsof -i :8000
   lsof -i :5432
   
   # Find process using port (Windows)
   netstat -ano | findstr :3000
   netstat -ano | findstr :8000
   netstat -ano | findstr :5432
   
   # Kill process by PID
   kill -9 <PID>        # Linux/Mac
   taskkill /PID <PID>  # Windows
   ```

2. **Change ports in docker-compose.yml:**
   ```yaml
   services:
     client:
       ports:
         - "3001:3000"  # Change external port
     server:
       ports:
         - "8001:8000"  # Change external port
   ```

3. **Stop all Docker containers:**
   ```bash
   docker stop $(docker ps -aq)
   ```

### Issue: "Docker daemon not running"
```
Cannot connect to the Docker daemon
```

**Solutions:**
1. **Start Docker Desktop** (Windows/Mac)
2. **Start Docker daemon** (Linux):
   ```bash
   sudo systemctl start docker
   sudo systemctl enable docker
   ```
3. **Check Docker permissions** (Linux):
   ```bash
   sudo usermod -aG docker $USER
   # Log out and log back in
   ```

### Issue: "No space left on device"
```
Error: no space left on device
```

**Solutions:**
1. **Clean up Docker:**
   ```bash
   # Remove unused containers, networks, images
   docker system prune -a
   
   # Remove unused volumes
   docker volume prune
   
   # Remove specific images
   docker image prune -a
   ```

2. **Check disk usage:**
   ```bash
   df -h
   docker system df
   ```

### Issue: "Build failed" or "Image not found"
```
Error: failed to solve: image not found
```

**Solutions:**
1. **Clean build:**
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up
   ```

2. **Check Dockerfile syntax:**
   ```bash
   # Validate Dockerfiles
   docker build --dry-run ./client
   docker build --dry-run ./server
   ```

## 🌐 Network & Connectivity Issues

### Issue: "Cannot connect to API"
Frontend can't reach the backend API.

**Diagnosis:**
```bash
# Check if server is running
curl http://localhost:8000/health

# Check container networking
docker-compose exec client ping server
```

**Solutions:**
1. **Check CORS configuration:**
   ```python
   # server/src/main.py
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[
           "http://localhost:3000",
           "http://127.0.0.1:3000"
       ]
   )
   ```

2. **Verify API URL in frontend:**
   ```javascript
   // client/src/api/client.ts
   const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8000'
   ```

3. **Check container names in docker-compose.yml:**
   ```yaml
   services:
     server:
       container_name: jbts_server
     client:
       environment:
         - VITE_API_URL=http://server:8000  # Use service name
   ```

### Issue: "WebSocket connection failed"
Real-time features not working.

**Solutions:**
1. **Check WebSocket endpoint:**
   ```javascript
   // Correct WebSocket URL
   const ws = new WebSocket('ws://localhost:8000/ws')
   
   // Or with service name
   const ws = new WebSocket('ws://server:8000/ws')
   ```

2. **Verify WebSocket handling in FastAPI:**
   ```python
   # server/src/main.py
   @app.websocket("/ws")
   async def websocket_endpoint(websocket: WebSocket):
       await websocket.accept()
       # ... WebSocket logic
   ```

## 🗄️ Database Issues

### Issue: "Database connection refused"
```
sqlalchemy.exc.OperationalError: connection refused
```

**Diagnosis:**
```bash
# Check PostgreSQL container
docker-compose exec postgres pg_isready -U jbuser

# Check database logs
docker-compose logs postgres

# Test connection manually
docker-compose exec postgres psql -U jbuser -d jbtestsuite
```

**Solutions:**
1. **Wait for database to be ready:**
   ```yaml
   # docker-compose.yml
   services:
     server:
       depends_on:
         postgres:
           condition: service_healthy
   ```

2. **Check database credentials:**
   ```env
   # .env file
   DATABASE_URL=postgresql+asyncpg://jbuser:jbpass@postgres:5432/jbtestsuite
   ```

3. **Reset database:**
   ```bash
   docker-compose down -v  # Removes volumes
   docker-compose up --build
   ```

### Issue: "Migration failed" 
```
alembic.util.exc.CommandError: Can't locate revision
```

**Solutions:**
1. **Reset migration history:**
   ```bash
   # Remove migration files (keep env.py)
   rm server/alembic/versions/*.py
   
   # Create new initial migration
   docker-compose exec server alembic revision --autogenerate -m "initial"
   docker-compose exec server alembic upgrade head
   ```

2. **Force migration:**
   ```bash
   docker-compose exec server alembic stamp head
   docker-compose exec server alembic upgrade head
   ```

### Issue: "Permission denied" on database files
**Solutions:**
```bash
# Fix file permissions (Linux/Mac)
sudo chown -R $USER:$USER ./postgres_data

# Or remove and recreate volume
docker-compose down -v
docker-compose up --build
```

## 🔧 Application-Specific Issues

### Issue: "API returns 422 Unprocessable Entity"
Validation errors in API requests.

**Diagnosis:**
Check API documentation at http://localhost:8000/docs

**Solutions:**
1. **Verify request payload:**
   ```javascript
   // Ensure all required fields are included
   const testCase = {
     name: "Required field",
     is_automated: false,  // Required boolean
     retry_count: 0        // Required integer
   }
   ```

2. **Check data types:**
   ```python
   # server/src/api/schemas.py
   class TestCaseCreate(BaseModel):
     name: str  # Must be string
     is_automated: bool  # Must be boolean
     retry_count: int = 0  # Must be integer
   ```

### Issue: "Tests not appearing in UI"
Frontend shows empty list despite data in database.

**Diagnosis:**
```bash
# Check API directly
curl http://localhost:8000/api/v1/tests/

# Check browser network tab
# Check React Query DevTools
```

**Solutions:**
1. **Clear React Query cache:**
   ```javascript
   // In browser console
   queryClient.clear()
   
   // Or add cache buster
   const { data } = useQuery({
     queryKey: ['tests', Date.now()],
     queryFn: fetchTests
   })
   ```

2. **Check API response format:**
   ```javascript
   // Ensure API returns expected structure
   {
     items: [...],
     total: number,
     page: number,
     limit: number
   }
   ```

### Issue: "Selenium tests failing"
Browser automation not working properly.

**Diagnosis:**
```bash
# Check Selenium Grid
curl http://localhost:4444/wd/hub/status

# View browser via VNC
# Visit http://localhost:7900 (password: secret)

# Check Selenium logs
docker-compose logs selenium
```

**Solutions:**
1. **Restart Selenium service:**
   ```bash
   docker-compose restart selenium
   ```

2. **Check Selenium configuration:**
   ```python
   # server/src/core/config.py
   SELENIUM_HUB_URL = "http://selenium:4444/wd/hub"
   ```

3. **Increase timeouts:**
   ```python
   # Selenium WebDriver setup
   driver.implicitly_wait(30)
   driver.set_page_load_timeout(60)
   ```

## ⚡ Performance Issues

### Issue: "Slow API responses"
API taking too long to respond.

**Diagnosis:**
```bash
# Check container resources
docker stats

# Check database performance
docker-compose exec postgres psql -U jbuser -d jbtestsuite -c "
  SELECT query, mean_exec_time, calls 
  FROM pg_stat_statements 
  ORDER BY mean_exec_time DESC 
  LIMIT 10;"
```

**Solutions:**
1. **Add database indexes:**
   ```python
   # server/alembic/versions/add_indexes.py
   op.create_index('idx_test_cases_status', 'test_cases', ['status'])
   op.create_index('idx_test_cases_category', 'test_cases', ['category'])
   ```

2. **Optimize queries:**
   ```python
   # Use eager loading for relationships
   query = select(TestCase).options(selectinload(TestCase.steps))
   ```

3. **Increase container resources:**
   ```yaml
   # docker-compose.yml
   services:
     postgres:
       deploy:
         resources:
           limits:
             memory: 1G
           reservations:
             memory: 512M
   ```

### Issue: "Frontend loading slowly"
React app takes too long to load.

**Solutions:**
1. **Enable production build:**
   ```bash
   cd client
   npm run build
   npm run preview
   ```

2. **Check bundle size:**
   ```bash
   npm run build -- --analyze
   ```

3. **Optimize imports:**
   ```javascript
   // Use tree shaking
   import { useQuery } from '@tanstack/react-query'
   // Instead of: import * as ReactQuery from '@tanstack/react-query'
   ```

## 🔐 Environment & Configuration Issues

### Issue: "Environment variables not loaded"
App not reading .env file correctly.

**Solutions:**
1. **Check .env file location:**
   ```
   JBTestSuite/
   ├── .env          # Should be in project root
   ├── docker-compose.yml
   └── ...
   ```

2. **Verify env file format:**
   ```env
   # Correct format (no spaces around =)
   DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
   
   # Incorrect format
   DATABASE_URL = postgresql+asyncpg://user:pass@host:5432/db
   ```

3. **Reference in docker-compose.yml:**
   ```yaml
   services:
     server:
       env_file:
         - .env
       environment:
         - DATABASE_URL=${DATABASE_URL}
   ```

### Issue: "Permission denied" errors
File permission issues, especially on Linux/Mac.

**Solutions:**
1. **Fix ownership:**
   ```bash
   sudo chown -R $USER:$USER .
   ```

2. **Fix execute permissions:**
   ```bash
   chmod +x scripts/*.sh
   chmod +x bin/*
   ```

3. **Fix Docker socket permissions:**
   ```bash
   sudo chmod 666 /var/run/docker.sock
   # Or add user to docker group
   sudo usermod -aG docker $USER
   ```

## 🧪 Development Issues

### Issue: "Hot reload not working"
Changes not reflected immediately during development.

**Solutions:**
1. **Check volume mounting:**
   ```yaml
   # docker-compose.yml
   services:
     client:
       volumes:
         - ./client/src:/app/src:ro  # Read-only mount
         - /app/node_modules         # Exclude node_modules
   ```

2. **Restart development server:**
   ```bash
   docker-compose restart client
   docker-compose restart server
   ```

3. **Check file watchers:**
   ```bash
   # Increase inotify limit (Linux)
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

### Issue: "TypeScript errors"
Type checking failures in development.

**Solutions:**
1. **Update type definitions:**
   ```bash
   cd client
   npm update @types/*
   ```

2. **Check tsconfig.json:**
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "skipLibCheck": true
     }
   }
   ```

3. **Clear TypeScript cache:**
   ```bash
   rm -rf node_modules/.cache
   rm -rf dist/
   npm install
   ```

## 🆘 Emergency Recovery

### Complete System Reset
When nothing else works:

```bash
# Stop everything
docker-compose down -v

# Clean Docker completely
docker system prune -a --volumes

# Remove local data
rm -rf postgres_data/
rm -rf node_modules/

# Rebuild everything
docker-compose build --no-cache
docker-compose up --build
```

### Backup and Restore
Before major changes:

```bash
# Backup database
docker-compose exec postgres pg_dump -U jbuser jbtestsuite > backup.sql

# Restore database
docker-compose exec -T postgres psql -U jbuser jbtestsuite < backup.sql
```

## 📞 Getting Help

### Log Collection
When reporting issues, collect these logs:

```bash
# System information
docker version
docker-compose version
uname -a

# Service logs
docker-compose logs > all-logs.txt

# Resource usage
docker stats --no-stream > resource-usage.txt

# Configuration
cat docker-compose.yml > config.txt
cat .env > env-vars.txt  # Remove sensitive data
```

### Debug Mode
Enable verbose logging:

```yaml
# docker-compose.yml
services:
  server:
    environment:
      - DEBUG=true
      - LOG_LEVEL=debug
  
  postgres:
    command: postgres -c log_statement=all
```

---

*If you encounter an issue not covered here, please check the [FAQ](faq.md) or create an issue in the project repository.*