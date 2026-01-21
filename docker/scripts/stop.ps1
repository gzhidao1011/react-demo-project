# ==================== 停止脚本 (PowerShell) ====================
# 用于停止微服务环境

param(
    [switch]$RemoveVolumes,
    [switch]$RemoveImages
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = (Get-Item "$ScriptDir\..\..").FullName

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  微服务停止脚本" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $ProjectDir

if ($RemoveVolumes) {
    Write-Host "停止服务并删除数据卷..." -ForegroundColor Yellow
    docker-compose down -v
} else {
    Write-Host "停止服务..." -ForegroundColor Yellow
    docker-compose down
}

if ($RemoveImages) {
    Write-Host "删除镜像..." -ForegroundColor Yellow
    docker rmi microservices/user-service:latest -f 2>$null
    docker rmi microservices/order-service:latest -f 2>$null
    docker rmi microservices/api-gateway:latest -f 2>$null
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  服务已停止！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
