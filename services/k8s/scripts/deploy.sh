#!/bin/bash
# Kubernetes 部署脚本
# 使用方法: ./deploy.sh [environment]
# 示例: ./deploy.sh development
#       ./deploy.sh production

set -e

ENVIRONMENT=${1:-development}
NAMESPACE="microservices"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo "Deploying to $ENVIRONMENT environment..."
echo "========================================"

# 检查 kubectl 是否可用
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed or not in PATH"
    exit 1
fi

# 检查集群连接
if ! kubectl cluster-info &> /dev/null; then
    echo "Error: Cannot connect to Kubernetes cluster"
    exit 1
fi

# 创建命名空间（如果不存在）
echo "Creating namespace..."
kubectl apply -f "$K8S_DIR/base/namespace.yaml"

# 应用 Kustomize 配置
echo "Applying Kustomize configuration for $ENVIRONMENT..."
kubectl apply -k "$K8S_DIR/overlays/$ENVIRONMENT"

# 等待部署完成
echo "Waiting for deployments to be ready..."

DEPLOYMENTS=("user-service" "order-service" "auth-service" "chat-service")

for DEPLOYMENT in "${DEPLOYMENTS[@]}"; do
    echo "Waiting for $DEPLOYMENT..."
    if ! kubectl -n "$NAMESPACE" rollout status "deployment/$DEPLOYMENT" --timeout=300s 2>/dev/null; then
        echo "Warning: $DEPLOYMENT deployment may not be ready yet"
    fi
done

echo ""
echo "========================================"
echo "Deployment completed!"
echo "========================================"

# 显示 Pod 状态
echo ""
echo "Pod Status:"
kubectl -n "$NAMESPACE" get pods -o wide

# 显示 Service 状态
echo ""
echo "Service Status:"
kubectl -n "$NAMESPACE" get services

# 显示 HPA 状态
echo ""
echo "HPA Status:"
kubectl -n "$NAMESPACE" get hpa 2>/dev/null || echo "No HPA found"

# 显示 Ingress 状态（仅生产环境）
if [ "$ENVIRONMENT" = "production" ]; then
    echo ""
    echo "Ingress Status:"
    kubectl -n "$NAMESPACE" get ingress 2>/dev/null || echo "No Ingress found"
fi

echo ""
echo "========================================"
echo "Deployment Summary"
echo "========================================"
echo "Environment: $ENVIRONMENT"
echo "Namespace: $NAMESPACE"
echo ""
echo "Access the services:"
if [ "$ENVIRONMENT" = "development" ]; then
    echo "  - Use kubectl port-forward to access services locally"
    echo "  - Example: kubectl -n $NAMESPACE port-forward svc/user-service 8001:8001"
else
    echo "  - Configure your Ingress controller and DNS"
    echo "  - API endpoint: https://api.yourdomain.com"
fi
