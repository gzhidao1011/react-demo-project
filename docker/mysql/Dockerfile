# ==================== MySQL Dockerfile for Render ====================
# 
# 此 Dockerfile 用于在 Render 平台上部署 MySQL 数据库
# 
# Render 环境特点：
#   - 需要通过 Docker 部署（不是托管服务）
#   - 需要配置 Render Disk 持久化存储
#   - 使用环境变量配置
#
# 配置步骤：
#   1. 在 render.yaml 中配置 MySQL 服务
#   2. 在 Render Dashboard 中为 MySQL 服务添加 Render Disk
#      - Mount Path: /var/lib/mysql（必须）
#      - Size: 10 GB（根据需求调整）
#
# ================================================================

FROM mysql:8.0

LABEL maintainer="example@example.com"
LABEL description="MySQL Database for Render Platform"

# 暴露端口
EXPOSE 3306

# 环境变量在 render.yaml 中配置：
# - MYSQL_DATABASE: 数据库名称
# - MYSQL_USER: 数据库用户名
# - MYSQL_PASSWORD: 数据库用户密码
# - MYSQL_ROOT_PASSWORD: root 用户密码

# MySQL 配置
# 数据目录：/var/lib/mysql（必须与 Render Disk 的 Mount Path 一致）
# 配置文件：/etc/mysql/conf.d/

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} || exit 1

# 启动命令（MySQL 镜像会自动处理）
# CMD 由 MySQL 镜像提供，无需覆盖
