# 项目文档索引

本文档提供项目文档的完整导航，帮助快速找到所需信息。

## 快速入口

| 文档 | 说明 | 适用场景 |
|------|------|----------|
| [快速开始](./quick-start.md) | 三步启动本地开发 | 新成员首次启动 |
| [本地开发指南](./local-development-guide.md) | 完整的开发环境设置和流程 | 详细开发配置 |
| [开发者指南](./developer-guide.md) | 项目规范与开发命令速查 | 日常开发参考 |

## 文档分类

### 开发指南

| 文档 | 说明 |
|------|------|
| [quick-start.md](./quick-start.md) | 最简启动步骤（3 步） |
| [local-development-guide.md](./local-development-guide.md) | 完整开发环境、前后端流程、常见问题 |
| [developer-guide.md](./developer-guide.md) | 项目结构、代码规范、测试、构建命令 |

### API 文档

| 文档 | 说明 |
|------|------|
| [api/auth-api.md](./api/auth-api.md) | 认证 API（注册、登录、Token 刷新） |

### Docker 与部署

| 文档 | 说明 |
|------|------|
| [docker/docker-guide.md](./docker/docker-guide.md) | Docker 构建、部署、故障排除（整合版） |
| [docker/docker-compose-reference.md](./docker/docker-compose-reference.md) | Docker Compose 配置参考 |

### 故障排除

| 文档 | 说明 |
|------|------|
| [troubleshooting.md](./troubleshooting.md) | 常见问题与解决方案（端口冲突、API 404、镜像构建等） |

### 后端服务文档

后端微服务相关文档位于 `services/docs/`：

| 文档 | 说明 |
|------|------|
| [services/docs/architecture.md](../services/docs/architecture.md) | 微服务架构说明（Nacos、Dubbo、Sentinel） |
| [services/docs/docker-deployment.md](../services/docs/docker-deployment.md) | 后端服务 Docker 部署 |
| [services/docs/java-microservices-guide.md](../services/docs/java-microservices-guide.md) | Java 微服务从零搭建教程 |
| [services/docs/jwt-authentication-guide.md](../services/docs/jwt-authentication-guide.md) | JWT 认证设计文档 |
| [services/docs/mybatis-migration-guide.md](../services/docs/mybatis-migration-guide.md) | JPA 迁移至 MyBatis 说明 |

### 项目规范（Cursor Rules）

项目开发规范位于 `.cursor/rules/`，详见 [.cursor/rules/README.md](../.cursor/rules/README.md)。

主要规范包括：

- 代码风格、TypeScript、格式化
- 表单验证、表单错误处理
- API 结构、组件库、设计系统
- Git 提交、PR 工作流、部署发布
- 认证服务架构、安全规范

### 实施计划

| 文档 | 说明 |
|------|------|
| [.cursor/plans/注册登录功能实现计划/](../.cursor/plans/注册登录功能实现计划/) | 注册登录功能分阶段实施计划 |

## 推荐阅读路径

### 新成员入门

1. [快速开始](./quick-start.md) - 启动项目
2. [本地开发指南](./local-development-guide.md) - 了解完整流程
3. [开发者指南](./developer-guide.md) - 熟悉规范与命令

### 开发新功能

1. [开发者指南](./developer-guide.md) - 代码规范
2. [.cursor/rules/](../.cursor/rules/) - 具体规范（表单、API、组件等）
3. [api/auth-api.md](./api/auth-api.md) - API 接口

### 部署与运维

1. [docker/docker-guide.md](./docker/docker-guide.md) - Docker 使用
2. [troubleshooting.md](./troubleshooting.md) - 故障排除
3. [services/docs/docker-deployment.md](../services/docs/docker-deployment.md) - 后端部署

### 后端开发

1. [services/docs/architecture.md](../services/docs/architecture.md) - 架构理解
2. [services/docs/java-microservices-guide.md](../services/docs/java-microservices-guide.md) - 微服务教程
3. [services/docs/jwt-authentication-guide.md](../services/docs/jwt-authentication-guide.md) - 认证设计

## 文档更新说明

- **最后整理**：2026-01-30
- **变更**：删除已整合的冗余文档（api-gateway-404-fix、port-conflict-resolution、docker-build-guide、docker-compose-analysis），删除无用文档（services/docs/dockerinstall.txt）
- **变更记录**：参见 [CHANGELOG-DOCS.md](./CHANGELOG-DOCS.md)
