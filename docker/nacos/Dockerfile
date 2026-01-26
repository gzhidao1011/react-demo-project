# ==================== Nacos Dockerfile for Render ====================
# 
# 此 Dockerfile 用于在 Render 平台上部署 Nacos 服务
# 
# Render 环境特点：
#   - 使用 MySQL 数据库
#   - 使用环境变量配置
#   - 端口由 Render 自动分配
#
# ================================================================

FROM nacos/nacos-server:v2.3.0

LABEL maintainer="example@example.com"
LABEL description="Nacos Server for Render Platform"

# 暴露端口（Render 会自动映射）
EXPOSE 8848 9848 9849

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8848/nacos/v1/console/health/readiness || exit 1

# 环境变量在 render.yaml 中配置
# Nacos 会自动读取环境变量并应用配置
