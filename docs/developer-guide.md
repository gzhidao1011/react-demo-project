# 开发者指南

本文档为开发者提供项目开发、测试和部署的详细指南。

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
│   └── api-gateway/         # API 网关
└── docs/                    # 项目文档
```

## 开发环境设置

### 前置要求

- Node.js >= 22
- pnpm >= 10.28.0
- Java 17+
- Maven 3.8+
- Docker（用于 Redis、MySQL 等）

### 安装步骤

1. **克隆仓库**

```bash
git clone <repository-url>
cd react-demo-project
```

2. **安装依赖**

```bash
pnpm install
```

3. **启动开发服务器**

```bash
# 启动前端开发服务器
pnpm --filter @repo/web dev

# 启动后端服务（需要先启动 Redis、MySQL）
cd services/user-service
mvn spring-boot:run
```

## 开发规范

### 代码风格

- **TypeScript**：使用严格模式，避免 `any`
- **格式化**：使用 Prettier，保存时自动格式化
- **Lint**：使用 Biome，运行 `pnpm check` 检查

### 组件开发

- **组件位置**：`packages/ui/src/`（基础组件）或 `packages/propel/src/`（增强组件）
- **样式**：优先使用 Tailwind CSS，复杂样式使用 CSS
- **主题**：使用 CSS 变量（`var(--color-primary)` 等）

### API 调用

- **统一使用**：`@repo/services` 包中的 API 服务函数
- **错误处理**：使用 `handleServerError` 统一处理错误
- **Token 管理**：自动处理，无需手动管理

## 测试

### 单元测试

```bash
# 运行所有单元测试
pnpm test

# 运行特定包的测试
pnpm --filter @repo/web test
pnpm --filter @repo/utils test

# 生成覆盖率报告
pnpm test:coverage
```

### E2E 测试

```bash
# 运行 E2E 测试
pnpm --filter @repo/web test:e2e

# 交互式 UI 模式
pnpm --filter @repo/web test:e2e:ui
```

### 后端测试

```bash
# 运行单元测试
cd services/user-service
mvn test

# 运行集成测试
mvn verify

# 生成覆盖率报告
mvn jacoco:report
```

## 构建和部署

### 前端构建

```bash
# 构建所有应用
pnpm build

# 构建特定应用
pnpm --filter @repo/web build
```

### 后端构建

```bash
# 构建所有服务
cd services
mvn clean package

# 构建特定服务
cd services/user-service
mvn clean package
```

### Docker 部署

```bash
# 构建 Docker 镜像
docker-compose build

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 常见问题

### 1. 依赖安装失败

```bash
# 清理并重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 2. 端口冲突

修改 `apps/web/vite.config.ts` 或服务配置文件中的端口号。

### 3. API 请求失败

检查：
- 后端服务是否已启动
- `VITE_API_BASE_URL` 环境变量是否正确
- 网络连接是否正常

## 相关文档

- [代码风格规范](../../.cursor/rules/01-代码风格.mdc)
- [组件库使用规范](../../.cursor/rules/11-组件库与主题系统.mdc)
- [API 结构规范](../../.cursor/rules/06-API结构.mdc)
- [测试规范](../../.cursor/rules/20-测试与覆盖率规范.mdc)
