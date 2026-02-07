# Phase 4: 配置中心 (第9-10周)

**TL;DR**: 从本地配置/环境变量演进到集中配置管理, 支持多环境隔离与动态刷新

## 阶段目标

- 统一配置来源, 支持环境隔离 (local/dev/staging/prod)
- 关键配置支持动态刷新 (无需重启)
- 密钥与配置分离 (Secret/Config 分层)
- 配置变更可审计, 可回滚

## 技术选型建议

| 方案 | 适用场景 | 优点 | 代价 |
|------|----------|------|------|
| Spring Cloud Config | 需要 Git 版本化配置 | 变更可追溯, 易回滚 | 需额外 Config Server |
| Nacos Config | 已使用 Nacos 发现 | 复用现有平台, 统一控制台 | 依赖 Nacos 稳定性 |
| K8s ConfigMap/Secret | 已上 Kubernetes | 云原生标准, 运维成熟 | 本地一致性需额外方案 |

**推荐路径**: 选用 Spring Cloud Config 作为统一配置中心, 以 Git 版本化实现审计与回滚。

---

## Step 4.1: 配置来源决策与分层

- 应用配置 (非敏感) 与密钥配置分离
- 约定配置层级: base -> env -> service
- 输出配置清单, 明确哪些配置允许动态刷新

示例结构 (Git/Nacos 都适用):

```
config/
  application.yml
  application-prod.yml
  user-service.yml
  user-service-prod.yml
```

---

## Step 4.2: 引入配置中心 (示例: Spring Cloud Config)

**文件**: services/config-repo/application.yml (示例配置仓库)

```yaml
logging:
  level:
    root: INFO
```

