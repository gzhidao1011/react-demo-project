# Docker Compose 文件对比说明

## 文件说明

- **`docker-compose.yml`** - 开发环境配置（本地构建）
- **`docker-compose.prod.yml`** - 生产环境配置（使用远程镜像）

## 主要差异

### 1. 构建方式

#### docker-compose.yml（开发环境）
```yaml
web:
  build:
    context: .
    dockerfile: apps/web/Dockerfile
    args:
      APP_NAME: web
  image: microservices/web:latest
```

#### docker-compose.prod.yml（生产环境）
```yaml
web:
  image: ${REGISTRY:-gzhidao1010}/web:${TAG:-latest}
```

**说明**：
- 开发环境：使用 `build` 从源代码构建镜像
- 生产环境：使用 `image` 从远程镜像仓库拉取镜像

### 2. 端口配置

#### docker-compose.yml（开发环境）
```yaml
nginx-proxy:
  ports:
    - "8888:80"   # 使用 8888 避免 Windows 端口冲突
    - "8443:443"  # 使用 8443 避免端口冲突
```

#### docker-compose.prod.yml（生产环境）
```yaml
nginx-proxy:
  ports:
    - "80:80"     # 标准 HTTP 端口
    - "443:443"   # 标准 HTTPS 端口
```

**说明**：
- 开发环境：使用非标准端口（8888/8443）避免与系统服务冲突
- 生产环境：使用标准端口（80/443）提供标准访问

**访问方式**：
- 开发环境：`http://web.example.com:8888`
- 生产环境：`http://web.example.com`（标准端口）

### 3. 网络配置

#### docker-compose.yml（开发环境）
```yaml
networks:
  microservices-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

#### docker-compose.prod.yml（生产环境）
```yaml
networks:
  microservices-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

**说明**：已统一，两个文件都使用相同的网络配置。

### 4. 环境变量

#### docker-compose.yml（开发环境）
```yaml
mysql:
  environment:
    MYSQL_ROOT_PASSWORD: root123  # 硬编码密码
```

#### docker-compose.prod.yml（生产环境）
```yaml
mysql:
  environment:
    MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-root123}  # 支持环境变量
```

**说明**：
- 开发环境：使用硬编码的默认值
- 生产环境：支持通过环境变量覆盖，更安全

### 5. 镜像标签

#### docker-compose.yml（开发环境）
```yaml
image: microservices/web:latest  # 固定标签
```

#### docker-compose.prod.yml（生产环境）
```yaml
image: ${REGISTRY:-gzhidao1010}/web:${TAG:-latest}  # 支持变量
```

**说明**：
- 开发环境：使用固定的镜像名称和标签
- 生产环境：支持通过环境变量配置镜像仓库和标签

## 使用场景

### 开发环境（docker-compose.yml）

**适用场景**：
- 本地开发
- 快速迭代
- 调试和测试

**使用方法**：
```bash
# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f web

# 停止服务
docker-compose down
```

**特点**：
- ✅ 自动构建镜像
- ✅ 使用非标准端口避免冲突
- ✅ 适合本地开发

### 生产环境（docker-compose.prod.yml）

**适用场景**：
- 生产部署
- CI/CD 流程
- 使用预构建镜像

**使用方法**：
```bash
# 设置环境变量
export REGISTRY=your-registry.com
export TAG=v1.0.0
export MYSQL_ROOT_PASSWORD=your-secure-password

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 停止服务
docker-compose -f docker-compose.prod.yml down
```

**特点**：
- ✅ 使用远程镜像（更快）
- ✅ 使用标准端口
- ✅ 支持环境变量配置
- ✅ 适合生产环境

## 配置建议

### 开发环境

1. **端口配置**：如果 8888 被占用，可以修改为其他端口（如 3000、9000）
2. **构建缓存**：使用 `--build` 标志强制重新构建
3. **日志查看**：使用 `docker-compose logs -f` 实时查看日志

### 生产环境

1. **镜像仓库**：修改 `REGISTRY` 变量为你的镜像仓库地址
2. **镜像标签**：使用 `TAG` 变量指定版本标签
3. **密码安全**：使用环境变量或密钥管理服务，不要硬编码密码
4. **SSL 证书**：配置 `docker/nginx/ssl/` 目录中的 SSL 证书

## 迁移指南

### 从开发环境迁移到生产环境

1. **构建并推送镜像**：
```bash
# 构建镜像
docker-compose build web docs

# 标记镜像
docker tag microservices/web:latest your-registry.com/web:v1.0.0
docker tag microservices/docs:latest your-registry.com/docs:v1.0.0

# 推送镜像
docker push your-registry.com/web:v1.0.0
docker push your-registry.com/docs:v1.0.0
```

2. **配置环境变量**：
```bash
export REGISTRY=your-registry.com
export TAG=v1.0.0
export MYSQL_ROOT_PASSWORD=your-secure-password
```

3. **启动生产环境**：
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 注意事项

1. **端口冲突**：开发环境使用非标准端口，生产环境使用标准端口
2. **镜像来源**：开发环境本地构建，生产环境使用远程镜像
3. **环境变量**：生产环境支持更多环境变量配置
4. **网络配置**：两个文件使用相同的网络配置，确保一致性
5. **数据卷**：两个文件使用相同的数据卷配置

## 总结

两个文件的主要差异是：
- ✅ **构建方式**：本地构建 vs 远程镜像
- ✅ **端口配置**：非标准端口 vs 标准端口
- ✅ **环境变量**：硬编码 vs 可配置
- ✅ **使用场景**：开发环境 vs 生产环境

这些差异是**有意设计**的，以适应不同的使用场景。
