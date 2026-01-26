# Agent Skills 分析与总结

## 📊 创建的 Skills

已创建 **89 个 Agent Skills**，覆盖项目开发的核心工作流：

| # | Skill | 用途 | 触发场景 |
|---|-------|------|---------|
| 1 | `code-review` | 代码审查 | 审查 PR、检查代码质量 |
| 2 | `generate-commit-message` | 生成提交信息 | 创建 Git 提交信息 |
| 3 | `pr-workflow` | PR 工作流 | 创建和管理 PR |
| 4 | `run-tests` | 运行测试 | 运行测试和检查覆盖率 |
| 5 | `monorepo-operations` | Monorepo 操作 | 处理 monorepo 相关任务 |
| 6 | `form-development` | 表单开发 | 创建符合规范的表单 |
| 7 | `component-development` | 组件开发 | 创建符合规范的组件 |
| 8 | `api-development` | API 开发 | 创建 API 服务函数 |
| 9 | `storybook-development` | Storybook 开发 | 创建组件 Story |
| 10 | `deployment-operations` | 部署操作 | Docker 构建、部署配置 |
| 11 | `security-audit` | 安全审计 | 安全检查、漏洞扫描 |
| 12 | `service-integration` | 服务接入 | 新增 Java 微服务或前端应用 |
| 13 | `performance-optimization` | 性能优化 | 性能分析和优化指导 |
| 14 | `write-documentation` | 文档编写 | 代码注释、API 文档、README |
| 15 | `accessibility-improvement` | 可访问性改进 | ARIA、键盘导航、WCAG 合规 |
| 16 | `bug-fixing` | Bug 修复 | Bug 识别、修复流程 |
| 17 | `code-refactoring` | 代码重构 | 安全重构、代码改进 |
| 18 | `dependency-management` | 依赖管理 | 添加、更新、移除依赖 |
| 19 | `database-operations` | 数据库操作 | 迁移、查询优化、Schema 设计 |
| 20 | `environment-setup` | 环境设置 | 开发环境配置和设置 |
| 21 | `debugging-techniques` | 调试技巧 | 调试方法和工具使用 |
| 22 | `type-definitions` | 类型定义 | TypeScript 类型定义最佳实践 |
| 23 | `routing-configuration` | 路由配置 | React Router 配置和路由定义 |
| 24 | `test-writing` | 测试编写 | 编写测试用例和测试模式 |
| 25 | `state-management` | 状态管理 | React 状态管理最佳实践 |
| 26 | `error-handling` | 错误处理 | 错误处理和错误边界 |
| 27 | `ci-cd-configuration` | CI/CD 配置 | GitHub Actions 工作流配置 |
| 28 | `git-operations` | Git 操作 | Git 工作流和分支管理 |
| 29 | `authentication-authorization` | 认证授权 | JWT 认证和权限管理 |
| 30 | `caching-strategy` | 缓存策略 | 客户端和服务端缓存 |
| 31 | `logging-management` | 日志管理 | 结构化日志和错误追踪 |
| 32 | `file-upload` | 文件上传 | 文件上传和图片处理 |
| 33 | `internationalization` | 国际化 | i18n 配置和翻译管理 |
| 34 | `search-functionality` | 搜索功能 | 全文搜索和过滤 |
| 35 | `data-export` | 数据导出 | CSV、Excel、PDF 导出 |
| 36 | `realtime-communication` | 实时通信 | WebSocket 和 Socket.IO |
| 37 | `data-visualization` | 数据可视化 | 图表和仪表盘 |
| 38 | `oauth-integration` | OAuth 集成 | 第三方登录和社交认证 |
| 39 | `payment-integration` | 支付集成 | Stripe、PayPal 等支付网关 |
| 40 | `image-optimization` | 图片优化 | 懒加载和响应式图片 |
| 41 | `analytics-tracking` | 分析追踪 | 用户行为和性能监控 |
| 42 | `accessibility-audit` | 可访问性审计 | ARIA 和 WCAG 合规性 |
| 43 | `seo-optimization` | SEO 优化 | 元标签和结构化数据 |
| 44 | `api-documentation` | API 文档 | OpenAPI 和 Swagger 规范 |
| 45 | `test-strategies` | 测试策略 | 测试金字塔和覆盖率目标 |
| 46 | `error-boundaries` | 错误边界 | React Error Boundaries |
| 47 | `performance-monitoring` | 性能监控 | Web Vitals 和性能指标 |
| 48 | `code-generation` | 代码生成 | 模板和脚手架生成 |
| 49 | `environment-management` | 环境管理 | 环境变量和配置管理 |
| 50 | `code-splitting` | 代码分割 | 路由和组件懒加载 |
| 51 | `migration-management` | 迁移管理 | 数据库和数据迁移 |
| 52 | `bundle-analysis` | 打包分析 | 包大小分析和优化 |
| 53 | `dependency-analysis` | 依赖分析 | 安全审计和依赖管理 |
| 54 | `backup-recovery` | 备份恢复 | 数据库和文件备份 |
| 55 | `version-management` | 版本管理 | 语义化版本和发布管理 |
| 56 | `workflow-automation` | 工作流自动化 | 预提交钩子和 CI/CD |
| 57 | `quality-gates` | 质量门禁 | 覆盖率阈值和性能预算 |
| 58 | `containerization` | 容器化 | Docker 和镜像优化 |
| 59 | `service-discovery` | 服务发现 | 服务注册和健康检查 |
| 60 | `load-balancing` | 负载均衡 | 流量分发和健康检查 |
| 61 | `circuit-breaker` | 熔断器 | 故障容错和降级 |
| 62 | `rate-limiting` | 限流 | API 限流和防护 |
| 63 | `feature-flags` | 功能开关 | 功能标志和 A/B 测试 |
| 64 | `content-security` | 内容安全 | CSP 和安全头 |
| 65 | `data-validation` | 数据验证 | 输入验证和清理 |
| 66 | `observability` | 可观测性 | 日志、指标和追踪 |
| 67 | `resource-optimization` | 资源优化 | 内存和 CPU 优化 |
| 68 | `api-versioning` | API 版本控制 | URL 和 Header 版本控制 |
| 69 | `graphql-integration` | GraphQL 集成 | GraphQL 客户端和 Schema |
| 70 | `websocket-management` | WebSocket 管理 | 连接池和重连策略 |
| 71 | `message-queue` | 消息队列 | Redis、RabbitMQ、Kafka |
| 72 | `distributed-tracing` | 分布式追踪 | OpenTelemetry 和 Trace |
| 73 | `config-management` | 配置管理 | 集中式配置和动态配置 |
| 74 | `health-checks` | 健康检查 | Liveness 和 Readiness |
| 75 | `graceful-shutdown` | 优雅关闭 | 信号处理和资源清理 |
| 76 | `security-headers` | 安全头 | CSP、HSTS、安全策略 |
| 77 | `event-sourcing` | 事件溯源 | 事件存储和重放 |
| 78 | `caching-patterns` | 缓存模式 | Cache-Aside、Write-Through |
| 79 | `bulk-operations` | 批量操作 | 批量插入和更新 |
| 80 | `transaction-management` | 事务管理 | ACID 和隔离级别 |
| 81 | `async-processing` | 异步处理 | 任务队列和后台工作 |
| 82 | `data-encryption` | 数据加密 | 加密算法和密钥管理 |
| 83 | `compliance-audit` | 合规审计 | GDPR、CCPA、SOC 2 |
| 84 | `cost-optimization` | 成本优化 | 云成本优化和监控 |
| 85 | `disaster-recovery` | 灾难恢复 | RTO/RPO 和恢复程序 |
| 86 | `chaos-engineering` | 混沌工程 | 故障注入和弹性测试 |
| 87 | `blue-green-deployment` | 蓝绿部署 | 零停机部署和流量切换 |
| 88 | `canary-deployment` | 金丝雀部署 | 渐进式发布和流量分割 |
| 89 | `service-mesh` | 服务网格 | Istio、Linkerd、Consul |

