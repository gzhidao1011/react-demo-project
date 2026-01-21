# ==================== 启动脚本 (PowerShell) ====================
# 用于启动微服务环境

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "infra", "services")]
    [string]$Mode = "all",
    
    [switch]$Build,
    [switch]$Detach
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = (Get-Item "$ScriptDir\..\..").FullName

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  微服务启动脚本" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $ProjectDir

# 如果需要构建，先构建 jar 包
if ($Build) {
    Write-Host "构建 Java 项目..." -ForegroundColor Yellow
    Set-Location "$ProjectDir\services"
    mvn clean package -DskipTests
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Maven 构建失败！" -ForegroundColor Red
        exit 1
    }
    Set-Location $ProjectDir
}

$DetachFlag = if ($Detach) { "-d" } else { "" }
$BuildFlag = if ($Build) { "--build" } else { "" }

switch ($Mode) {
    "infra" {
        Write-Host "启动基础设施服务 (MySQL, Nacos, Sentinel)..." -ForegroundColor Yellow
        docker-compose up $DetachFlag mysql nacos sentinel
    }
    "services" {
        Write-Host "启动业务服务 (user-service, order-service, api-gateway)..." -ForegroundColor Yellow
        docker-compose up $DetachFlag $BuildFlag user-service order-service api-gateway
    }
    "all" {
        Write-Host "启动所有服务..." -ForegroundColor Yellow
        docker-compose up $DetachFlag $BuildFlag
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  服务启动完成！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "服务访问地址：" -ForegroundColor Cyan
Write-Host "  - API 网关:     http://localhost:8080" -ForegroundColor White
Write-Host "  - 用户服务:     http://localhost:8001" -ForegroundColor White
Write-Host "  - 订单服务:     http://localhost:8002" -ForegroundColor White
Write-Host "  - Nacos 控制台: http://localhost:8848/nacos (nacos/nacos)" -ForegroundColor White
Write-Host "  - Sentinel:     http://localhost:8858 (sentinel/sentinel)" -ForegroundColor White
