---
name: ci-cd-configuration
description: Configure CI/CD workflows including GitHub Actions, workflow triggers, job dependencies, and deployment pipelines. Use when configuring CI/CD, creating workflows, or troubleshooting CI/CD issues.
---

# CI/CD Configuration

Configure CI/CD workflows following GitHub Actions best practices and project standards.

## Quick Checklist

When configuring CI/CD:

- [ ] **Workflow triggers** configured correctly
- [ ] **Job dependencies** set up properly
- [ ] **Secrets** configured in GitHub
- [ ] **Matrix strategies** used for multiple builds
- [ ] **Caching** configured for faster builds
- [ ] **Artifacts** uploaded/downloaded correctly
- [ ] **Error handling** implemented

## GitHub Actions Workflows

### 1. Basic Workflow Structure

```yaml
name: Workflow Name

on:
  push:
    branches:
      - main
    paths:
      - 'packages/**'
  pull_request:
    branches:
      - '**'
  workflow_dispatch:

jobs:
  job-name:
    runs-on: ubuntu-latest
    steps:
      - name: Step name
        run: command
```

### 2. Test Workflow

```yaml
name: Test

on:
  push:
    branches: ['**']
    paths:
      - 'packages/**'
      - 'apps/**'
  pull_request:
    branches: ['**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.28.0
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Type check
        run: pnpm check:types
      
      - name: Lint and format check
        run: pnpm check
      
      - name: Run tests
        run: pnpm test
      
      - name: Generate test coverage
        run: pnpm test:coverage
        continue-on-error: true
```

### 3. Build and Publish Workflow

```yaml
name: Build and Push Docker Images

on:
  push:
    branches:
      - main
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      tag:
        description: 'Image tag'
        default: 'latest'

env:
  REGISTRY: docker.io
  IMAGE_PREFIX: ${{ secrets.DOCKERHUB_USERNAME }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      # Test steps (same as test workflow)
  
  build-java-services:
    needs: test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service:
          - name: user-service
            context: ./services/user-service
          - name: order-service
            context: ./services/order-service
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up JDK
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Build with Maven
        run: |
          cd services/${{ matrix.service.name }}
          mvn clean package -DskipTests
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ./services/${{ matrix.service.name }}
          push: true
          tags: ${{ env.IMAGE_PREFIX }}/${{ matrix.service.name }}:latest
```

## Workflow Triggers

### 1. Push Triggers

```yaml
on:
  push:
    branches:
      - main
      - develop
    paths:
      - 'packages/**'
      - 'apps/**'
    tags:
      - 'v*'
```

### 2. Pull Request Triggers

```yaml
on:
  pull_request:
    branches:
      - main
    types:
      - opened
      - synchronize
      - reopened
```

### 3. Manual Triggers

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        type: choice
        options:
          - staging
          - production
```

## Job Dependencies

### 1. Sequential Jobs

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm test
  
  build:
    needs: test  # Wait for test to complete
    runs-on: ubuntu-latest
    steps:
      - run: pnpm build
  
  deploy:
    needs: build  # Wait for build to complete
    runs-on: ubuntu-latest
    steps:
      - run: deploy
```

### 2. Parallel Jobs

```yaml
jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm --filter @repo/web test
  
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - run: cd services && mvn test
  
  deploy:
    needs: [test-frontend, test-backend]  # Wait for both
    runs-on: ubuntu-latest
    steps:
      - run: deploy
```

## Matrix Strategies

### 1. Multiple Services

```yaml
strategy:
  matrix:
    service:
      - name: user-service
        context: ./services/user-service
      - name: order-service
        context: ./services/order-service
      - name: api-gateway
        context: ./services/api-gateway
```

### 2. Multiple Node Versions

```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
  
steps:
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node-version }}
```

## Caching

### 1. pnpm Cache

```yaml
- name: Set up Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'pnpm'  # Automatic pnpm cache
```

