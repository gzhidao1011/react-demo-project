# ==================== 发布脚本 (PowerShell) ====================
# 用于将 Docker 镜像推送到远程仓库
#
# 使用方法：
#   1. 首次使用需要登录：docker login
#   2. 或者设置环境变量自动登录：
#      $env:DOCKERHUB_USERNAME = "your-username"
#      $env:DOCKERHUB_TOKEN = "your-token"
#
# 示例：
#   .\publish.ps1 -Registry "myusername" -Build -Push
#   .\publish.ps1 -Registry "myusername" -Tag "v1.0.0" -Build -Push
#

param(
    [Parameter(Mandatory=$false)]
    [string]$Registry = $env:DOCKERHUB_USERNAME,  # 默认使用环境变量
    
    [Parameter(Mandatory=$false)]
    [string]$Tag = "latest",
    
    [switch]$Build,  # 是否先构建
    [switch]$Push,   # 是否推送到远程
    [switch]$Login   # 是否自动登录
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = (Get-Item "$ScriptDir\..\..").FullName

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Docker 镜像发布脚本" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Registry 参数
if ([string]::IsNullOrEmpty($Registry)) {
    Write-Host "错误: 未指定 Registry！" -ForegroundColor Red
    Write-Host ""
    Write-Host "请使用以下方式之一：" -ForegroundColor Yellow
    Write-Host "  1. 设置环境变量: `$env:DOCKERHUB_USERNAME = 'your-username'" -ForegroundColor Gray
    Write-Host "  2. 使用参数: .\publish.ps1 -Registry 'your-username' -Build -Push" -ForegroundColor Gray
    exit 1
}

Write-Host "Registry: $Registry" -ForegroundColor Yellow
Write-Host "Tag: $Tag" -ForegroundColor Yellow
Write-Host ""

Set-Location $ProjectDir

# 自动登录 Docker Hub
if ($Login -or $Push) {
    if ($env:DOCKERHUB_USERNAME -and $env:DOCKERHUB_TOKEN) {
        Write-Host "使用环境变量登录 Docker Hub..." -ForegroundColor Yellow
        $env:DOCKERHUB_TOKEN | docker login -u $env:DOCKERHUB_USERNAME --password-stdin
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Docker Hub 登录失败！" -ForegroundColor Red
            exit 1
        }
        Write-Host "登录成功！" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "提示: 如需自动登录，请设置环境变量 DOCKERHUB_USERNAME 和 DOCKERHUB_TOKEN" -ForegroundColor Gray
        Write-Host ""
    }
}

# 服务列表
$services = @("user-service", "order-service", "api-gateway")

# 1. 构建 jar 包和 Docker 镜像
if ($Build) {
    Write-Host "[1/3] 构建 Java 项目..." -ForegroundColor Yellow
    Set-Location "$ProjectDir\services"
    mvn clean package -DskipTests
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Maven 构建失败！" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "[2/3] 构建 Docker 镜像..." -ForegroundColor Yellow
    Set-Location $ProjectDir
    docker-compose build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker 构建失败！" -ForegroundColor Red
        exit 1
    }
}

# 2. 重新标记镜像
Write-Host ""
Write-Host "[3/3] 标记并推送镜像..." -ForegroundColor Yellow

foreach ($service in $services) {
    $localImage = "microservices/${service}:latest"
    $remoteImage = "${Registry}/${service}:${Tag}"
    
    Write-Host "  标记: $localImage -> $remoteImage" -ForegroundColor Gray
    docker tag $localImage $remoteImage
    
    if ($Push) {
        Write-Host "  推送: $remoteImage" -ForegroundColor Gray
        docker push $remoteImage
        if ($LASTEXITCODE -ne 0) {
            Write-Host "推送失败: $remoteImage" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  完成！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

if ($Push) {
    Write-Host "镜像已推送到远程仓库：" -ForegroundColor Cyan
} else {
    Write-Host "镜像已标记（未推送），可使用以下命令推送：" -ForegroundColor Cyan
}

foreach ($service in $services) {
    Write-Host "  ${Registry}/${service}:${Tag}" -ForegroundColor White
}

if (-not $Push) {
    Write-Host ""
    Write-Host "推送命令：" -ForegroundColor Yellow
    foreach ($service in $services) {
        Write-Host "  docker push ${Registry}/${service}:${Tag}" -ForegroundColor Gray
    }
}
