# 修复 API Gateway 路由配置脚本
# 用途：重新构建 API Gateway 镜像以应用认证路由配置修复

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API Gateway 路由配置修复脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Docker 是否运行
$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "错误：Docker 未运行，请先启动 Docker Desktop" -ForegroundColor Red
    exit 1
}

# 停止 API Gateway
Write-Host "1. 停止 API Gateway..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml stop api-gateway
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ API Gateway 已停止" -ForegroundColor Green
} else {
    Write-Host "   ⚠ API Gateway 可能未运行" -ForegroundColor Yellow
}

# 重新构建 API Gateway 镜像
Write-Host ""
Write-Host "2. 重新构建 API Gateway 镜像..." -ForegroundColor Green
Write-Host "   这可能需要几分钟时间，请耐心等待..." -ForegroundColor Gray
Write-Host ""

docker-compose -f docker-compose.prod.yml build api-gateway

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "✗ 构建失败，请检查错误信息" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "查看详细日志：" -ForegroundColor Yellow
    Write-Host "  docker-compose -f docker-compose.prod.yml build api-gateway" -ForegroundColor Gray
    exit 1
}

# 启动 API Gateway
Write-Host ""
Write-Host "3. 启动 API Gateway..." -ForegroundColor Green
docker-compose -f docker-compose.prod.yml up -d api-gateway

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ API Gateway 已重新构建并启动！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    # 等待服务启动
    Write-Host "等待服务启动..." -ForegroundColor Cyan
    Start-Sleep -Seconds 10
    
    # 显示容器状态
    Write-Host ""
    Write-Host "容器状态：" -ForegroundColor Cyan
    docker-compose -f docker-compose.prod.yml ps api-gateway
    
    Write-Host ""
    Write-Host "查看日志：" -ForegroundColor Cyan
    Write-Host "  docker-compose -f docker-compose.prod.yml logs -f api-gateway" -ForegroundColor Gray
    Write-Host ""
    Write-Host "测试 API：" -ForegroundColor Cyan
    Write-Host '  $body = @{email="test@example.com";password="Test123!"} | ConvertTo-Json' -ForegroundColor Gray
    Write-Host '  Invoke-WebRequest -Uri "http://localhost:8080/api/auth/register" -Method POST -ContentType "application/json" -Body $body' -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "✗ 启动失败，请检查错误信息" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit 1
}