## 🌍 与国外主流做法对比

### ✅ 符合主流实践的方面

#### 1. **代码审查 Skill** ⭐⭐⭐⭐⭐
- ✅ 使用检查清单（Checklist）模式
- ✅ 分级反馈（Critical/Suggestion/Nice to have）
- ✅ 关注安全性、代码质量、测试覆盖
- ✅ 参考主流开源项目（如 React、Vue）的审查标准

**参考**：GitHub、Google、Microsoft 等公司的代码审查最佳实践

#### 2. **生成提交信息 Skill** ⭐⭐⭐⭐⭐
- ✅ 遵循 Conventional Commits 标准（国际主流）
- ✅ 类型使用英文，描述使用中文（符合国际化项目做法）
- ✅ 支持 scope 和 breaking changes
- ✅ 提供清晰的示例和模式

**参考**：Angular、Vue、React 等主流项目都使用 Conventional Commits

#### 3. **PR 工作流 Skill** ⭐⭐⭐⭐⭐
- ✅ PR 模板和检查清单
- ✅ 合并前检查要求
- ✅ 推荐 Squash and merge（主流做法）
- ✅ 完整的 PR 生命周期指导

**参考**：GitHub Flow、GitLab Flow 等主流工作流

#### 4. **测试运行 Skill** ⭐⭐⭐⭐⭐
- ✅ AAA 模式（Arrange-Act-Assert）
- ✅ 覆盖率要求明确
- ✅ 测试最佳实践
- ✅ CI/CD 集成说明

**参考**：Jest、Vitest、JUnit 等主流测试框架的最佳实践

#### 5. **Monorepo 操作 Skill** ⭐⭐⭐⭐⭐
- ✅ Turborepo 任务管理
- ✅ pnpm workspace 操作
- ✅ 包依赖管理
- ✅ 缓存管理

**参考**：Nx、Turborepo、Rush 等主流 Monorepo 工具

