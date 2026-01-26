---
name: service-integration
description: Guide through adding new Java microservices or frontend applications following project standards. Use when adding new services, integrating new applications, or setting up new components in the monorepo.
---

# Service Integration

Guide through adding new Java microservices or frontend applications following project standards.

## Quick Checklist

When adding a new service/app:

- [ ] **Directory structure** created correctly
- [ ] **Dockerfile** follows project template
- [ ] **docker-compose.yml** updated (local build)
- [ ] **docker-compose.prod.yml** updated (production)
- [ ] **Nginx configuration** added (if needed)
- [ ] **CI/CD matrix** updated
- [ ] **Environment variables** configured
- [ ] **Health checks** configured
- [ ] **Service discovery** configured (for Java services)

## Adding Java Microservice

### 1. Directory Structure

```
services/
  └── <service-name>/
      ├── src/
      ├── pom.xml
      ├── Dockerfile
      └── application-docker.yml
```

**Naming consistency**:
- Directory: `services/<service-name>/`
- Compose service: `<service-name>`
- Docker image: `<service-name>`
- Maven module: `<service-name>`
- Gateway route: `lb://<service-name>`

### 2. Dockerfile Template

```dockerfile
FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app
RUN apk add --no-cache curl

COPY target/<service-name>.jar app.jar

EXPOSE <http-port>

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:<http-port>/actuator/health || exit 1

ENTRYPOINT ["java","-jar","-Djava.security.egd=file:/dev/./urandom","-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-docker}","app.jar"]
```

**Requirements**:
- ✅ Base image: `eclipse-temurin:17-jdk-alpine`
- ✅ Install `curl` for health checks
- ✅ Copy JAR: `target/<service-name>.jar`
- ✅ Health check: `/actuator/health`
- ✅ Default profile: `docker`

### 3. Docker Compose Configuration

#### Local Build (`docker-compose.yml`)

```yaml
services:
  <service-name>:
    build:
      context: ./services/<service-name>
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - NACOS_SERVER_ADDR=nacos:8848
      - MYSQL_HOST=mysql
      - MYSQL_PORT=3306
      - MYSQL_DATABASE=<database-name>
      - MYSQL_USERNAME=<username>
      - MYSQL_PASSWORD=${MYSQL_PASSWORD:-password}
    depends_on:
      mysql:
        condition: service_healthy
      nacos:
        condition: service_healthy
    networks:
      - microservices-network
    restart: unless-stopped
```

#### Production (`docker-compose.prod.yml`)

```yaml
services:
  <service-name>:
    image: ${REGISTRY:-gzhidao1010}/<service-name>:${TAG:-latest}
    environment:
      # Same as local build
    depends_on:
      # Same as local build
    networks:
      - microservices-network
    restart: unless-stopped
```

### 4. Application Configuration

Create `application-docker.yml`:

```yaml
spring:
  cloud:
    nacos:
      discovery:
        server-addr: ${NACOS_SERVER_ADDR:nacos:8848}
  datasource:
    url: jdbc:mysql://${MYSQL_HOST:mysql}:${MYSQL_PORT:3306}/${MYSQL_DATABASE}
    username: ${MYSQL_USERNAME}
    password: ${MYSQL_PASSWORD}

management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: always
```

### 5. Gateway Route Configuration