### 2. Docker Layer Caching

```yaml
- name: Build and push
  uses: docker/build-push-action@v5
  with:
    cache-from: type=registry,ref=${{ env.IMAGE_PREFIX }}/${{ matrix.service.name }}:buildcache
    cache-to: type=registry,ref=${{ env.IMAGE_PREFIX }}/${{ matrix.service.name }}:buildcache,mode=max
```

### 3. Custom Cache

```yaml
- name: Cache dependencies
  uses: actions/cache@v4
  with:
    path: |
      node_modules
      packages/*/node_modules
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-
```

## Secrets Management

### 1. Using Secrets

```yaml
env:
  DOCKERHUB_USERNAME: ${{ secrets.DOCKERHUB_USERNAME }}
  DOCKERHUB_TOKEN: ${{ secrets.DOCKERHUB_TOKEN }}
  API_KEY: ${{ secrets.API_KEY }}
```

### 2. Secret Configuration

**Steps to configure secrets**:
1. Go to GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add secret name and value

## Artifacts

### 1. Upload Artifacts

```yaml
- name: Upload coverage reports
  uses: actions/upload-artifact@v4
  with:
    name: coverage-reports
    path: |
      **/coverage/**
    retention-days: 7
```

### 2. Download Artifacts

```yaml
- name: Download coverage reports
  uses: actions/download-artifact@v4
  with:
    name: coverage-reports
    path: coverage/
```

## Conditional Execution

### 1. Conditional Steps

```yaml
- name: Deploy to production
  if: github.ref == 'refs/heads/main'
  run: deploy-production

- name: Deploy to staging
  if: github.ref == 'refs/heads/develop'
  run: deploy-staging
```

### 2. Conditional Jobs

```yaml
jobs:
  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: deploy
```

## Error Handling

### 1. Continue on Error

```yaml
- name: Generate coverage
  run: pnpm test:coverage
  continue-on-error: true  # Don't fail workflow if this step fails
```

### 2. Error Notifications

```yaml
- name: Notify on failure
  if: failure()
  uses: actions/github-script@v7
  with:
    script: |
      github.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: 'CI Failed',
        body: 'Workflow failed: ${{ github.workflow }}'
      })
```

## Best Practices

### ✅ Good Practices

- Use matrix strategies for multiple builds
- Configure caching for faster builds
- Set up job dependencies correctly
- Use secrets for sensitive data
- Upload artifacts for debugging
- Add conditional execution where needed
- Use continue-on-error for optional steps
- Document workflow triggers

### ❌ Anti-Patterns

- Don't hardcode secrets
- Don't skip caching
- Don't ignore job dependencies
- Don't forget error handling
- Don't run unnecessary jobs
- Don't skip testing before deployment

## Common Workflow Patterns

### 1. Test → Build → Deploy

```yaml
jobs:
  test:
    # Run tests
  
  build:
    needs: test
    # Build artifacts
  
  deploy:
    needs: build
    # Deploy to production
```

### 2. Matrix Build

```yaml
strategy:
  matrix:
    service: [service1, service2, service3]

steps:
  - name: Build ${{ matrix.service }}
    run: build ${{ matrix.service }}
```

## Troubleshooting

### Issue 1: Workflow Not Triggering

**Check**:
- Trigger conditions match
- Path filters are correct
- Branch names match

### Issue 2: Secrets Not Available

**Solution**:
- Verify secrets are configured in GitHub
- Check secret names match exactly
- Ensure secrets are not empty

### Issue 3: Job Dependencies Failing

**Solution**:
- Check if dependent job succeeded
- Verify `needs` array is correct
- Check job names match exactly

## Related Rules

- Deployment: `.cursor/rules/12-部署与发布规范.mdc`
- Test Configuration: `.cursor/rules/15-测试与发布流程.mdc`
- Service Integration: `.cursor/skills/service-integration/SKILL.md`
