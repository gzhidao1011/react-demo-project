# ==================== 构建脚本 (PowerShell) ====================
# 用于构建所有微服务 Docker 镜像

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = (Get-Item "$ScriptDir\..\..").FullName

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  微服务 Docker 镜像构建脚本" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $ProjectDir

# 1. 构建 Java 项目
Write-Host "[1/2] 构建 Java 项目 jar 包..." -ForegroundColor Yellow
Set-Location "$ProjectDir\services"
mvn clean package -DskipTests
if ($LASTEXITCODE -ne 0) {
    Write-Host "Maven 构建失败！" -ForegroundColor Red
    exit 1
}

# 2. 构建 Docker 镜像
Write-Host ""
Write-Host "[2/2] 构建 Docker 镜像..." -ForegroundColor Yellow
Set-Location $ProjectDir
docker-compose build

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  构建完成！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "镜像列表：" -ForegroundColor Cyan
docker images | Select-String "microservices"