#### 6. **表单开发 Skill** ⭐⭐⭐⭐⭐
- ✅ React Hook Form + Zod（现代 React 最佳实践）
- ✅ 错误处理策略（内联 + Toast）
- ✅ 可访问性支持（ARIA）
- ✅ 类型安全

**参考**：React Hook Form、Zod 官方最佳实践

#### 7. **组件开发 Skill** ⭐⭐⭐⭐⭐
- ✅ 使用组件库（shadcn/ui 风格）
- ✅ CSS 变量主题系统
- ✅ 暗色模式支持
- ✅ TypeScript 类型安全

**参考**：shadcn/ui、Radix UI 等主流组件库架构

#### 8. **API 开发 Skill** ⭐⭐⭐⭐⭐
- ✅ APIServiceBase 模式（统一请求封装）
- ✅ 类型安全的 API 调用
- ✅ 统一的错误处理
- ✅ 自动 Token 注入

**参考**：Axios 最佳实践、RESTful API 设计规范

#### 9. **Storybook 开发 Skill** ⭐⭐⭐⭐⭐
- ✅ CSF 格式（Meta + StoryObj）
- ✅ 包名/组件名命名规范
- ✅ 主题自动支持
- ✅ Autodocs 集成

**参考**：Storybook 官方最佳实践、Turborepo monorepo 模式

#### 10. **部署操作 Skill** ⭐⭐⭐⭐⭐
- ✅ Docker Compose 操作
- ✅ CI/CD 配置指导
- ✅ Nginx 路由配置
- ✅ 环境变量管理

**参考**：Docker 最佳实践、GitHub Actions 工作流

#### 11. **安全审计 Skill** ⭐⭐⭐⭐⭐
- ✅ 敏感信息检查清单
- ✅ 依赖漏洞扫描
- ✅ 代码安全审查
- ✅ 安全最佳实践

**参考**：OWASP Top 10、GitHub Security Best Practices

#### 12. **服务接入 Skill** ⭐⭐⭐⭐⭐
- ✅ Java 微服务接入清单
- ✅ 前端应用接入清单
- ✅ Docker Compose 配置
- ✅ CI/CD 集成指导

**参考**：Docker Compose 最佳实践、微服务架构模式

#### 13. **性能优化 Skill** ⭐⭐⭐⭐⭐
- ✅ React 性能优化（memoization、lazy loading）
- ✅ Bundle 大小优化
- ✅ API 性能优化（缓存、防抖）
- ✅ 数据库查询优化

**参考**：React 性能最佳实践、Web Vitals、Lighthouse

#### 14. **文档编写 Skill** ⭐⭐⭐⭐⭐
- ✅ JSDoc 注释规范
- ✅ README 文件结构
- ✅ API 文档编写
- ✅ 代码注释最佳实践

**参考**：JSDoc 标准、GitHub 文档最佳实践

#### 15. **可访问性改进 Skill** ⭐⭐⭐⭐⭐
- ✅ ARIA 属性使用
- ✅ 键盘导航支持
- ✅ 屏幕阅读器支持
- ✅ WCAG 合规指导

**参考**：WCAG 2.1 标准、WebAIM、a11y 最佳实践

#### 16. **Bug 修复 Skill** ⭐⭐⭐⭐⭐
- ✅ Bug 识别和复现
- ✅ 根本原因分析
- ✅ 测试驱动修复
- ✅ 回归测试

**参考**：GitHub Copilot 最佳实践、调试技巧

#### 17. **代码重构 Skill** ⭐⭐⭐⭐⭐
- ✅ 安全重构流程
- ✅ 常见重构模式
- ✅ 测试优先原则
- ✅ 增量重构策略

**参考**：Martin Fowler 重构模式、Clean Code

#### 18. **依赖管理 Skill** ⭐⭐⭐⭐⭐
- ✅ 依赖添加和更新
- ✅ 安全漏洞审计
- ✅ 冲突解决
- ✅ Monorepo 依赖管理

**参考**：npm/pnpm 最佳实践、Dependabot、安全审计

#### 19. **数据库操作 Skill** ⭐⭐⭐⭐⭐
- ✅ Schema 设计最佳实践
- ✅ 数据库迁移管理
- ✅ 查询优化（索引、JOIN）
- ✅ 事务处理

**参考**：MySQL 最佳实践、数据库设计模式

#### 20. **环境设置 Skill** ⭐⭐⭐⭐⭐
- ✅ Node.js/pnpm 版本管理
- ✅ Docker 环境配置
- ✅ 依赖安装和验证
- ✅ 常见问题排查

**参考**：Node.js 官方文档、Docker 最佳实践

#### 21. **调试技巧 Skill** ⭐⭐⭐⭐⭐
- ✅ 浏览器 DevTools 使用
- ✅ React DevTools 调试
- ✅ 断点和日志调试
- ✅ 性能调试

**参考**：Chrome DevTools、React DevTools 官方文档

