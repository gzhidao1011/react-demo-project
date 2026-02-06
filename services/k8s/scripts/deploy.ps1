# Kubernetes 部署脚本 (PowerShell)
# 使用方法: .\deploy.ps1 [environment]
# 示例: .\deploy.ps1 development
#       .\deploy.ps1 production

param(
    [string]$Environment = "development"
)

$ErrorActionPreference = "Stop"
$Namespace = "microservices"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$K8sDir = Split-Path -Parent $ScriptDir

Write-Host "========================================"
Write-Host "Deploying to $Environment environment..."
Write-Host "========================================"

# 检查 kubectl 是否可用
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Error "Error: kubectl is not installed or not in PATH"
    exit 1
}

# 检查集群连接
try {
    kubectl cluster-info | Out-Null
} catch {
    Write-Error "Error: Cannot connect to Kubernetes cluster"
    exit 1
}

# 创建命名空间（如果不存在）
Write-Host "Creating namespace..."
kubectl apply -f "$K8sDir\base\namespace.yaml"

# 应用 Kustomize 配置
Write-Host "Applying Kustomize configuration for $Environment..."
kubectl apply -k "$K8sDir\overlays\$Environment"

# 等待部署完成
Write-Host "Waiting for deployments to be ready..."

$Deployments = @("user-service", "order-service", "auth-service", "chat-service")

foreach ($Deployment in $Deployments) {
    Write-Host "Waiting for $Deployment..."
    try {
        kubectl -n $Namespace rollout status "deployment/$Deployment" --timeout=300s
    } catch {
        Write-Warning "$Deployment deployment may not be ready yet"
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "Deployment completed!"
Write-Host "========================================"

# 显示 Pod 状态
Write-Host ""
Write-Host "Pod Status:"
kubectl -n $Namespace get pods -o wide

# 显示 Service 状态
Write-Host ""
Write-Host "Service Status:"
kubectl -n $Namespace get services

# 显示 HPA 状态
Write-Host ""
Write-Host "HPA Status:"
kubectl -n $Namespace get hpa 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "No HPA found"
}

# 显示 Ingress 状态（仅生产环境）
if ($Environment -eq "production") {
    Write-Host ""
    Write-Host "Ingress Status:"
    kubectl -n $Namespace get ingress 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "No Ingress found"
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "Deployment Summary"
Write-Host "========================================"
Write-Host "Environment: $Environment"
Write-Host "Namespace: $Namespace"
Write-Host ""
Write-Host "Access the services:"
if ($Environment -eq "development") {
    Write-Host "  - Use kubectl port-forward to access services locally"
    Write-Host "  - Example: kubectl -n $Namespace port-forward svc/user-service 8001:8001"
} else {
    Write-Host "  - Configure your Ingress controller and DNS"
    Write-Host "  - API endpoint: https://api.yourdomain.com"
}
