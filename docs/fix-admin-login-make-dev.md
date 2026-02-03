# 修复 make dev 启动时的 Admin 登录问题

## 问题原因

使用 `make dev` 启动项目时，虽然 `services/.env` 文件已配置，但环境变量可能没有正确传递到 Spring Boot 应用。

## 解决方案

### 方案一：在 PowerShell 中显式设置环境变量（推荐）

在运行 `make dev` 之前，先设置环境变量：

```powershell
# 进入 services 目录
cd services

# 设置环境变量
$env:ADMIN_INIT_ENABLED = "true"
$env:ADMIN_INIT_EMAIL = "admin@example.com"
$env:ADMIN_INIT_PASSWORD = "ChangeMe123!@#"
$env:ADMIN_INIT_NAME = "Administrator"
$env:ADMIN_INIT_PHONE = "13800138000"

# 然后启动服务
make dev
```

### 方案二：使用 PowerShell 脚本启动（推荐）

创建一个启动脚本 `services/dev-with-env.ps1`：

```powershell
# 加载 .env 文件并设置环境变量
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            if ($key -and $value) {
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    }
}

# 启动服务
Write-Host "环境变量已加载，启动服务..." -ForegroundColor Green
make dev
```

然后使用：
```powershell
cd services
.\dev-with-env.ps1
```

### 方案三：修改 Makefile（跨平台兼容）

修改 `services/Makefile`，确保环境变量正确传递：

```makefile
# 在 dev 目标中添加环境变量传递
ifeq ($(OS),Windows_NT)
SERVICES_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
dev:
	@echo ">>> 请确认已执行 make up 且 Nacos 已就绪（约 10 秒），否则会报 Nacos Connection refused"
	@echo ">>> 若端口 8080/8001/8002/8003/8004 被占用，请先停止正在运行的 make dev（Ctrl+C）"
	@echo ">>> Ctrl+C 停止后若出现 BUILD FAILURE（exit code: 1），属预期，可忽略"
	@echo "Starting all microservices (API Gateway, Auth Service, User Service, Order Service, Chat Service)..."
	@echo "Press Ctrl+C to stop all services (same terminal, mainstream approach)"
	@powershell -NoProfile -Command "$$d='$(SERVICES_DIR)'; $$env:ADMIN_INIT_ENABLED='$(ADMIN_INIT_ENABLED)'; $$env:ADMIN_INIT_EMAIL='$(ADMIN_INIT_EMAIL)'; $$env:ADMIN_INIT_PASSWORD='$(ADMIN_INIT_PASSWORD)'; $$env:ADMIN_INIT_NAME='$(ADMIN_INIT_NAME)'; $$env:ADMIN_INIT_PHONE='$(ADMIN_INIT_PHONE)'; $$p1=Start-Process -NoNewWindow -PassThru -WorkingDirectory $$d mvn -ArgumentList 'spring-boot:run','-pl','api-gateway'; $$p2=Start-Process -NoNewWindow -PassThru -WorkingDirectory $$d mvn -ArgumentList 'spring-boot:run','-pl','auth-service'; $$p3=Start-Process -NoNewWindow -PassThru -WorkingDirectory $$d mvn -ArgumentList 'spring-boot:run','-pl','user-service'; $$p4=Start-Process -NoNewWindow -PassThru -WorkingDirectory $$d mvn -ArgumentList 'spring-boot:run','-pl','order-service'; $$p5=Start-Process -NoNewWindow -PassThru -WorkingDirectory $$d mvn -ArgumentList 'spring-boot:run','-pl','chat-service'; $$p1,$$p2,$$p3,$$p4,$$p5 | Wait-Process"
```

## 验证环境变量是否生效

### 1. 查看 user-service 启动日志

启动 `make dev` 后，查看 `user-service` 的启动日志，查找以下信息：

```
INFO  AdminInitializationService - Admin user initialized successfully: email=admin@example.com, name=Administrator
```

如果看到以下日志，说明环境变量未生效：
```
WARN  AdminInitializationService - Admin initialization is enabled but ADMIN_INIT_EMAIL is not set. Skipping admin initialization.
```

### 2. 检查环境变量（调试用）

在 PowerShell 中检查环境变量：

```powershell
# 检查环境变量
$env:ADMIN_INIT_ENABLED
$env:ADMIN_INIT_EMAIL
$env:ADMIN_INIT_PASSWORD
```

### 3. 验证管理员账户是否已创建

连接到数据库检查：

```powershell
# 连接到 MySQL
docker exec -it mysql mysql -uroot -proot123 user_db

# 查询管理员用户
SELECT id, email, email_verified, created_at 
FROM users 
WHERE LOWER(email) = 'admin@example.com' 
AND deleted_at IS NULL;

# 查询用户角色
SELECT u.email, r.code as role_code
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE LOWER(u.email) = 'admin@example.com';
```

## 快速修复步骤

### 步骤 1：停止当前服务

按 `Ctrl+C` 停止 `make dev`

### 步骤 2：设置环境变量并重启

```powershell
cd services

# 设置环境变量
$env:ADMIN_INIT_ENABLED = "true"
$env:ADMIN_INIT_EMAIL = "admin@example.com"
$env:ADMIN_INIT_PASSWORD = "ChangeMe123!@#"
$env:ADMIN_INIT_NAME = "Administrator"

# 启动服务
make dev
```

### 步骤 3：查看日志确认初始化成功

在启动日志中查找：
```
INFO  AdminInitializationService - Admin user initialized successfully
```

### 步骤 4：如果用户已存在但密码不正确

删除现有用户后重新初始化：

```powershell
# 连接到数据库
docker exec -it mysql mysql -uroot -proot123 user_db

# 删除现有用户（在 MySQL 中执行）
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) = 'admin@example.com');
DELETE FROM users WHERE LOWER(email) = 'admin@example.com';

# 退出数据库
exit

# 重新启动服务（确保环境变量已设置）
cd services
$env:ADMIN_INIT_ENABLED = "true"
$env:ADMIN_INIT_EMAIL = "admin@example.com"
$env:ADMIN_INIT_PASSWORD = "ChangeMe123!@#"
make dev
```

### 步骤 5：验证登录

使用 PowerShell 测试登录：

```powershell
$body = @{
    email = "admin@example.com"
    password = "ChangeMe123!@#"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5573/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

## 长期解决方案

### 创建启动脚本（推荐）

创建 `services/dev-with-env.ps1`：

```powershell
# 加载 .env 文件
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Write-Host "加载环境变量从 .env 文件..." -ForegroundColor Cyan
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            if ($key -and $value) {
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
                Write-Host "  $key = $value" -ForegroundColor Gray
            }
        }
    }
} else {
    Write-Host "警告: .env 文件不存在" -ForegroundColor Yellow
}

# 启动服务
Write-Host "`n启动所有微服务..." -ForegroundColor Green
make dev
```

使用方法：
```powershell
cd services
.\dev-with-env.ps1
```

## 相关文档

- [Admin 登录问题排查指南](./troubleshooting-admin-login.md) - 详细排查步骤
- [Admin 账号初始化指南](./admin-initialization.md) - 初始化配置说明
- [快速修复指南](./fix-admin-login-quick.md) - Docker Compose 环境修复
