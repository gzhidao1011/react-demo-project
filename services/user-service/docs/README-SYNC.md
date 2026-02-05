# 文档自动同步说明

## 概述

当修改 `services/user-service` 的代码时，AI（Cursor）会自动同步更新 `services/user-service/docs/README.md` 文档。

## 工作原理

项目已配置 Cursor 规则（`.cursor/rules/24-服务文档自动同步规范.mdc`），当检测到以下变更时，AI 会自动更新文档：

### 自动触发更新的场景

1. **新增或修改 Controller**
   - 添加新的 `@RestController` 类
   - 添加新的 API 端点（`@GetMapping`、`@PostMapping` 等）
   - 修改 API 路径或参数

2. **新增或修改 Service**
   - 添加新的 `@Service` 类
   - 添加新的业务方法
   - 修改方法签名

3. **新增或修改 Mapper/Entity**
   - 添加新的 Mapper 接口
   - 添加新的实体类

4. **修改配置**
   - 添加新的配置类
   - 修改 `pom.xml` 依赖
   - 修改启动类配置

5. **数据库迁移**
   - 添加新的 Flyway 迁移脚本

## 使用示例

### 示例 1：添加新的 API 端点

**操作**：
```java
// 在 UserController.java 中添加
@GetMapping("/me")
public Result<UserDetailDto> getCurrentUser() {
    // ...
}
```

**AI 会自动**：
1. ✅ 在 `README.md` 的"五、API 端点"部分添加：
   ```markdown
   - `GET /api/users/me` - 获取当前用户信息
   ```
2. ✅ 在"三、核心功能模块"的"用户管理"表格中添加相应说明

### 示例 2：添加新的 Service

**操作**：
```java
// 创建新的 NotificationService.java
@Service
public class NotificationService {
    public void sendNotification(String message) {
        // ...
    }
}
```

**AI 会自动**：
1. ✅ 在 `README.md` 的"二、目录结构"中更新 service 列表
2. ✅ 在"三、核心功能模块"中添加"通知服务"模块说明
3. ✅ 在"四、技术栈"中更新相关技术（如果需要）

### 示例 3：添加新的依赖

**操作**：
```xml
<!-- 在 pom.xml 中添加 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

**AI 会自动**：
1. ✅ 在 `README.md` 的"四、技术栈"表格中添加邮件相关技术

## 如何确保文档同步

### 方法 1：让 AI 自动处理（推荐）

直接告诉 AI 你的修改意图，AI 会自动更新代码和文档：

```
在 UserController 中添加一个获取用户统计信息的 API 端点
```

AI 会：
1. 添加代码
2. 自动更新文档

### 方法 2：手动提醒 AI

如果 AI 没有自动更新文档，可以提醒：

```
请同步更新 services/user-service/docs/README.md 文档
```

### 方法 3：检查文档

修改代码后，检查 `services/user-service/docs/README.md` 是否已更新：
- 查看"五、API 端点"部分
- 查看"三、核心功能模块"部分
- 查看"二、目录结构"部分

## 文档结构说明

`README.md` 包含以下主要章节：

1. **一、核心定位** - 服务的主要职责
2. **二、目录结构** - 代码组织结构
3. **三、核心功能模块** - 功能说明表格
4. **四、技术栈** - 使用的技术和框架
5. **五、API 端点** - 所有 API 列表
6. **六、设计特点** - 架构设计说明
7. **七、与其他服务的关系** - 服务依赖关系
8. **八、启动配置** - 启动类配置说明
9. **九、数据库迁移** - Flyway 迁移脚本列表
10. **十、安全特性** - 安全相关功能
11. **十一、测试** - 测试相关说明
12. **十二、部署** - 部署相关说明

## 注意事项

1. **文档格式**：AI 会自动保持文档格式一致
2. **中文描述**：所有文档内容使用中文
3. **准确性**：确保 API 路径、方法名等信息准确
4. **完整性**：更新时不会遗漏相关信息

## 故障排查

### 问题：AI 没有自动更新文档

**解决方案**：
1. 检查是否在修改 `services/user-service/` 目录下的文件
2. 明确告诉 AI："请同步更新文档"
3. 检查 Cursor 规则是否生效（查看 `.cursor/rules/24-服务文档自动同步规范.mdc`）

### 问题：文档格式不一致

**解决方案**：
1. 告诉 AI："请按照规范格式更新文档"
2. 参考 `services/user-service/docs/README.md` 的格式

### 问题：文档内容不准确

**解决方案**：
1. 检查代码变更是否已正确反映在文档中
2. 手动修正或告诉 AI："请修正文档中的 XXX 部分"

## 相关文档

- [服务文档自动同步规范](../../../.cursor/rules/24-服务文档自动同步规范.mdc) - 完整的同步规则
- [README.md](./README.md) - 服务文档主文件
