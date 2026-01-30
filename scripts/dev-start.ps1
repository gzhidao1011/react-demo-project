# 本地开发快速启动脚本（PowerShell）
# 用途：快速启动所有开发服务

Write-Host "🚀 启动本地开发环境..." -ForegroundColor Cyan
Write-Host ""

# 检查 Docker 是否运行
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker 未运行，请先启动 Docker" -ForegroundColor Red
    exit 1
}

# 1. 启动基础设施服务
Write-Host "📦 启动基础设施服务（MySQL、Redis、Nacos）..." -ForegroundColor Yellow
docker-compose up -d mysql redis nacos sentinel

Write-Host "⏳ 等待服务就绪..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 检查服务状态
Write-Host "✅ 基础设施服务状态：" -ForegroundColor Green
docker-compose ps mysql redis nacos sentinel

Write-Host ""
Write-Host "✅ 基础设施服务已启动！" -ForegroundColor Green
Write-Host ""
Write-Host "📝 服务地址：" -ForegroundColor Cyan
Write-Host "  - MySQL: localhost:3306"
Write-Host "  - Redis: localhost:6379"
Write-Host "  - Nacos: http://localhost:8848/nacos (nacos/nacos)"
Write-Host "  - Sentinel: http://localhost:8858"
Write-Host ""
Write-Host "⚠️  请在新终端窗口中启动后端和前端服务：" -ForegroundColor Yellow
Write-Host ""
Write-Host "后端服务（终端 2）：" -ForegroundColor Cyan
Write-Host "  cd services"
Write-Host "  make up    # 启动基础设施"
Write-Host "  make dev   # 启动所有微服务"
Write-Host "  或 make gateway-compose  # 网关自动拉起基础设施"
Write-Host ""
Write-Host "前端服务（终端 3）：" -ForegroundColor Cyan
Write-Host "  pnpm dev"
Write-Host "  或"
Write-Host "  pnpm --filter @repo/web dev"
Write-Host ""
