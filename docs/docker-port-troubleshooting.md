# Docker 端口冲突排查指南

## 快速解决方案

如果遇到端口冲突，可以修改 `docker-compose.yml` 中的端口映射。

### 当前配置

```yaml
nginx-proxy:
  ports:
    - "8888:80"  # 主机端口:容器端口
    - "8443:443"
```

### 访问方式

- **Web 应用**：`http://web.example.com:8888`
- **Docs 应用**：`http://docs.example.com:8888`

## 检查端口占用

### Windows PowerShell

```powershell
# 检查特定端口
netstat -ano | findstr :8080

# 查看所有监听端口
netstat -ano | findstr LISTENING

# 根据进程 ID 查看进程名称
tasklist | findstr 60144
```

### 停止占用端口的进程

```powershell
# 以管理员身份运行
# 停止进程（替换 PID 为实际进程 ID）
taskkill /PID 60144 /F
```

## 常用可用端口

如果遇到端口冲突，可以尝试以下端口：

- `3000` - 常用开发端口
- `8000` - 常用开发端口
- `8888` - 当前使用（推荐）
- `9000` - 常用开发端口
- `9090` - 常用开发端口

## 修改端口步骤

1. 编辑 `docker-compose.yml`
2. 找到 `nginx-proxy` 服务的 `ports` 配置
3. 修改第一个端口号（主机端口）
4. 保存文件
5. 重新启动服务：

```bash
docker-compose down
docker-compose up -d
```

## 示例：使用不同端口

### 使用 3000 端口

```yaml
nginx-proxy:
  ports:
    - "3000:80"
    - "3443:443"
```

访问：`http://web.example.com:3000`

### 使用 9000 端口

```yaml
nginx-proxy:
  ports:
    - "9000:80"
    - "9443:443"
```

访问：`http://web.example.com:9000`

## 注意事项

1. **容器内部端口不变**：容器内部仍然使用 80/443 端口，只是映射到主机的不同端口
2. **Nginx 配置不变**：不需要修改 Nginx 配置文件
3. **Hosts 文件不变**：hosts 文件配置不需要修改，只需要在访问时加上端口号
4. **防火墙**：如果使用非标准端口，确保防火墙允许该端口

## 生产环境建议

在生产环境中，建议：

1. **使用标准端口**（80/443）
2. **确保端口未被占用**
3. **配置防火墙规则**
4. **使用管理员权限运行 Docker**

## 快速测试端口是否可用

```powershell
# 测试端口是否被占用
Test-NetConnection -ComputerName localhost -Port 8888

# 如果显示 "TcpTestSucceeded : False"，说明端口可用
# 如果显示 "TcpTestSucceeded : True"，说明端口被占用
```
