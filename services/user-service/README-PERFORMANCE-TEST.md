# API 性能测试指南

本文档说明如何使用 Artillery 进行 API 性能测试。

## 前置要求

1. **安装 Artillery**

```bash
npm install -g artillery
```

2. **启动后端服务**

确保后端服务已启动并运行在 `http://localhost:8080`：

```bash
cd services/user-service
mvn spring-boot:run
```

3. **准备测试数据**

确保测试用户存在（用于登录测试）：
- 邮箱：`test@example.com`
- 密码：`TestPassword123!`

## 运行测试

### 基本命令

```bash
# 运行性能测试
artillery run artillery-config.yml

# 运行测试并生成 JSON 报告
artillery run --output report.json artillery-config.yml

# 查看报告（HTML 格式）
artillery report report.json
```

### 测试场景

测试配置包含以下场景：

1. **用户注册**：测试注册接口性能
2. **用户登录**：测试登录接口性能（目标：P95 < 200ms）
3. **刷新 Token**：测试 Token 刷新接口性能（目标：P95 < 100ms）
4. **获取用户信息**：测试认证接口性能

### 测试阶段

测试分为四个阶段：

1. **预热阶段**：10 个虚拟用户，持续 30 秒
2. **负载测试**：50 个虚拟用户，持续 60 秒
3. **压力测试**：100 个虚拟用户，持续 30 秒
4. **峰值测试**：200 个虚拟用户，持续 20 秒

## 性能指标

### 目标指标

- **登录接口**：
  - P95 响应时间 < 200ms
  - 支持 1000 QPS
  - 错误率 < 0.1%

- **Token 刷新接口**：
  - P95 响应时间 < 100ms
  - 错误率 < 0.1%

### 查看报告

测试完成后，Artillery 会显示：

- **请求统计**：总请求数、成功/失败数
- **响应时间**：最小、最大、平均、P95、P99
- **吞吐量**：每秒请求数（RPS）
- **错误率**：错误请求百分比
- **场景统计**：每个场景的详细统计

## 自定义配置

### 修改目标 URL

编辑 `artillery-config.yml`：

```yaml
config:
  target: "http://your-api-url:8080"
```

### 调整负载

修改 `phases` 配置：

```yaml
phases:
  - duration: 60      # 持续时间（秒）
    arrivalRate: 50   # 每秒新增用户数
```

### 添加自定义场景

在 `scenarios` 中添加新场景：

```yaml
scenarios:
  - name: "自定义场景"
    flow:
      - post:
          url: "/api/your-endpoint"
          json:
            key: "value"
```

## 性能优化建议

根据测试结果，可以：

1. **优化数据库查询**：检查慢查询日志
2. **添加缓存**：对频繁访问的数据添加缓存
3. **优化代码**：减少不必要的计算和 I/O 操作
4. **扩展资源**：增加服务器资源或使用负载均衡

## 注意事项

1. **测试环境**：确保在测试环境运行，避免影响生产环境
2. **数据清理**：测试会创建大量测试数据，需要定期清理
3. **资源监控**：监控服务器 CPU、内存、数据库连接等资源使用情况
4. **限流**：注意后端限流配置，可能影响测试结果

## 相关文档

- [Artillery 官方文档](https://www.artillery.io/docs)
- [API 文档](../../docs/api/auth-api.md)