Add route in `services/api-gateway/src/main/resources/application-docker.yml`:

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: <service-name>
          uri: lb://<service-name>
          predicates:
            - Path=/api/<service-path>/**
```

**Important**: All APIs must go through `/api` and gateway, not directly to services.

### 6. Database Setup (if needed)

Add initialization SQL in `docker/mysql/init/`:

```sql
-- 01-create-<service-name>-database.sql
CREATE DATABASE IF NOT EXISTS `<database-name>` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON `<database-name>`.* TO 'root'@'%';
FLUSH PRIVILEGES;
```

### 7. CI/CD Configuration

Add to `.github/workflows/docker-publish.yml`:

```yaml
build-java-services:
  matrix:
    service:
      - name: <service-name>
        context: ./services/<service-name>
```

## Adding Frontend Application

### 1. Directory Structure

```
apps/
  └── <app-name>/
      ├── src/
      ├── package.json
      ├── Dockerfile
      └── nginx.conf
```

**Package naming**: Must be `@repo/<app-name>` (for Turborepo).

### 2. Dockerfile Template

```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

# Prune dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml turbo.json package.json ./
RUN pnpm turbo prune @repo/<app-name> --docker

# Install dependencies
WORKDIR /app/out
RUN pnpm install --frozen-lockfile

# Build
COPY . .
ARG APP_NAME=<app-name>
ENV APP_NAME=${APP_NAME}
RUN pnpm turbo run build --filter=@repo/${APP_NAME}

# Runtime stage
FROM nginx:alpine
COPY --from=builder /app/out/apps/${APP_NAME}/build/client /usr/share/nginx/html
COPY apps/${APP_NAME}/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --spider http://localhost || exit 1
```

**Requirements**:
- ✅ Node: `22-alpine`
- ✅ pnpm: `10.28.0`
- ✅ Build output: `apps/${APP_NAME}/build/client`
- ✅ Runtime: `nginx:alpine`
- ✅ Health check: `wget --spider`

### 3. Nginx Configuration

Create `apps/<app-name>/nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 4. Docker Compose Configuration

#### Local Build (`docker-compose.yml`)

```yaml
services:
  <app-name>:
    build:
      context: .
      dockerfile: apps/<app-name>/Dockerfile
    args:
      APP_NAME: <app-name>
    expose:
      - "80"
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - microservices-network
```

#### Production (`docker-compose.prod.yml`)

```yaml
services:
  <app-name>:
    image: ${REGISTRY:-gzhidao1010}/<app-name>:${TAG:-latest}
    build:
      context: .
      dockerfile: apps/<app-name>/Dockerfile
      args:
        APP_NAME: <app-name>
    expose:
      - "80"
    networks:
      - microservices-network
```

### 5. Nginx Proxy Configuration

Add to `docker/nginx/conf.d/default.conf`:

```nginx
server {
    server_name <app-name>.example.com;
    
    location / {
        proxy_pass http://<app-name>:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api {
        proxy_pass http://api-gateway:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6. Hosts Configuration (Windows)

Add to `C:\Windows\System32\drivers\etc\hosts`:

```text
127.0.0.1 <app-name>.example.com
```

### 7. CI/CD Configuration

Add to `.github/workflows/docker-publish.yml`:

```yaml
build-frontend-apps:
  matrix:
    app:
      - name: <app-name>
        dockerfile: ./apps/<app-name>/Dockerfile
```

## Verification Checklist

After adding service/app, verify:

### Java Service

- [ ] `docker-compose up -d` starts successfully
- [ ] Health check passes: `curl http://localhost:<port>/actuator/health`
- [ ] Service registered in Nacos (if enabled)
- [ ] Gateway route works: `curl http://localhost:8080/api/<path>`
- [ ] Database connection works
- [ ] CI builds and pushes image successfully

### Frontend App

- [ ] `docker-compose up -d` starts successfully
- [ ] Health check passes: `wget --spider http://localhost`
- [ ] Accessible via domain: `http://<app-name>.example.com:8888`
- [ ] SPA routing works
- [ ] API calls work: `/api` routes to gateway
- [ ] CI builds and pushes image successfully

## Common Issues

### Issue 1: Java Service Build Fails

**Problem**: JAR file not found

**Solution**:
```bash
cd services
mvn clean package -DskipTests
cd ..
docker-compose build <service-name>
```

### Issue 2: Service Not Registered in Nacos

**Check**:
- Nacos is running: `docker ps | grep nacos`
- Configuration correct: `NACOS_SERVER_ADDR=nacos:8848`
- Network correct: `microservices-network`

### Issue 3: Frontend Build Fails

**Check**:
- Node version: `node:22-alpine`
- pnpm version: `10.28.0`
- Build output path: `apps/${APP_NAME}/build/client`

### Issue 4: Nginx 404

**Check**:
- Hosts file configured
- Domain matches `server_name` in nginx config
- Service is running: `docker-compose ps`

## Best Practices

### ✅ Good Practices

- Follow naming consistency across all configs
- Use environment variables for configuration
- Configure health checks for all services
- Add services to CI/CD matrix
- Test locally before committing
- Document any special requirements

### ❌ Anti-Patterns

- Don't bypass gateway for API routes
- Don't hardcode values (use env vars)
- Don't skip health checks
- Don't forget to update CI/CD
- Don't expose ports directly (use nginx-proxy)

## Related Rules

- Service Integration: `.cursor/rules/13-新增Java微服务与前端接入规范.mdc`
- Deployment: `.cursor/rules/12-部署与发布规范.mdc`
- Deploy Preview: `.cursor/rules/19-部署预览规范.mdc`
