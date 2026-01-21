# ==================== Order Service Dockerfile ====================
# 需要先在本地构建 jar 包：mvn clean package -DskipTests
# 然后再构建 Docker 镜像

FROM eclipse-temurin:17-jdk-alpine

LABEL maintainer="example@example.com"
LABEL description="Order Service - 订单微服务"

WORKDIR /app

# 安装必要工具
RUN apk add --no-cache curl

# 复制 jar 文件（需要先本地构建）
COPY target/order-service.jar app.jar

# 暴露端口
EXPOSE 8002 20881

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8002/actuator/health || exit 1

# 启动应用
ENTRYPOINT ["java", "-jar", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-docker}", \
    "app.jar"]