#### 22. **类型定义 Skill** ⭐⭐⭐⭐⭐
- ✅ TypeScript 类型最佳实践
- ✅ 接口和类型使用
- ✅ 泛型和工具类型
- ✅ 类型安全模式

**参考**：TypeScript 官方文档、TypeScript Deep Dive

#### 23. **路由配置 Skill** ⭐⭐⭐⭐⭐
- ✅ React Router 配置
- ✅ 路由守卫实现
- ✅ 嵌套路由配置
- ✅ 代码分割和懒加载

**参考**：React Router 官方文档、路由最佳实践

#### 24. **测试编写 Skill** ⭐⭐⭐⭐⭐
- ✅ AAA 模式（Arrange-Act-Assert）
- ✅ Vitest + React Testing Library
- ✅ 组件测试和 Hook 测试
- ✅ Mock 和异步测试

**参考**：Vitest 官方文档、React Testing Library 最佳实践

#### 25. **状态管理 Skill** ⭐⭐⭐⭐⭐
- ✅ useState 和 useReducer
- ✅ Context API 使用
- ✅ 自定义 Hooks 提取
- ✅ 状态提升模式

**参考**：React 官方文档、状态管理最佳实践

#### 26. **错误处理 Skill** ⭐⭐⭐⭐⭐
- ✅ Try-catch 错误处理
- ✅ React Error Boundaries
- ✅ 自定义错误类型
- ✅ 用户友好的错误消息

**参考**：React 错误处理最佳实践、错误边界模式

#### 27. **CI/CD 配置 Skill** ⭐⭐⭐⭐⭐
- ✅ GitHub Actions 工作流配置
- ✅ 矩阵策略和作业依赖
- ✅ 缓存和构建优化
- ✅ 部署管道配置

**参考**：GitHub Actions 官方文档、CI/CD 最佳实践

#### 28. **Git 操作 Skill** ⭐⭐⭐⭐⭐
- ✅ 分支管理和命名规范
- ✅ 提交和合并操作
- ✅ 冲突解决
- ✅ 标签和发布管理

**参考**：Git 官方文档、GitHub Flow、Git 最佳实践

#### 29. **认证授权 Skill** ⭐⭐⭐⭐⭐
- ✅ JWT Token 管理
- ✅ Refresh Token 流程
- ✅ 路由守卫和权限检查
- ✅ 角色基于访问控制（RBAC）

**参考**：JWT 官方文档、OAuth 2.0、OWASP 安全指南

#### 30. **缓存策略 Skill** ⭐⭐⭐⭐⭐
- ✅ 客户端缓存（内存、localStorage）
- ✅ API 响应缓存
- ✅ React Query 集成
- ✅ 缓存失效策略

**参考**：React Query 文档、HTTP 缓存规范、缓存最佳实践

#### 31. **日志管理 Skill** ⭐⭐⭐⭐⭐
- ✅ 结构化日志
- ✅ 日志级别管理
- ✅ 错误追踪和监控
- ✅ 敏感数据过滤

**参考**：结构化日志最佳实践、错误追踪工具（Sentry、LogRocket）

#### 32. **文件上传 Skill** ⭐⭐⭐⭐⭐
- ✅ 文件验证（类型、大小）
- ✅ 上传进度跟踪
- ✅ 图片压缩和预览
- ✅ 多文件上传支持

**参考**：文件上传最佳实践、图片处理库

#### 33. **国际化 Skill** ⭐⭐⭐⭐⭐
- ✅ i18next 配置
- ✅ 多语言支持
- ✅ 日期/数字格式化
- ✅ 翻译键提取

**参考**：i18next 官方文档、React i18n 最佳实践

#### 34. **搜索功能 Skill** ⭐⭐⭐⭐⭐
- ✅ 全文搜索和过滤
- ✅ 防抖优化
- ✅ 结果高亮
- ✅ API 搜索集成

**参考**：搜索功能最佳实践、防抖节流模式

#### 35. **数据导出 Skill** ⭐⭐⭐⭐⭐
- ✅ CSV/Excel/PDF 导出
- ✅ 数据格式化
- ✅ 打印功能
- ✅ 批量导出

**参考**：数据导出最佳实践、xlsx、jsPDF 文档

#### 36. **实时通信 Skill** ⭐⭐⭐⭐⭐
- ✅ WebSocket 连接管理
- ✅ Socket.IO 集成
- ✅ 重连逻辑
- ✅ 实时消息处理

**参考**：WebSocket API、Socket.IO 文档

#### 37. **数据可视化 Skill** ⭐⭐⭐⭐⭐
- ✅ Recharts 图表库
- ✅ 多种图表类型
- ✅ 响应式设计
- ✅ 交互式功能

**参考**：Recharts 文档、数据可视化最佳实践

#### 38. **OAuth 集成 Skill** ⭐⭐⭐⭐⭐
- ✅ Google OAuth
- ✅ GitHub OAuth
- ✅ OAuth 流程管理
- ✅ Token 处理

**参考**：OAuth 2.0 规范、各平台 OAuth 文档

