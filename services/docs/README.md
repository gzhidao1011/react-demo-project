# 后端服务文档索引

本文档提供后端微服务相关文档的导航。

---

## 核心文档

| 文档 | 说明 |
|------|------|
| [architecture.md](./architecture.md) | 微服务架构说明（Nacos、Dubbo、Sentinel、API Gateway） |
| [ARCHITECTURE_ANALYSIS.md](./ARCHITECTURE_ANALYSIS.md) | 架构符合度分析报告 |
| [local-dev-analysis.md](./local-dev-analysis.md) | 本地开发启动模式分析 |
| [docker-deployment.md](./docker-deployment.md) | Docker 部署与发布 |

## 开发指南

| 文档 | 说明 |
|------|------|
| [java-microservices-guide.md](./java-microservices-guide.md) | Java 微服务从零搭建教程 |
| [jwt-authentication-guide.md](./jwt-authentication-guide.md) | JWT 认证授权设计文档 |
| [mybatis-migration-guide.md](./mybatis-migration-guide.md) | JPA 迁移至 MyBatis 说明 |
| [saga-pattern.md](./saga-pattern.md) | Saga 分布式事务模式 |

## 可观测性 & 日志系统

| 文档 | 说明 |
|------|------|
| [LOG_SYSTEM_IMPLEMENTATION_SUMMARY.md](./LOG_SYSTEM_IMPLEMENTATION_SUMMARY.md) | 日志系统实现总结 |
| [LOG_DEPLOYMENT_GUIDE.md](./LOG_DEPLOYMENT_GUIDE.md) | ELK 部署指南 |
| [LOG_IMPLEMENTATION_STEPS.md](./LOG_IMPLEMENTATION_STEPS.md) | 日志国际标准实施步骤 |
| [LOG_BEST_PRACTICES_INTERNATIONAL.md](./LOG_BEST_PRACTICES_INTERNATIONAL.md) | 国际主流日志最佳实践 |

## 架构增强方案

| 文档 | 说明 |
|------|------|
| [enterprise-architecture-plan.md](./enterprise-architecture-plan.md) | 企业级架构规划（任务清单） |
| [phase1-detailed-implementation-guide.md](./phase1-detailed-implementation-guide.md) | Phase 1 可观测性详细实施指南 |
| [微服务架构增强方案/](./微服务架构增强方案/README.md) | 拆分版方案（✅ Phase 1-2 已完成 / Phase 3 待实施） |

---

## 与根文档的关系

- **根 docs/**：前端开发、全栈开发流程、API 文档、故障排除
- **services/docs/**：后端微服务架构、Java 开发、Docker 部署

## 快速入口

- **本地启动**：`make up && make dev`
- **启动 Kafka**：`docker-compose up -d zookeeper kafka kafka-ui`
- **Kafka UI**：http://localhost:8085
- **了解架构**：[architecture.md](./architecture.md)
- **学习微服务**：[java-microservices-guide.md](./java-microservices-guide.md)
- **认证开发**：[jwt-authentication-guide.md](./jwt-authentication-guide.md)
- **部署服务**：[docker-deployment.md](./docker-deployment.md)
