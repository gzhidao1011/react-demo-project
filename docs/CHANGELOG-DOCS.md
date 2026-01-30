# 文档整理变更记录

**整理日期**：2026-01-29

## 变更概述

本次文档整理完成了以下工作：

1. **创建统一索引** - 建立 `docs/README.md` 作为文档主入口
2. **合并重复内容** - 整合故障排除、Docker 相关文档
3. **精简开发者指南** - 将 `developer-guide.md` 改为速查版，避免与 `local-development-guide.md` 重复
4. **建立文档层级** - 明确 docs/ 与 services/docs/ 的职责划分

## 新增文档

| 文档 | 说明 |
|------|------|
| `docs/README.md` | 文档主索引，提供完整导航 |
| `docs/troubleshooting.md` | 故障排除指南（整合端口冲突、API 404、镜像构建等） |
| `docs/docker/docker-guide.md` | Docker 构建与部署指南（整合版） |
| `docs/docker/docker-compose-reference.md` | Docker Compose 配置参考 |
| `services/docs/README.md` | 后端服务文档索引 |

## 已整合并删除的文档

以下文档内容已整合至新文档，原文件已删除：

| 原文档 | 整合至 |
|--------|--------|
| `api-gateway-404-fix.md` | `troubleshooting.md` |
| `port-conflict-resolution.md` | `troubleshooting.md` |
| `docker-build-guide.md` | `docker/docker-guide.md` |
| `docker-compose-analysis.md` | `docker/docker-compose-reference.md` |

## 已删除的无用文档

| 文档 | 原因 |
|------|------|
| `services/docs/dockerinstall.txt` | 仅含 2 条 docker run 命令，与 docker-compose 及 docker-deployment.md 重复 |

## 文档结构（整理后）

```
docs/
├── README.md                    # 主索引
├── quick-start.md               # 快速开始
├── local-development-guide.md  # 完整开发指南
├── developer-guide.md           # 开发者速查（精简）
├── troubleshooting.md           # 故障排除（整合版）
├── CHANGELOG-DOCS.md            # 文档变更记录
├── api/
│   └── auth-api.md              # 认证 API
└── docker/                      # Docker 文档
    ├── docker-guide.md          # 构建与部署（整合版）
    └── docker-compose-reference.md  # 配置参考

services/docs/
├── README.md                    # 后端文档索引
├── architecture.md
├── docker-deployment.md
├── java-microservices-guide.md
├── jwt-authentication-guide.md
├── mybatis-migration-guide.md
└── enterprise-architecture-plan.md
```

## 推荐阅读路径

- **新成员**：`quick-start.md` → `local-development-guide.md` → `developer-guide.md`
- **故障排除**：`troubleshooting.md`
- **Docker 部署**：`docker/docker-guide.md`
- **后端开发**：`services/docs/README.md` → `architecture.md`

## 后续建议

1. **维护**：新增文档时更新 `docs/README.md` 索引
2. **规范**：遵循 `.cursor/rules/` 中的文档规范