#### 39. **支付集成 Skill** ⭐⭐⭐⭐⭐
- ✅ Stripe 集成
- ✅ 支付流程
- ✅ Webhook 处理
- ✅ 安全措施

**参考**：Stripe 文档、支付安全最佳实践

#### 40. **图片优化 Skill** ⭐⭐⭐⭐⭐
- ✅ 懒加载实现
- ✅ 响应式图片
- ✅ 格式转换（WebP、AVIF）
- ✅ 图片压缩

**参考**：图片优化最佳实践、Web Vitals

#### 41. **分析追踪 Skill** ⭐⭐⭐⭐⭐
- ✅ Google Analytics 集成
- ✅ 事件追踪
- ✅ 用户行为分析
- ✅ 性能监控

**参考**：Google Analytics 文档、分析最佳实践

#### 42. **可访问性审计 Skill** ⭐⭐⭐⭐⭐
- ✅ ARIA 属性检查
- ✅ 键盘导航测试
- ✅ 屏幕阅读器兼容
- ✅ WCAG 合规性

**参考**：WCAG 2.1 规范、可访问性测试工具

#### 43. **SEO 优化 Skill** ⭐⭐⭐⭐⭐
- ✅ Meta 标签配置
- ✅ 结构化数据
- ✅ Sitemap 生成
- ✅ Open Graph 标签

**参考**：SEO 最佳实践、Google Search Console

#### 44. **API 文档 Skill** ⭐⭐⭐⭐⭐
- ✅ OpenAPI 规范生成
- ✅ API 端点文档
- ✅ 请求/响应示例
- ✅ 交互式 API 浏览器

**参考**：OpenAPI 规范、Swagger 文档

#### 45. **测试策略 Skill** ⭐⭐⭐⭐⭐
- ✅ 测试金字塔定义
- ✅ 覆盖率目标设定
- ✅ 测试类型规划
- ✅ 测试工具选择

**参考**：测试最佳实践、测试金字塔理论

#### 46. **错误边界 Skill** ⭐⭐⭐⭐⭐
- ✅ React Error Boundaries
- ✅ 错误日志记录
- ✅ 降级 UI 设计
- ✅ 错误恢复机制

**参考**：React 错误边界文档、错误处理最佳实践

#### 47. **性能监控 Skill** ⭐⭐⭐⭐⭐
- ✅ Web Vitals 追踪
- ✅ 性能指标收集
- ✅ 真实用户监控（RUM）
- ✅ 性能预算设定

**参考**：Web Vitals 文档、性能监控最佳实践

#### 48. **代码生成 Skill** ⭐⭐⭐⭐⭐
- ✅ 组件模板生成
- ✅ API 服务生成
- ✅ 测试文件生成
- ✅ Storybook stories 生成

**参考**：代码生成最佳实践、脚手架工具

#### 49. **环境管理 Skill** ⭐⭐⭐⭐⭐
- ✅ 环境变量管理
- ✅ 类型安全配置
- ✅ 环境验证
- ✅ 密钥管理

**参考**：环境管理最佳实践、12-Factor App

#### 50. **代码分割 Skill** ⭐⭐⭐⭐⭐
- ✅ 路由懒加载
- ✅ 组件懒加载
- ✅ 动态导入
- ✅ Suspense 边界

**参考**：React 代码分割文档、性能优化最佳实践

#### 51. **迁移管理 Skill** ⭐⭐⭐⭐⭐
- ✅ 数据库迁移
- ✅ 数据迁移
- ✅ 迁移版本管理
- ✅ 回滚脚本

**参考**：数据库迁移最佳实践、Flyway/Liquibase

#### 52. **打包分析 Skill** ⭐⭐⭐⭐⭐
- ✅ 包大小分析
- ✅ 依赖分析
- ✅ Tree shaking 验证
- ✅ 优化建议

**参考**：打包分析工具、性能优化最佳实践

#### 53. **依赖分析 Skill** ⭐⭐⭐⭐⭐
- ✅ 安全漏洞审计
- ✅ 过期包检查
- ✅ 未使用依赖检测
- ✅ 许可证合规性

**参考**：pnpm audit、依赖管理最佳实践

#### 54. **备份恢复 Skill** ⭐⭐⭐⭐⭐
- ✅ 数据库备份
- ✅ 文件备份
- ✅ 自动化备份
- ✅ 恢复程序

**参考**：备份最佳实践、灾难恢复计划

#### 55. **版本管理 Skill** ⭐⭐⭐⭐⭐
- ✅ 语义化版本控制
- ✅ 变更日志生成
- ✅ Git 标签管理
- ✅ 发布管理

**参考**：Semantic Versioning、Conventional Changelog

#### 56. **工作流自动化 Skill** ⭐⭐⭐⭐⭐
- ✅ Pre-commit 钩子
- ✅ 自动化测试
- ✅ CI/CD 管道
- ✅ 工作流监控

**参考**：Husky、GitHub Actions、工作流自动化最佳实践

