# 开发者指南

本文档为开发者提供项目开发、测试和部署的**速查指南**。详细说明请参考相关文档。

## 文档导航

- **快速启动**：参见 [quick-start.md](./quick-start.md)
- **完整开发流程**：参见 [local-development-guide.md](./local-development-guide.md)
- **故障排除**：参见 [troubleshooting.md](./troubleshooting.md)
- **Docker 部署**：参见 [docker/docker-guide.md](./docker/docker-guide.md)

## 项目结构

项目采用 monorepo 结构（使用 pnpm workspace + Turborepo）：

```
react-demo-project/
├── apps/                    # 应用目录
│   ├── web/                 # Web 应用（React Router）
│   ├── docs/                # 文档应用
│   └── storybook/           # Storybook 组件展示
├── packages/                # 共享包目录
│   ├── ui/                  # UI 组件库
│   ├── utils/               # 工具函数库
│   ├── services/            # API 服务库
│   ├── schemas/             # Zod Schema 定义
│   └── propel/              # 增强组件库
├── services/                # 后端服务（Java）
│   ├── user-service/        # 用户服务
│   ├── order-service/       # 订单服务
│   └── api-gateway/         # API 网关
└── docs/                    # 项目文档
```

## 常用命令速查

### 前端

```bash
pnpm dev                    # 启动开发服务器
pnpm build                  # 构建所有应用
pnpm test                   # 运行测试
pnpm --filter @repo/web test:e2e   # E2E 测试
```

### 后端

```bash
cd services
make up                     # 启动基础设施
make dev                    # 一键启动所有微服务
make gateway-compose        # 网关自动拉起基础设施
make user / order / gateway # 单独启动某服务
make build                  # 构建 jar
make test                   # 单元测试
make help                   # 查看所有命令
```

### Docker

```bash
pnpm dev:infra              # 启动基础设施（MySQL、Redis、Nacos、Sentinel）
docker-compose up -d        # 启动所有服务
```

## 开发规范

- **代码风格**：TypeScript 严格模式，Prettier 格式化，Biome Lint
- **组件开发**：`packages/ui/`（基础）或 `packages/propel/`（增强），Tailwind CSS
- **API 调用**：使用 `@repo/services`，`handleServerError` 处理错误

## 相关规范文档

- [代码风格](../.cursor/rules/01-代码风格.mdc)
- [组件库与主题系统](../.cursor/rules/11-组件库与主题系统.mdc)
- [API 结构](../.cursor/rules/06-API结构.mdc)
- [测试与覆盖率](../.cursor/rules/20-测试与覆盖率规范.mdc)