**文件**: services/*/src/main/resources/application.yml

```yaml
spring:
  config:
    import: optional:configserver:${CONFIG_SERVER_URI:http://localhost:8888}
```

**文件**: services/config-server/src/main/resources/application.yml (示例 Config Server)

```yaml
spring:
  application:
    name: config-server
  cloud:
    config:
      server:
        git:
          uri: ${CONFIG_REPO_URI:https://github.com/your-org/config-repo}
          default-label: main
```

---

## Step 4.3: 配置动态刷新

- 仅对安全可刷新的配置开启刷新
- 约定 Refresh Scope 范围, 减少误用

**完成标准**:
- 修改限流阈值/开关类配置无需重启
- 核心敏感配置 (密钥) 默认不可热更新

**本地/生产验证示例 (curl)**:

本地 (local profile, 放开 /actuator/**):

```bash
curl -s http://localhost:8001/actuator/health
curl -s -X POST http://localhost:8001/actuator/refresh
```

生产 (Basic Auth + 内网):

```bash
curl -s -u actuator:change-me http://localhost:8001/actuator/health
curl -s -u actuator:change-me -X POST http://localhost:8001/actuator/refresh
```

**本地/生产验证示例 (PowerShell)**:

本地 (local profile, 放开 /actuator/**):

```powershell
powershell -File services/scripts/actuator-verify.ps1 -BaseUrl http://localhost:8001 -DoRefresh
```

生产 (Basic Auth + 内网):

```powershell
powershell -File services/scripts/actuator-verify.ps1 -BaseUrl http://localhost:8001 -UseAuth -Username actuator -Password change-me -DoRefresh
```

---

## Step 4.4: Secret 管理与审计

- 生产环境建议由 Secret 管理 (KMS/Vault 或 K8s Secret)
- 接入变更审计 (谁在何时改了什么)
- 配置变更与发布流水线绑定

---

## Step 4.5: 国外主流实践补充

- 采用 GitOps 模式管理配置 (PR 审核 + 变更记录)
- 统一命名约定 (服务名-环境), 避免隐式覆盖
- 配置与密钥分库/分仓管理 (最小权限)
- 灰度配置变更 (先非生产, 再生产)
- 生产变更必须可回滚 (回滚即切换标签/提交)

**示例命名**:

```
application.yml
application-prod.yml
user-service.yml
user-service-prod.yml
```

---

## Step 4.6: 最小可用落地清单

- 新建 config-server (Spring Cloud Config Server)
- 新建配置仓库 config-repo (Git)
- 接入 5 个服务的 config import
- 制定配置分层与密钥策略
- 配置变更走 PR 审核与审批

**完成标准**:
- 5 个服务仅保留本地默认值, 生产配置从配置中心下发
- 任意配置变更可追溯到 Git 记录

---

## Step 4.7: 合规/审计策略模板

**目标**: 满足审计可追溯、最小权限与变更控制要求

**策略模板**:
- 变更必须通过 PR 审核, 至少 1 名审批人
- 生产环境配置变更需变更单/审批记录
- 配置仓库启用分支保护与强制签名提交
- Secret 与 Config 分仓管理, 访问权限隔离
- 变更日志保留 >= 180 天, 关键系统 >= 1 年
- 紧急变更需补审计记录, 并在 24 小时内复盘

**审计字段** (建议记录):
- 变更人/审批人
- 变更时间/生效环境
- 变更摘要/关联工单
- 回滚策略与执行记录

---

## Step 4.8: 多环境发布流程示例

**目标**: 降低配置错误扩散风险, 确保可回滚

**推荐流程**:
1. dev 分支提交配置变更, 自动校验格式与敏感字段
2. staging 环境自动发布, 进行回归验证
3. 审批通过后合并 main, 触发生产配置发布
4. 生产发布完成后标记版本, 必须可一键回滚

**示例 Git 分支与环境映射**:

```
dev -> dev
staging -> staging
main -> prod
```

**完成标准**:
- 每次变更都有对应环境验证记录
- 生产变更可在 5 分钟内回滚

---

## Step 4.9: 安全控制与访问策略模板

**目标**: 防止未授权访问与敏感配置泄露

**策略模板**:
- Config Server 仅内网可访问, 禁止公网暴露
- 按服务/环境分配最小权限 (read-only)
- 生产配置读取需双重授权 (人 + 机器)
- 关键密钥定期轮换 (90 天或按合规要求)
- 访问日志必须保留, 并接入 SIEM

**完成标准**:
- 生产配置访问不可直接使用个人账号
- 访问与下载记录可回溯

---

## Step 4.10: 配置质量与合规校验

**目标**: 在 CI 阶段阻断风险配置

**推荐校验项**:
- 格式与语法校验 (YAML schema)
- 敏感字段检测 (禁止明文密钥)
- 环境差异校验 (prod 不允许 debug)
- 必填配置检查 (例如 DB/Redis/Token)

**完成标准**:
- 任意 PR 必须通过校验
- 高风险字段变更需审批

---

## Step 4.11: 变更回滚与灾备策略

**目标**: 配置错误可快速恢复, 避免长时间故障

**策略模板**:
- 生产变更必须打版本标签 (tag)
- 回滚路径: 回滚到上一个稳定 tag
- 配置仓库定期备份 (日备/周备)
- Config Server 高可用 (至少 2 实例)

**完成标准**:
- 回滚演练每季度至少 1 次
- 配置仓库有可用备份

---

## 实施总结 (已落地)

- 新增 Config Server 模块, 支持本地 native 与 Git 两种后端
- 新增配置仓库示例 (config-repo), 按 base/env/service 分层
- 5 个服务接入 Config Server (config import + profile/label)
- 动态刷新端点已暴露, 本地放开, 生产 Basic Auth + 角色保护
- 提供本地/生产验证脚本与 curl/PowerShell 示例

## 验收标准

- [x] 5 个服务配置统一迁移至配置中心
- [x] local/dev/staging/prod 配置隔离清晰
- [x] 关键配置支持动态刷新
- [x] Secret 与 Config 分层完成
- [x] 变更可追溯可回滚