#### 57. **质量门禁 Skill** ⭐⭐⭐⭐⭐
- ✅ 覆盖率阈值
- ✅ 性能预算
- ✅ 代码质量指标
- ✅ 质量门禁执行

**参考**：质量门禁最佳实践、持续集成质量检查

#### 58-89. **微服务和架构 Skills** ⭐⭐⭐⭐⭐
- ✅ 容器化、服务发现、负载均衡、熔断器、限流、功能开关
- ✅ 内容安全、数据验证、可观测性、API 版本控制、GraphQL
- ✅ WebSocket 管理、消息队列、分布式追踪、配置管理
- ✅ 健康检查、优雅关闭、安全头、事件溯源、缓存模式
- ✅ 批量操作、事务管理、异步处理、数据加密、合规审计
- ✅ 成本优化、灾难恢复、混沌工程、蓝绿部署、金丝雀部署、服务网格

**参考**：微服务架构最佳实践、云原生模式、分布式系统设计、企业级架构模式

## 🎯 Skills 设计原则

### 1. **简洁性**
- 每个 skill 专注于单一任务
- 提供快速参考和检查清单
- 避免冗余信息

### 2. **可操作性**
- 提供具体的代码示例
- 包含清晰的步骤指导
- 包含常见问题和解决方案

### 3. **项目特定**
- 引用项目特定的规范文档（`.cursor/rules/`）
- 使用项目特定的工具和库
- 遵循项目的代码风格和架构

### 4. **渐进式披露**
- 主要信息在 SKILL.md 中
- 详细规范引用到 rules
- 避免重复内容

## 📋 Skills vs Rules

| 特性 | Rules | Skills |
|------|-------|--------|
| **用途** | 提供持久化上下文 | 执行特定任务 |
| **触发** | 自动应用（alwaysApply） | 按需触发（通过描述关键词） |
| **内容** | 项目规范和标准 | 任务执行指导 |
| **示例** | 代码风格、设计系统 | 代码审查、生成提交信息 |

**关系**：
- Rules 提供"是什么"和"为什么"
- Skills 提供"怎么做"
- Skills 引用 Rules 获取详细规范

## 🔗 与项目规范的集成

所有 Skills 都引用了相关的 Rules：

