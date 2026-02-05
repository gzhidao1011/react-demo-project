# ==================== Microservices Local Dev Makefile ====================
# Usage: cd services && make [target]
# Cross-platform, no Node.js required
# ================================================================

.PHONY: up down dev dev-full build test clean help user auth order chat gateway gateway-compose

# Project root (Makefile is under services/)
ROOT_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))..
COMPOSE_FILE := $(ROOT_DIR)/docker-compose.yml

# 加载 .env 环境变量（OPENAI_API_KEY 等），供 make dev / make chat 等使用
ifneq (,$(wildcard .env))
    include .env
    export
endif

# Cross-platform sleep (Windows lacks 'sleep' command)
# OS=Windows_NT 或 COMSPEC 含 cmd 表示 Windows
ifeq ($(OS),Windows_NT)
	SLEEP = powershell -Command "Start-Sleep -Seconds 10"
else
ifeq ($(findstring cmd,$(COMSPEC)),cmd)
	SLEEP = powershell -Command "Start-Sleep -Seconds 10"
else
	SLEEP = sleep 10
endif
endif

# Default target
.DEFAULT_GOAL := help

help:
	@echo "Microservices local dev commands:"
	@echo "  make up       - Start infra (MySQL, Redis, Nacos, Sentinel, Elasticsearch, Logstash, Kibana)"
	@echo "  make down     - Stop infra"
	@echo "  make dev      - Start all microservices (必须先 make up 并等约 10 秒)"
	@echo "  make dev-full - 先 make up，等 10 秒，再 make dev（推荐首次启动）"
	@echo "                  Ctrl+C 停止后若出现 BUILD FAILURE，属预期，可忽略"
	@echo "  make build    - Build all jar packages"
	@echo "  make test     - Run all tests"
	@echo "  make clean    - Clean build artifacts"
	@echo ""
	@echo "Start individual services:"
	@echo "  make user    - User service only"
	@echo "  make auth    - Auth service only"
	@echo "  make order   - Order service only"
	@echo "  make chat    - Chat service only"
	@echo "  make gateway - API gateway only"
	@echo "  make gateway-compose - Start gateway (auto-start infra, no make up needed)"

# Start infrastructure (same as pnpm dev:infra)
up:
	@echo "Starting infra (MySQL, Redis, Nacos, Sentinel, Elasticsearch, Logstash, Kibana)..."
	cd $(ROOT_DIR) && docker-compose up -d mysql redis nacos sentinel elasticsearch logstash kibana
	@echo "Infra started, waiting for services..."
	@$(SLEEP)
	cd $(ROOT_DIR) && docker-compose ps mysql redis nacos sentinel elasticsearch logstash kibana

# Stop infrastructure
down:
	@echo "Stopping infra..."
	cd $(ROOT_DIR) && docker-compose down
	@echo "Stopped"

# Start all microservices (parallel, no Node.js required)
# 必须先 make up 启动 Nacos/MySQL/Redis，否则会报 Connection refused (localhost:8848/9848)
# 主流做法：同一终端并行执行，Ctrl+C 可同时停止所有服务
# Windows: PowerShell Start-Process -NoNewWindow 并行执行，输出混在同一终端
# Linux/Mac: 原生 & 后台执行 + wait
# 注意：Ctrl+C 停止后 Maven 可能报 BUILD FAILURE / Process terminated with exit code: 1，属预期（进程被中断），可忽略
ifeq ($(OS),Windows_NT)
SERVICES_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
dev:
	@echo ">>> 请确认已执行 make up 且 Nacos/Elasticsearch 已就绪（约 10 秒），否则会报 Connection refused"
	@echo ">>> 若端口 8080/8001/8002/8003/8004 被占用，请先停止正在运行的 make dev（Ctrl+C）"
	@echo ">>> Ctrl+C 停止后若出现 BUILD FAILURE（exit code: 1），属预期，可忽略"
	@echo "Starting all microservices (API Gateway, Auth Service, User Service, Order Service, Chat Service)..."
	@echo "Press Ctrl+C to stop all services (same terminal, mainstream approach)"
	@powershell -NoProfile -Command "$$d='$(SERVICES_DIR)'; $$env:SPRING_PROFILES_ACTIVE='local'; $$p1=Start-Process -NoNewWindow -PassThru -WorkingDirectory $$d mvn -ArgumentList 'spring-boot:run','-pl','api-gateway'; $$p2=Start-Process -NoNewWindow -PassThru -WorkingDirectory $$d mvn -ArgumentList 'spring-boot:run','-pl','auth-service'; $$p3=Start-Process -NoNewWindow -PassThru -WorkingDirectory $$d mvn -ArgumentList 'spring-boot:run','-pl','user-service'; $$p4=Start-Process -NoNewWindow -PassThru -WorkingDirectory $$d mvn -ArgumentList 'spring-boot:run','-pl','order-service'; $$p5=Start-Process -NoNewWindow -PassThru -WorkingDirectory $$d mvn -ArgumentList 'spring-boot:run','-pl','chat-service'; $$p1,$$p2,$$p3,$$p4,$$p5 | Wait-Process"
else
dev:
	@echo ">>> 请确认已执行 make up 且 Nacos/Elasticsearch 已就绪（约 10 秒），否则会报 Connection refused"
	@echo ">>> 若端口 8080/8001/8002/8003/8004 被占用，请先停止正在运行的 make dev（Ctrl+C）"
	@echo "Starting all microservices (API Gateway, Auth Service, User Service, Order Service, Chat Service)..."
	@echo "Press Ctrl+C to stop all services"
	SPRING_PROFILES_ACTIVE=local mvn spring-boot:run -pl api-gateway & \
	SPRING_PROFILES_ACTIVE=local mvn spring-boot:run -pl auth-service & \
	SPRING_PROFILES_ACTIVE=local mvn spring-boot:run -pl user-service & \
	SPRING_PROFILES_ACTIVE=local mvn spring-boot:run -pl order-service & \
	SPRING_PROFILES_ACTIVE=local mvn spring-boot:run -pl chat-service & \
	wait
endif

# 一键启动：先启动基础设施，等待后启动所有微服务（推荐首次或 make down 后使用）
dev-full: up
	@echo "Waiting 10s for Nacos/MySQL/Redis to be ready..."
	@$(SLEEP)
	@$(MAKE) dev

# Build
build:
	@echo "Building all microservices..."
	mvn clean package -DskipTests
	@echo "Build complete"

# Test
test:
	@echo "Running tests..."
	mvn test
	@echo "Tests complete"

# Clean
clean:
	@echo "Cleaning build artifacts..."
	mvn clean
	@echo "Clean complete"

# Start individual services
user:
	@echo "Starting user service..."
	mvn spring-boot:run -pl user-service

auth:
	@echo "Starting auth service..."
	mvn spring-boot:run -pl auth-service

order:
	@echo "Starting order service..."
	mvn spring-boot:run -pl order-service

chat:
	@echo "Starting chat service..."
	mvn spring-boot:run -pl chat-service

gateway:
	@echo "Starting API gateway..."
	mvn spring-boot:run -pl api-gateway

# Start gateway with auto infra (Spring Boot Docker Compose)
gateway-compose:
	@echo "Starting API gateway (auto-start MySQL, Redis, Nacos, Sentinel)..."
	mvn spring-boot:run -pl api-gateway -Dspring-boot.run.profiles=docker-compose
