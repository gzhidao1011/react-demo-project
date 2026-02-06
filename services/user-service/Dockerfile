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

# 配置 Maven 使用阿里云镜像（加速依赖下载）
COPY .m2/settings.xml /root/.m2/settings.xml

# 步骤1：复制父 pom.xml 和所有模块的 pom.xml（利用 Docker 缓存层）
# 如果依赖没变化，这层会被缓存，大幅提升构建速度
COPY pom.xml .
COPY api-common/pom.xml ./api-common/
COPY auth-service/pom.xml ./auth-service/
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
RUN apk add --no-cache curl wget

# 从构建阶段复制 jar 文件（只复制编译产物，不包含构建工具）
COPY --from=builder /build/user-service/target/user-service.jar app.jar

# 下载 Skywalking Agent（失败不中断构建）
RUN wget -q https://archive.apache.org/dist/skywalking/9.3.0/apache-skywalking-java-agent-9.3.0.tar.gz \
    -O skywalking-agent.tar.gz && \
    tar -xzf skywalking-agent.tar.gz && \
    rm skywalking-agent.tar.gz || \
    echo "⚠️  Skywalking Agent download skipped (可选, 非关键)"

# Skywalking 配置（支持可选agent）
ENV SERVICE_NAME=user-service
ENV SW_AGENT_NAMESPACE=spring-cloud
ENV JAVA_OPTS="-Dskywalking.agent.service_name=user-service \
    -Dskywalking.logging.level=info"

# 暴露端口
EXPOSE 8001 20880

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8001/actuator/health || exit 1

# 使用shell脚本启动以支持动态JVM参数
ENTRYPOINT ["/bin/sh", "-c", "exec java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-docker} -jar app.jar"]
