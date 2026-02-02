---
name: deployment-operations
description: Handle deployment operations including Docker builds, docker-compose operations, and CI/CD configuration. Use when deploying applications, building Docker images, or configuring deployment pipelines.
---

# Deployment Operations

Handle deployment operations following project standards: Docker Compose + Nginx + CI/CD.

## Quick Reference

### Local Development

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d mysql nacos web

# View logs
docker-compose logs -f web

# Stop services
docker-compose down

# Rebuild and start
docker-compose up -d --build
```

### Production Deployment

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Restart specific service
docker-compose -f docker-compose.prod.yml restart web
```

## Docker Build Operations

### Java Services

```bash
# 1. Build JAR first (required)
cd services
mvn clean package -DskipTests
cd ..

# 2. Build Docker image
docker-compose build user-service

# Or build all Java services
docker-compose build user-service order-service api-gateway
```

**Important**: Java services require JAR files to exist before building Docker images.

### Frontend Applications

```bash
# Build frontend app (Docker handles build)
docker-compose build web

# Or build specific app
docker-compose build storybook
```

Frontend apps use multi-stage builds - Docker handles the build process.

### Build All Services

```bash
# Build everything
docker-compose build

# Or use PowerShell script
.\docker\scripts\build.ps1
```

## Docker Compose Operations

### Service Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart service
docker-compose restart web

# View service status
docker-compose ps

# View logs
docker-compose logs -f web
docker-compose logs --tail=100 web  # Last 100 lines
```

### Health Checks

```bash
# Check service health
docker-compose ps

# Check specific service health
curl http://localhost:8080/actuator/health  # Java service
curl http://localhost:8888  # Nginx proxy
```

### Network and Volumes

```bash
# View networks
docker network ls

# View volumes
docker volume ls

# Remove unused volumes
docker volume prune
```

## CI/CD Configuration

### GitHub Actions Workflow

The project uses `.github/workflows/docker-publish.yml` for CI/CD.

#### Java Services Matrix

```yaml
build-java-services:
  matrix:
    service:
      - name: user-service
        context: ./services/user-service
      - name: order-service
        context: ./services/order-service
      - name: api-gateway
        context: ./services/api-gateway
```

#### Frontend Apps Matrix

```yaml
build-frontend-apps:
  matrix:
    app:
      - name: web
        dockerfile: ./apps/web/Dockerfile
      - name: storybook
        dockerfile: ./apps/storybook/Dockerfile
```

### Adding New Service/App

1. **Add to docker-compose.yml**:
   ```yaml
   services:
     new-service:
       build:
         context: ./services/new-service
       # ... other config
   ```

2. **Add to docker-compose.prod.yml**:
   ```yaml
   services:
     new-service:
       image: ${REGISTRY:-gzhidao1010}/new-service:${TAG:-latest}
       # ... other config
   ```

3. **Add to CI matrix**:
   ```yaml
   # For Java service
   build-java-services:
     matrix:
       service:
         - name: new-service
           context: ./services/new-service
   
   # For frontend app
   build-frontend-apps:
     matrix:
       app:
         - name: new-app
           dockerfile: ./apps/new-app/Dockerfile
   ```

4. **Add Nginx route** (if needed):
   ```nginx
   server {
     server_name new-app.example.com;
     location / {
       proxy_pass http://new-app:80;
     }
   }
   ```

## Nginx Configuration

### Access Pattern

All external access goes through `nginx-proxy`:

- **HTTP**: Port `8888` → `nginx-proxy:80`
- **HTTPS**: Port `8443` → `nginx-proxy:443` (optional)

### Domain Routing

Configure hosts file (Windows):

```text
# C:\Windows\System32\drivers\etc\hosts
127.0.0.1 web.example.com
127.0.0.1 storybook.example.com
```

Access URLs:
- `http://web.example.com:8888`
- `http://storybook.example.com:8888`

### Adding New Domain

1. **Add to hosts file**:
   ```text
   127.0.0.1 new-app.example.com
   ```

2. **Add Nginx server block**:
   ```nginx
   server {
     server_name new-app.example.com;
     location / {
       proxy_pass http://new-app:80;
     }
     location /api {
       proxy_pass http://api-gateway:8080;
     }
   }
   ```

## Environment Variables

### Production Environment

```bash
# Set registry and tag
export REGISTRY=your-registry
export TAG=v1.0.0

# Set database credentials
export MYSQL_ROOT_PASSWORD=your-password
export MYSQL_PASSWORD=your-password

# Use production compose
docker-compose -f docker-compose.prod.yml up -d
```

### Docker Compose Environment

```yaml
services:
  web:
    environment:
      - NODE_ENV=production
      - API_BASE_URL=http://api-gateway:8080
```

## Troubleshooting

### Port Conflicts

```bash
# Check port usage (Windows)
netstat -ano | findstr :8080

# Check port usage (Linux/Mac)
lsof -i :8080

# Change port in docker-compose.yml
ports:
  - "8081:8080"  # Use different host port
```

### Service Won't Start

```bash
# Check logs
docker-compose logs service-name

# Check health
docker-compose ps

# Check dependencies
docker-compose config

# Restart service
docker-compose restart service-name
```

### Java Service Build Fails

```bash
# Ensure JAR exists
ls services/user-service/target/*.jar

# Rebuild JAR
cd services
mvn clean package -DskipTests
cd ..

# Rebuild Docker image
docker-compose build user-service
```

### Frontend Build Fails

```bash
# Check Node version
node --version  # Should be 22

# Check pnpm version
pnpm --version  # Should be 10.28.0

# Clear cache and rebuild
docker-compose build --no-cache web
```

## Best Practices

### ✅ Good Practices

- Always build JAR before building Java Docker images
- Use health checks to verify services
- Check logs when services fail
- Use production compose file for production
- Set environment variables securely
- Keep Docker images updated

### ❌ Anti-Patterns

- Don't build Java images without JAR files
- Don't expose ports directly (use nginx-proxy)
- Don't commit sensitive data (.env files)
- Don't use `latest` tag in production
- Don't ignore health check failures

## PowerShell Scripts

Project includes PowerShell scripts in `docker/scripts/`:

```powershell
# Start services
.\docker\scripts\start.ps1

# Stop services
.\docker\scripts\stop.ps1

# Build services
.\docker\scripts\build.ps1

# Publish images
.\docker\scripts\publish.ps1

# Backup data
.\docker\scripts\backup.ps1
```

## Related Rules

- Deployment: `.cursor/rules/12-部署与发布规范.mdc`
- Deploy Preview: `.cursor/rules/19-部署预览规范.mdc`
- New Service Guide: `.cursor/rules/13-新增Java微服务与前端接入规范.mdc`
