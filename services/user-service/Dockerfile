# ==================== User Service Dockerfile (多阶段构建) ====================
# 支持在 Docker 构建时自动编译，无需预先构建 jar 文件
# 构建上下文：./services（包含父 pom.xml 和所有模块）
# 
# 多阶段构建优势：
# 1. 一次命令完成构建：docker-compose up -d --build
# 2. 不依赖本地 Maven 环境
# 3. CI/CD 友好，构建环境一致
# 4. 最终镜像更小（只包含运行时依赖）

# 阶段1：构建 jar 文件
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /build

# 步骤1：复制父 pom.xml 和所有模块的 pom.xml（利用 Docker 缓存层）
# 如果依赖没变化，这层会被缓存，大幅提升构建速度
COPY pom.xml .
COPY api-common/pom.xml ./api-common/
COPY user-service/pom.xml ./user-service/
COPY order-service/pom.xml ./order-service/
COPY chat-service/pom.xml ./chat-service/
COPY api-gateway/pom.xml ./api-gateway/

# 步骤2：下载依赖（利用缓存，如果 pom.xml 没变化就不重新下载）
# 使用 -am (also-make) 确保依赖的模块也被处理
RUN mvn dependency:go-offline -B -pl user-service -am || true

# 步骤3：复制源代码（代码变化时才重新编译）
COPY api-common ./api-common
COPY user-service ./user-service

# 步骤4：构建 jar 文件（只构建 user-service 及其依赖的 api-common）
RUN mvn clean package -DskipTests -B -pl user-service -am

# 阶段2：运行镜像（最小化镜像大小）
FROM eclipse-temurin:17-jdk-alpine

LABEL maintainer="example@example.com"
LABEL description="User Service - 用户微服务"

WORKDIR /app

# 安装必要工具（仅运行时需要的）
RUN apk add --no-cache curl

# 从构建阶段复制 jar 文件（只复制编译产物，不包含构建工具）
COPY --from=builder /build/user-service/target/user-service.jar app.jar

# 暴露端口
EXPOSE 8001 20880

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8001/actuator/health || exit 1

# 启动应用
ENTRYPOINT ["java", "-jar", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-docker}", \
    "app.jar"]
