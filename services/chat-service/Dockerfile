# ==================== Chat Service Dockerfile (多阶段构建) ====================
# 构建上下文：./services
# 多阶段构建：编译 + 运行

# 阶段1：构建 jar 文件
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /build

COPY pom.xml .
COPY api-common/pom.xml ./api-common/
COPY auth-service/pom.xml ./auth-service/
COPY user-service/pom.xml ./user-service/
COPY order-service/pom.xml ./order-service/
COPY chat-service/pom.xml ./chat-service/
COPY api-gateway/pom.xml ./api-gateway/

RUN mvn dependency:go-offline -B -pl chat-service -am || true

COPY api-common ./api-common
COPY chat-service ./chat-service

RUN mvn clean package -DskipTests -B -pl chat-service -am

# 阶段2：运行镜像
FROM eclipse-temurin:17-jdk-alpine

LABEL maintainer="example@example.com"
LABEL description="Chat Service - Chat 微服务（SSE 流式对话）"

WORKDIR /app

RUN apk add --no-cache curl

COPY --from=builder /build/chat-service/target/chat-service.jar app.jar

EXPOSE 8003

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8003/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-docker}", \
    "app.jar"]
