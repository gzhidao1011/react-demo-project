---
name: environment-setup
description: Set up development environment including Node.js, pnpm, Docker, database, and project dependencies. Use when setting up development environment, configuring tools, or troubleshooting setup issues.
---

# Environment Setup

Set up development environment following project standards.

## Quick Checklist

When setting up environment:

- [ ] **Node.js** installed (version 22+)
- [ ] **pnpm** installed (version 10.28.0+)
- [ ] **Docker** installed and running
- [ ] **Git** configured
- [ ] **Dependencies** installed (`pnpm install`)
- [ ] **Environment variables** configured
- [ ] **Database** initialized
- [ ] **Services** running

## Prerequisites

### 1. Node.js Installation

```bash
# Check Node.js version (should be 22+)
node --version

# Install Node.js 22 (using nvm)
nvm install 22
nvm use 22

# Or download from nodejs.org
```

### 2. pnpm Installation

```bash
# Check pnpm version (should be 10.28.0+)
pnpm --version

# Install pnpm
npm install -g pnpm@10.28.0

# Or using corepack (Node.js 16.13+)
corepack enable
corepack prepare pnpm@10.28.0 --activate
```

### 3. Docker Installation

```bash
# Check Docker version
docker --version
docker-compose --version

# Start Docker Desktop (Windows/Mac)
# Or start Docker service (Linux)
sudo systemctl start docker
```

### 4. Git Configuration

```bash
# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Clone repository
git clone <repository-url>
cd react-demo-project
```

## Project Setup

### 1. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Verify installation
pnpm list --depth=0
```

### 2. Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your configuration
# Required variables:
# - VITE_API_BASE_URL=http://localhost:8080
# - MYSQL_PASSWORD=your_password
```

### 3. Database Setup

```bash
# Start MySQL container
docker-compose up -d mysql

# Wait for MySQL to be ready (30-60 seconds)
docker-compose logs -f mysql

# Verify database initialization
docker exec mysql mysql -uroot -proot123 -e "SHOW DATABASES;"
```

### 4. Start Services

```bash
# Start all services
docker-compose up -d

# Or start specific services
docker-compose up -d mysql nacos

# Check service status
docker-compose ps
```

## Development Workflow

### 1. Start Development Server

```bash
# Start frontend development server
pnpm --filter @repo/web dev

# Start all apps in development mode
pnpm dev

# Start specific app
pnpm --filter @repo/docs dev
```

### 2. Build Services

```bash
# Build Java services
cd services
mvn clean package -DskipTests
cd ..

# Build frontend apps
pnpm build
```

### 3. Run Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @repo/utils test

# Run tests in watch mode
pnpm test:watch
```

## Common Setup Issues

### Issue 1: Node.js Version Mismatch

**Problem**: Wrong Node.js version

**Solution**:
```bash
# Use nvm to switch versions
nvm install 22
nvm use 22

# Verify version
node --version
```

### Issue 2: pnpm Not Found

**Problem**: pnpm not installed

**Solution**:
```bash
# Install pnpm
npm install -g pnpm@10.28.0

# Or use corepack
corepack enable
corepack prepare pnpm@10.28.0 --activate
```

### Issue 3: Docker Not Running

**Problem**: Docker daemon not running

**Solution**:
```bash
# Windows/Mac: Start Docker Desktop
# Linux: Start Docker service
sudo systemctl start docker

# Verify Docker is running
docker ps
```

### Issue 4: Port Already in Use

**Problem**: Port 3306, 8080, etc. already in use

**Solution**:
```bash
# Windows: Find process using port
netstat -ano | findstr :8080

# Kill process
taskkill /PID <process-id> /F

# Or change port in docker-compose.yml
```

### Issue 5: Dependencies Installation Fails

**Problem**: pnpm install fails

**Solution**:
```bash
# Clear pnpm cache
pnpm store prune

# Remove node_modules and lock file
rm -rf node_modules pnpm-lock.yaml

# Reinstall
pnpm install
```

### Issue 6: Database Connection Fails

**Problem**: Cannot connect to MySQL

**Solution**:
```bash
# Check MySQL container is running
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# Verify connection
docker exec mysql mysql -uroot -proot123 -e "SELECT 1;"
```

## Environment-Specific Configuration

### Development Environment

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8080
MYSQL_HOST=localhost
MYSQL_PORT=3306
```

### Production Environment

```bash
# .env.production
VITE_API_BASE_URL=https://api.example.com
MYSQL_HOST=mysql
MYSQL_PORT=3306
```

## IDE Setup

### VS Code / Cursor

**Recommended Extensions**:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Docker
- GitLens

**Settings**:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Verification

### 1. Verify Installation

```bash
# Check versions
node --version    # Should be 22+
pnpm --version    # Should be 10.28.0+
docker --version  # Should be installed

# Check dependencies
pnpm list --depth=0

# Check services
docker-compose ps
```

### 2. Run Health Checks

```bash
# Check frontend
curl http://localhost:5173

# Check backend API
curl http://localhost:8080/actuator/health

# Check database
docker exec mysql mysql -uroot -proot123 -e "SELECT 1;"
```

## Best Practices

### ✅ Good Practices

- Use exact Node.js and pnpm versions
- Keep .env files in .gitignore
- Document environment setup steps
- Use Docker for consistent environments
- Test setup on clean machine
- Keep dependencies up-to-date

### ❌ Anti-Patterns

- Don't commit .env files
- Don't use different Node.js versions
- Don't skip dependency installation
- Don't ignore setup errors
- Don't use global packages unnecessarily

## Related Rules

- Project Structure: `.cursor/rules/02-项目结构.mdc`
- Deployment: `.cursor/rules/12-部署与发布规范.mdc`
- Monorepo Operations: `.cursor/skills/monorepo-operations/SKILL.md`