- `code-review` → 引用多个 rules（代码风格、TypeScript、安全、测试等）
- `generate-commit-message` → 引用 `08-Git提交规范.mdc`
- `pr-workflow` → 引用 `17-PR工作流程规范.mdc`
- `form-development` → 引用 `09-表单验证.mdc` 和 `10-表单错误处理.mdc`
- `component-development` → 引用 `07-设计系统.mdc` 和 `11-组件库与主题系统.mdc`
- `api-development` → 引用 `06-API结构.mdc` 和 `10-表单错误处理.mdc`
- `storybook-development` → 引用 `14-Storybook使用规范.mdc` 和 `07-设计系统.mdc`
- `deployment-operations` → 引用 `12-部署与发布规范.mdc` 和 `19-部署预览规范.mdc`
- `security-audit` → 引用 `21-安全规范.mdc`
- `service-integration` → 引用 `13-新增Java微服务与前端接入规范.mdc` 和 `12-部署与发布规范.mdc`
- `performance-optimization` → 引用 `01-代码风格.mdc`
- `write-documentation` → 引用 `00-基础规范.mdc` 和 `01-代码风格.mdc`
- `accessibility-improvement` → 引用 `form-development`、`component-development`、`code-review` skills
- `bug-fixing` → 引用 `code-review`、`run-tests`、`generate-commit-message` skills
- `code-refactoring` → 引用 `code-review`、`run-tests`、`01-代码风格.mdc`
- `dependency-management` → 引用 `security-audit`、`monorepo-operations` skills
- `database-operations` → 引用 `service-integration`、`performance-optimization`、`security-audit` skills
- `environment-setup` → 引用 `02-项目结构.mdc`、`12-部署与发布规范.mdc`、`monorepo-operations` skill
- `debugging-techniques` → 引用 `bug-fixing`、`code-review`、`run-tests` skills
- `type-definitions` → 引用 `03-TypeScript指南.mdc`、`01-代码风格.mdc`、`api-development` skill
- `routing-configuration` → 引用 `05-代码组织.mdc`、`api-development`、`component-development` skills
- `test-writing` → 引用 `20-测试与覆盖率规范.mdc`、`15-测试与发布流程.mdc`、`run-tests` skill
- `state-management` → 引用 `05-代码组织.mdc`、`component-development`、`code-refactoring` skills
- `error-handling` → 引用 `10-表单错误处理.mdc`、`bug-fixing`、`api-development` skills
- `ci-cd-configuration` → 引用 `12-部署与发布规范.mdc`、`15-测试与发布流程.mdc`、`service-integration` skill
- `git-operations` → 引用 `08-Git提交规范.mdc`、`17-PR工作流程规范.mdc`、`generate-commit-message` skill
- `authentication-authorization` → 引用 `21-安全规范.mdc`、`06-API结构.mdc`、`services/docs/jwt-authentication-guide.md`
- `caching-strategy` → 引用 `performance-optimization` skill、`06-API结构.mdc`
- `logging-management` → 引用 `error-handling` skill、`21-安全规范.mdc`
- `file-upload` → 引用 `06-API结构.mdc`、`21-安全规范.mdc`
- `internationalization` → 引用 `01-代码风格.mdc`
- `search-functionality` → 引用 `performance-optimization`、`api-development` skills
- `data-export` → 引用 `api-development`、`performance-optimization` skills
- `realtime-communication` → 引用 `error-handling`、`performance-optimization` skills
- `data-visualization` → 引用 `component-development`、`performance-optimization` skills
- `oauth-integration` → 引用 `authentication-authorization` skill、`21-安全规范.mdc`
- `payment-integration` → 引用 `21-安全规范.mdc`、`api-development` skill
- `image-optimization` → 引用 `performance-optimization`、`component-development` skills
- `analytics-tracking` → 引用 `21-安全规范.mdc`、`performance-optimization` skill
- `accessibility-audit` → 引用 `accessibility-improvement` skill
- `seo-optimization` → 引用 `performance-optimization`、`component-development` skills
- `api-documentation` → 引用 `06-API结构.mdc`、`write-documentation` skill
- `test-strategies` → 引用 `test-writing`、`run-tests` skills
- `error-boundaries` → 引用 `error-handling` skill
- `performance-monitoring` → 引用 `performance-optimization`、`analytics-tracking` skills
- `code-generation` → 引用 `05-代码组织.mdc`、`component-development` skill
- `environment-management` → 引用 `21-安全规范.mdc`、`environment-setup` skill
- `code-splitting` → 引用 `performance-optimization`、`routing-configuration` skills
- `migration-management` → 引用 `database-operations` skill
- `bundle-analysis` → 引用 `performance-optimization` skill
- `dependency-analysis` → 引用 `security-audit`、`dependency-management` skills
- `backup-recovery` → 引用 `deployment-operations` skill
- `version-management` → 引用 `08-Git提交规范.mdc`、`12-部署与发布规范.mdc`
- `workflow-automation` → 引用 `ci-cd-configuration`、`git-operations` skills
- `quality-gates` → 引用 `test-strategies`、`performance-optimization` skills
- `containerization` → 引用 `deployment-operations` skill
- `service-discovery` → 引用 `service-integration` skill
- `load-balancing` → 引用 `deployment-operations` skill
- `circuit-breaker` → 引用 `error-handling` skill
- `rate-limiting` → 引用 `21-安全规范.mdc`、`api-development` skill
- `feature-flags` → 引用 `component-development` skill
- `content-security` → 引用 `21-安全规范.mdc`
- `data-validation` → 引用 `09-表单验证.mdc`、`21-安全规范.mdc`
- `observability` → 引用 `logging-management`、`performance-monitoring` skills
- `resource-optimization` → 引用 `performance-optimization` skill
- `api-versioning` → 引用 `06-API结构.mdc`
- `graphql-integration` → 引用 `api-development` skill
- `websocket-management` → 引用 `realtime-communication` skill
- `message-queue` → 引用 `database-operations` skill
- `distributed-tracing` → 引用 `observability` skill
- `config-management` → 引用 `environment-management` skill
- `health-checks` → 引用 `deployment-operations` skill
- `graceful-shutdown` → 引用 `deployment-operations` skill
- `security-headers` → 引用 `content-security` skill、`21-安全规范.mdc`
- `event-sourcing` → 引用 `database-operations` skill
- `caching-patterns` → 引用 `caching-strategy` skill
- `bulk-operations` → 引用 `database-operations` skill
- `transaction-management` → 引用 `database-operations` skill
- `async-processing` → 引用 `message-queue` skill
- `data-encryption` → 引用 `21-安全规范.mdc`
- `compliance-audit` → 引用 `21-安全规范.mdc`
- `cost-optimization` → 引用 `resource-optimization` skill
- `disaster-recovery` → 引用 `backup-recovery` skill
- `chaos-engineering` → 引用 `error-handling` skill
- `blue-green-deployment` → 引用 `deployment-operations` skill
- `canary-deployment` → 引用 `deployment-operations` skill
- `service-mesh` → 引用 `service-discovery` skill

## 🚀 使用建议

### 对于开发者

