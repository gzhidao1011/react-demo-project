# Docker 部署访问指南

## 快速开始

### 1. 启动所有服务

```bash
# 启动所有服务（包括前端应用和 Nginx 反向代理）
docker-compose up -d

# 或者只启动前端相关服务
docker-compose up -d web docs nginx-proxy
```

### 2. 检查服务状态

```bash
# 查看所有服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f web docs nginx-proxy
```

### 3. 配置 Hosts 文件（开发环境必需）

由于使用了多级域名部署方案，需要在本地配置域名解析。

#### Windows 系统

1. 以管理员身份打开记事本
2. 打开文件：`C:\Windows\System32\drivers\etc\hosts`
3. 添加以下内容：

```
127.0.0.1 web.example.com
127.0.0.1 docs.example.com
```

4. 保存文件

#### Linux/Mac 系统

```bash
# 编辑 hosts 文件
sudo nano /etc/hosts

# 添加以下内容：
127.0.0.1 web.example.com
127.0.0.1 docs.example.com
```

### 4. 访问应用

配置好 hosts 文件后，在浏览器中访问：

- **Web 应用**：`http://web.example.com`
- **Docs 应用**：`http://docs.example.com`

## 访问方式说明

### 多级域名部署方案

项目采用多级域名部署方案：

- 所有前端应用使用同一端口（80），不直接暴露到主机
- 通过 Nginx 反向代理根据域名路由：
  - `web.example.com` → `web:80`（Web 应用）
  - `docs.example.com` → `docs:80`（Docs 应用）
- Nginx 反向代理暴露 80/443 端口到主机

### 架构图

```
浏览器
  ↓
http://web.example.com (端口 80)
  ↓
Nginx 反向代理 (nginx-proxy:80)
  ↓
Web 应用容器 (web:80)
  ↓
Nginx 静态服务
  ↓
静态文件 (/usr/share/nginx/html)
```

## 验证步骤

### 1. 检查容器是否运行

```bash
# 检查所有容器状态
docker-compose ps

# 应该看到以下容器运行：
# - web
# - docs
# - nginx-proxy
```

### 2. 测试 Nginx 反向代理

```bash
# 使用 curl 测试（需要配置 Host 头）
curl -H "Host: web.example.com" http://localhost

# 或者直接访问（如果已配置 hosts）
curl http://web.example.com
```

### 3. 检查服务健康状态

```bash
# 检查 Web 应用健康状态
docker-compose exec web wget -q -O - http://localhost

# 检查 Nginx 反向代理健康状态
docker-compose exec nginx-proxy wget -q -O - http://localhost
```

### 4. 查看日志排查问题

```bash
# 查看 Web 应用日志
docker-compose logs web

# 查看 Docs 应用日志
docker-compose logs docs

# 查看 Nginx 反向代理日志
docker-compose logs nginx-proxy

# 实时查看所有日志
docker-compose logs -f web docs nginx-proxy
```

## 常见问题

### 问题 1：无法访问页面

**可能原因**：
1. 未配置 hosts 文件
2. 服务未启动
3. Nginx 配置错误

**解决方案**：
1. 检查 hosts 文件配置是否正确
2. 运行 `docker-compose ps` 检查服务状态
3. 运行 `docker-compose logs nginx-proxy` 查看 Nginx 日志

### 问题 2：502 Bad Gateway

**可能原因**：
1. Web/Docs 应用容器未启动
2. 网络配置问题

**解决方案**：
```bash
# 检查应用容器状态
docker-compose ps web docs

# 检查网络连接
docker-compose exec nginx-proxy ping web
docker-compose exec nginx-proxy ping docs

# 重启服务
docker-compose restart web docs nginx-proxy
```

### 问题 3：404 Not Found

**可能原因**：
1. 域名配置错误
2. Nginx 配置未生效

**解决方案**：
```bash
# 检查 Nginx 配置
docker-compose exec nginx-proxy nginx -t

# 重新加载 Nginx 配置
docker-compose exec nginx-proxy nginx -s reload

# 检查域名是否正确
curl -H "Host: web.example.com" http://localhost
```

### 问题 4：API 请求失败

**可能原因**：
1. API 网关未启动
2. API 代理配置错误

**解决方案**：
```bash
# 检查 API 网关状态
docker-compose ps api-gateway

# 测试 API 代理
curl -H "Host: web.example.com" http://localhost/api/health

# 查看 API 网关日志
docker-compose logs api-gateway
```

## 生产环境部署

### 1. 配置 DNS 解析

在生产环境中，需要配置真实的 DNS 解析：

- `web.example.com` → 服务器 IP 地址
- `docs.example.com` → 服务器 IP 地址

### 2. 配置 SSL/HTTPS

如果需要 HTTPS 支持：

1. 将 SSL 证书放在 `docker/nginx/ssl/` 目录
2. 修改 `docker/nginx/conf.d/default.conf` 添加 SSL 配置
3. 重启 nginx-proxy 服务

### 3. 使用生产环境配置

```bash
# 使用生产环境配置启动
docker-compose -f docker-compose.prod.yml up -d
```

## 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（谨慎使用）
docker-compose down -v
```

## 重新构建

```bash
# 重新构建并启动
docker-compose up -d --build

# 只重新构建 Web 应用
docker-compose build web
docker-compose up -d web
```
