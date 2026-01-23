# Docker 端口冲突解决方案

## 问题描述

在 Windows 上启动 Docker 服务时，可能会遇到以下错误：

```
Error response from daemon: ports are not available: exposing port TCP 0.0.0.0:80 -> 127.0.0.1:0: listen tcp 0.0.0.0:80: bind: An attempt was made to access a socket in a way forbidden by its access permissions.
```

这通常是因为端口 80 被其他服务占用。

## 解决方案

### 方案 1：检查并停止占用端口 80 的服务（推荐）

#### 1.1 检查端口占用

```powershell
# 以管理员身份运行 PowerShell
netstat -ano | findstr :80
```

#### 1.2 常见占用端口 80 的服务

- **IIS (Internet Information Services)**
- **SQL Server Reporting Services**
- **World Wide Web Publishing Service**
- **其他 Web 服务器**

#### 1.3 停止 IIS（如果正在运行）

```powershell
# 停止 IIS
net stop w3svc

# 或者通过服务管理器
# Win + R → services.msc → 找到 "World Wide Web Publishing Service" → 停止
```

#### 1.4 停止 SQL Server Reporting Services（如果正在运行）

```powershell
# 停止 SQL Server Reporting Services
net stop SQLServerReportingServices
```

### 方案 2：修改 Docker Compose 使用其他端口（快速解决）

如果不想停止现有服务，可以修改 `docker-compose.yml` 使用其他端口（如 8080）。

#### 2.1 修改 docker-compose.yml

将 Nginx 反向代理的端口从 80 改为 8080：

```yaml
nginx-proxy:
  image: nginx:alpine
  container_name: nginx-proxy
  ports:
    - "8080:80"  # 改为 8080
    - "443:443"
  # ... 其他配置
```

#### 2.2 访问方式

修改后，访问方式变为：
- **Web 应用**：`http://web.example.com:8080`
- **Docs 应用**：`http://docs.example.com:8080`

### 方案 3：使用管理员权限运行 Docker Desktop

1. 关闭 Docker Desktop
2. 右键点击 Docker Desktop 快捷方式
3. 选择"以管理员身份运行"
4. 重新启动服务

### 方案 4：配置 Windows 端口保留（高级）

如果必须使用端口 80，可以配置 Windows 端口保留：

```powershell
# 以管理员身份运行 PowerShell

# 查看当前端口保留
netsh http show servicestate

# 删除特定进程的端口保留（需要找到进程 ID）
netsh http delete urlacl url=http://+:80/

# 或者为 Docker 添加端口保留
netsh http add urlacl url=http://+:80/ user=Everyone
```

**注意**：此方法需要管理员权限，且可能影响其他服务。

## 推荐方案

**推荐使用方案 2**（修改端口为 8080），因为：
- ✅ 不需要停止现有服务
- ✅ 不影响系统其他服务
- ✅ 快速解决
- ✅ 适合开发环境

## 修改后的完整配置

如果选择方案 2，需要修改以下文件：

### 1. docker-compose.yml

```yaml
nginx-proxy:
  image: nginx:alpine
  container_name: nginx-proxy
  ports:
    - "8080:80"  # 主机端口:容器端口
    - "8443:443"  # HTTPS 也可以改为 8443
  # ... 其他配置保持不变
```

### 2. 访问方式

配置 hosts 文件后：
- **Web 应用**：`http://web.example.com:8080`
- **Docs 应用**：`http://docs.example.com:8080`

### 3. 测试命令

```bash
# 测试访问
curl -H "Host: web.example.com" http://localhost:8080
```

## 验证端口是否可用

```powershell
# 检查端口是否被占用
netstat -ano | findstr :80

# 如果没有输出，说明端口可用
```

## 常见问题

### Q: 为什么 Windows 上端口 80 经常被占用？

A: Windows 系统默认安装了一些服务（如 IIS、SQL Server Reporting Services）可能会占用端口 80。

### Q: 生产环境应该使用哪个端口？

A: 生产环境通常使用标准端口（80/443），需要：
1. 确保端口未被占用
2. 配置防火墙规则
3. 使用管理员权限运行 Docker

### Q: 修改端口后，Nginx 配置需要修改吗？

A: 不需要。Nginx 容器内部仍然使用 80 端口，只是映射到主机的 8080 端口。
