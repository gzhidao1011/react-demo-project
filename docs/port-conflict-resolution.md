# 端口冲突问题解决指南

## 问题描述

在生产环境启动 Docker Compose 时遇到端口冲突错误：

```
Error response from daemon: ports are not available: exposing port TCP 0.0.0.0:8001 -> 127.0.0.1:0: listen tcp 0.0.0.0:8001: bind: Only one usage of each socket address (protocol/network address/port) is normally permitted.
```

## 问题原因

端口被其他进程占用，可能的原因：
1. **开发环境直接运行的服务**：本地直接运行的 Java 服务（非 Docker 容器）
2. **之前的容器未正确停止**：Docker 容器虽然停止，但端口仍被占用
3. **其他应用程序占用端口**：其他进程占用了相同的端口

## 解决方案

### 方法 1：查找并停止占用端口的进程（推荐）

#### Windows PowerShell

```powershell
# 1. 查找占用端口的进程
netstat -ano | findstr :8001

# 输出示例：
# TCP    0.0.0.0:8001           0.0.0.0:0              LISTENING       47288
# TCP    [::]:8001              [::]:0                 LISTENING       47288

# 2. 查看进程详情
tasklist | findstr 47288

# 3. 停止进程（替换 PID 为实际进程 ID）
Stop-Process -Id 47288 -Force

# 4. 验证端口是否释放
netstat -ano | findstr :8001
```

#### Linux/Mac

```bash
# 1. 查找占用端口的进程
lsof -i :8001
# 或
netstat -tulpn | grep :8001

# 2. 停止进程（替换 PID 为实际进程 ID）
kill -9 <PID>
```

### 方法 2：检查并停止 Docker 容器

```bash
# 1. 查看所有容器（包括已停止的）
docker ps -a

# 2. 查找占用特定端口的容器
docker ps -a --filter "publish=8001"

# 3. 停止并删除冲突的容器
docker stop <container-name>
docker rm <container-name>

# 4. 或者停止所有相关容器
docker-compose down
```

### 方法 3：修改端口映射（临时方案）

如果无法停止占用端口的进程，可以临时修改 `docker-compose.prod.yml` 中的端口映射：

```yaml
user-service:
  ports:
    - "8002:8001"  # 将外部端口改为 8002
    - "20880:20880"
```

**注意**：修改端口后，需要更新相关的配置文件和客户端连接地址。

## 常见端口冲突

### 微服务端口

| 服务 | 默认端口 | 说明 |
|------|---------|------|
| user-service | 8001 | 用户服务 HTTP 端口 |
| order-service | 8002 | 订单服务 HTTP 端口 |
| api-gateway | 8080 | API 网关端口 |

### 基础设施端口

| 服务 | 默认端口 | 说明 |
|------|---------|------|
| MySQL | 3306 | 数据库端口 |
| Redis | 6379 | Redis 端口 |
| Nacos | 8848 | Nacos 控制台端口 |
| Sentinel | 8858 | Sentinel 控制台端口 |
| Nginx | 8888 | HTTP 端口（避免 Windows 端口冲突） |
| Nginx | 8443 | HTTPS 端口 |

## 预防措施

### 1. 启动前检查端口

```powershell
# Windows PowerShell 脚本
$ports = @(8001, 8002, 8080, 3306, 6379, 8848, 8858, 8888)
foreach ($port in $ports) {
    $result = netstat -ano | findstr ":$port"
    if ($result) {
        Write-Warning "端口 $port 已被占用："
        Write-Host $result
    } else {
        Write-Host "端口 $port 可用" -ForegroundColor Green
    }
}
```

### 2. 使用环境变量管理端口

在 `.env` 文件中定义端口：

```env
USER_SERVICE_PORT=8001
ORDER_SERVICE_PORT=8002
API_GATEWAY_PORT=8080
```

在 `docker-compose.prod.yml` 中使用：

```yaml
user-service:
  ports:
    - "${USER_SERVICE_PORT:-8001}:8001"
```

### 3. 启动前清理

```bash
# 停止所有容器
docker-compose -f docker-compose.prod.yml down

# 清理未使用的资源
docker system prune -f
```

## 完整排查流程

### Step 1: 检查端口占用

```powershell
# 检查所有相关端口
$ports = @(8001, 8002, 8080, 3306, 6379, 8848, 8858, 8888)
foreach ($port in $ports) {
    Write-Host "检查端口 $port..." -ForegroundColor Cyan
    $result = netstat -ano | findstr ":$port"
    if ($result) {
        Write-Warning "端口 $port 被占用："
        Write-Host $result
    }
}
```

### Step 2: 停止占用进程

```powershell
# 停止占用 8001 端口的进程
$pid = (netstat -ano | findstr ":8001" | Select-String "LISTENING").ToString().Split()[-1]
if ($pid) {
    Write-Host "停止进程 $pid..." -ForegroundColor Yellow
    Stop-Process -Id $pid -Force
    Start-Sleep -Seconds 2
    Write-Host "端口已释放" -ForegroundColor Green
}
```

### Step 3: 重新启动服务

```bash
# 启动生产环境
docker-compose -f docker-compose.prod.yml up -d

# 检查服务状态
docker-compose -f docker-compose.prod.yml ps
```

## 验证服务状态

```bash
# 查看所有服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f user-service

# 检查服务健康状态
docker-compose -f docker-compose.prod.yml ps | grep healthy
```

## 相关文档

- [Docker Compose 配置分析](./docker-compose-analysis.md)
- [本地开发指南](./local-development-guide.md)