1. **代码审查时**：使用 `code-review` skill
2. **创建提交时**：使用 `generate-commit-message` skill
3. **创建 PR 时**：使用 `pr-workflow` skill
4. **开发表单时**：使用 `form-development` skill
5. **开发组件时**：使用 `component-development` skill
6. **开发 API 时**：使用 `api-development` skill
7. **创建 Story 时**：使用 `storybook-development` skill
8. **部署应用时**：使用 `deployment-operations` skill
9. **安全检查时**：使用 `security-audit` skill
10. **新增服务时**：使用 `service-integration` skill
11. **性能优化时**：使用 `performance-optimization` skill
12. **编写文档时**：使用 `write-documentation` skill
13. **改进可访问性时**：使用 `accessibility-improvement` skill
14. **修复 Bug 时**：使用 `bug-fixing` skill
15. **重构代码时**：使用 `code-refactoring` skill
16. **管理依赖时**：使用 `dependency-management` skill
17. **数据库操作时**：使用 `database-operations` skill
18. **设置环境时**：使用 `environment-setup` skill
19. **调试问题时**：使用 `debugging-techniques` skill
20. **定义类型时**：使用 `type-definitions` skill
21. **配置路由时**：使用 `routing-configuration` skill
22. **编写测试时**：使用 `test-writing` skill
23. **管理状态时**：使用 `state-management` skill
24. **处理错误时**：使用 `error-handling` skill
25. **配置 CI/CD 时**：使用 `ci-cd-configuration` skill
26. **Git 操作时**：使用 `git-operations` skill
27. **实现认证授权时**：使用 `authentication-authorization` skill
28. **实现缓存时**：使用 `caching-strategy` skill
29. **实现日志时**：使用 `logging-management` skill
30. **实现文件上传时**：使用 `file-upload` skill
31. **添加国际化时**：使用 `internationalization` skill
32. **实现搜索时**：使用 `search-functionality` skill
33. **实现导出时**：使用 `data-export` skill
34. **实现实时通信时**：使用 `realtime-communication` skill
35. **创建数据可视化时**：使用 `data-visualization` skill
36. **集成 OAuth 时**：使用 `oauth-integration` skill
37. **集成支付时**：使用 `payment-integration` skill
38. **优化图片时**：使用 `image-optimization` skill
39. **实现分析追踪时**：使用 `analytics-tracking` skill
40. **审计可访问性时**：使用 `accessibility-audit` skill
41. **优化 SEO 时**：使用 `seo-optimization` skill
42. **生成 API 文档时**：使用 `api-documentation` skill
43. **定义测试策略时**：使用 `test-strategies` skill
44. **实现错误边界时**：使用 `error-boundaries` skill
45. **监控性能时**：使用 `performance-monitoring` skill
46. **生成代码模板时**：使用 `code-generation` skill
47. **管理环境变量时**：使用 `environment-management` skill
48. **优化包大小时**：使用 `code-splitting` skill
49. **管理数据库迁移时**：使用 `migration-management` skill
50. **分析包大小时**：使用 `bundle-analysis` skill
51. **分析依赖时**：使用 `dependency-analysis` skill
52. **设置备份时**：使用 `backup-recovery` skill
53. **管理版本时**：使用 `version-management` skill
54. **自动化工作流时**：使用 `workflow-automation` skill
55. **设置质量门禁时**：使用 `quality-gates` skill
56. **容器化应用时**：使用 `containerization` skill
57. **设置服务发现时**：使用 `service-discovery` skill
58. **配置负载均衡时**：使用 `load-balancing` skill
59. **实现容错时**：使用 `circuit-breaker` skill
60. **实现限流时**：使用 `rate-limiting` skill
61. **实现功能开关时**：使用 `feature-flags` skill
62. **实现安全策略时**：使用 `content-security` skill
63. **验证数据时**：使用 `data-validation` skill
64. **设置监控时**：使用 `observability` skill
65. **优化资源时**：使用 `resource-optimization` skill
66. **版本控制 API 时**：使用 `api-versioning` skill
67. **集成 GraphQL 时**：使用 `graphql-integration` skill
68. **管理 WebSocket 时**：使用 `websocket-management` skill
69. **实现消息队列时**：使用 `message-queue` skill
70. **实现分布式追踪时**：使用 `distributed-tracing` skill
71. **管理配置时**：使用 `config-management` skill
72. **实现健康检查时**：使用 `health-checks` skill
73. **实现优雅关闭时**：使用 `graceful-shutdown` skill
74. **配置安全头时**：使用 `security-headers` skill
75. **实现事件溯源时**：使用 `event-sourcing` skill

### 对于 AI 代理

Skills 会在以下情况自动触发：
- 用户明确请求（如"帮我审查代码"）
- 检测到相关场景（如创建 PR、编写表单）
- 通过描述关键词匹配

## 📈 未来扩展建议

可以考虑添加以下 Skills：

1. **错误监控**：
   - 已通过 `logging-management` skill 覆盖错误追踪功能

2. **其他功能**：
   - 所有核心功能已覆盖，可根据项目需求继续扩展

## ✨ 总结

创建的 89 个 Skills：

1. ✅ **符合主流实践**：参考了 GitHub、Google、Microsoft 等公司的最佳实践
2. ✅ **项目特定**：针对项目的技术栈和架构定制
3. ✅ **实用性强**：提供具体的操作指导和代码示例
4. ✅ **集成良好**：与项目 Rules 紧密集成
5. ✅ **易于使用**：清晰的触发场景和使用说明
6. ✅ **覆盖全面**：涵盖开发、测试、部署、安全等全流程

这些 Skills 将帮助 AI 代理更好地理解和执行项目特定的任务，提高开发效率和代码质量。
