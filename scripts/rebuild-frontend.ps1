# 重新构建前端应用脚本
# 用途：快速重新构建 web、docs、storybook 应用，确保使用最新代码

param(
    [switch]$Force = $false  # 强制删除旧镜像
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "前端应用重新构建脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Docker 是否运行
$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "错误：Docker 未运行，请先启动 Docker Desktop" -ForegroundColor Red
    exit 1
}

# 停止前端容器
Write-Host "1. 停止前端容器..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml stop web docs storybook 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ 容器已停止" -ForegroundColor Green
} else {
    Write-Host "   ⚠ 部分容器可能未运行" -ForegroundColor Yellow
}

# 删除旧镜像（可选）
if ($Force) {
    Write-Host ""
    Write-Host "2. 删除旧镜像..." -ForegroundColor Yellow
    $images = @("gzhidao1010/web:latest", "gzhidao1010/docs:latest", "gzhidao1010/storybook:latest")
    foreach ($image in $images) {
        $result = docker rmi $image -f 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✓ 已删除 $image" -ForegroundColor Green
        } else {
            Write-Host "   ⚠ $image 不存在或正在使用" -ForegroundColor Yellow
        }
    }
}

# 重新构建并启动
Write-Host ""
Write-Host "3. 重新构建并启动前端应用..." -ForegroundColor Green
Write-Host "   这可能需要几分钟时间，请耐心等待..." -ForegroundColor Gray
Write-Host ""

docker-compose -f docker-compose.prod.yml up -d --build web docs storybook

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ 前端应用重新构建完成！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    # 显示容器状态
    Write-Host "容器状态：" -ForegroundColor Cyan
    docker-compose -f docker-compose.prod.yml ps web docs storybook
    
    Write-Host ""
    Write-Host "查看日志：" -ForegroundColor Cyan
    Write-Host "  docker-compose -f docker-compose.prod.yml logs -f web" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "✗ 构建失败，请检查错误信息" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "查看详细日志：" -ForegroundColor Yellow
    Write-Host "  docker-compose -f docker-compose.prod.yml logs web docs storybook" -ForegroundColor Gray
    exit 1
}
