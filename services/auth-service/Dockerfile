# ==================== Auth Service Dockerfile (多阶段构建) ====================
# 构建上下文：./services（包含父 pom.xml 和所有模块）
# 认证服务：注册、登录、Token 签发与刷新，调用 user-service 内部 API

# 阶段1：构建 jar 文件
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /build

# 配置 Maven 使用阿里云镜像（加速依赖下载）
COPY .m2/settings.xml /root/.m2/settings.xml

COPY pom.xml .
COPY api-common/pom.xml ./api-common/
COPY auth-service/pom.xml ./auth-service/
COPY user-service/pom.xml ./user-service/
COPY order-service/pom.xml ./order-service/
COPY chat-service/pom.xml ./chat-service/
COPY api-gateway/pom.xml ./api-gateway/
COPY config-server/pom.xml ./config-server/

RUN mvn dependency:go-offline -B -pl auth-service -am || true

COPY api-common ./api-common
COPY auth-service ./auth-service

RUN mvn clean package -DskipTests -B -pl auth-service -am

# 阶段2：运行镜像
FROM eclipse-temurin:17-jdk-alpine

LABEL maintainer="example@example.com"
LABEL description="Auth Service - 认证微服务（注册、登录、JWT 签发与刷新）"

WORKDIR /app

RUN apk add --no-cache curl wget

COPY --from=builder /build/auth-service/target/auth-service.jar app.jar

# 下载 Skywalking Agent（失败不中断构建）
RUN wget -q https://archive.apache.org/dist/skywalking/9.3.0/apache-skywalking-java-agent-9.3.0.tar.gz \
    -O skywalking-agent.tar.gz && \
    tar -xzf skywalking-agent.tar.gz && \
    rm skywalking-agent.tar.gz || \
    echo "⚠️  Skywalking Agent download skipped (可选, 非关键)"

# Skywalking 配置（支持可选agent）
ENV SERVICE_NAME=auth-service
ENV SW_AGENT_NAMESPACE=spring-cloud
ENV JAVA_OPTS="-Dskywalking.agent.service_name=auth-service \
    -Dskywalking.logging.level=info"

# 条件式添加Agent JVM参数（如果Agent存在）
RUN if [ -f /app/skywalking-agent/skywalking-agent.jar ]; then \
      echo "export JAVA_OPTS=\"-javaagent:/app/skywalking-agent/skywalking-agent.jar -Dskywalking.collector.backend_service=skywalking-oap:11800 \$JAVA_OPTS\"" >> /app/env.sh; \
    else \
      echo "# Skywalking Agent not available" >> /app/env.sh; \
    fi

EXPOSE 8002

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8002/actuator/health || exit 1

# 使用shell脚本启动以支持动态JVM参数
ENTRYPOINT ["/bin/sh", "-c", "exec java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-docker} -jar app.jar"]
