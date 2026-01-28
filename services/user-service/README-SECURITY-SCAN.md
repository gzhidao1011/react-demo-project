# 安全扫描指南

本文档说明如何使用 OWASP Dependency Check 进行依赖安全扫描。

## 前置要求

- Maven 3.8+
- Java 17+

## 运行扫描

### 基本命令

```bash
cd services/user-service

# 运行安全扫描（跳过测试）
mvn org.owasp:dependency-check-maven:check -DskipTests

# 或者使用 Maven 生命周期
mvn verify -DskipTests
```

### 首次运行

首次运行 OWASP Dependency Check 需要下载漏洞数据库，可能需要较长时间（10-30 分钟），请耐心等待。

### 查看报告

扫描完成后，报告会生成在：

```
target/dependency-check-report/dependency-check-report.html
```

使用浏览器打开该文件查看详细报告。

## 报告说明

### 报告内容

报告包含以下信息：

1. **依赖列表**：所有扫描的依赖及其版本
2. **漏洞列表**：发现的已知漏洞
3. **漏洞详情**：
   - CVE 编号
   - CVSS 评分（0-10）
   - 漏洞描述
   - 修复建议

### CVSS 评分说明

- **9.0-10.0**：严重（Critical）
- **7.0-8.9**：高危（High）
- **4.0-6.9**：中危（Medium）
- **0.1-3.9**：低危（Low）

### 处理建议

1. **严重和高危漏洞**：优先修复，更新到安全版本
2. **中危漏洞**：评估影响后决定是否修复
3. **低危漏洞**：可以延后处理

## 配置说明

### 插件配置

在 `pom.xml` 中已配置 OWASP Dependency Check 插件：

```xml
<plugin>
    <groupId>org.owasp</groupId>
    <artifactId>dependency-check-maven</artifactId>
    <version>11.0.0</version>
    <configuration>
        <format>HTML</format>
        <outputDirectory>${project.build.directory}/dependency-check-report</outputDirectory>
        <skipTests>true</skipTests>
    </configuration>
</plugin>
```

### 自定义配置

可以修改 `pom.xml` 中的配置：

```xml
<configuration>
    <!-- 设置失败构建阈值（CVSS 评分） -->
    <failBuildOnCVSS>7</failBuildOnCVSS>
    
    <!-- 排除特定依赖 -->
    <excludes>
        <exclude>org.example:some-library</exclude>
    </excludes>
</configuration>
```

## CI/CD 集成

### GitHub Actions

在 CI/CD 工作流中添加安全扫描：

```yaml
- name: Run OWASP Dependency Check
  run: |
    cd services/user-service
    mvn org.owasp:dependency-check-maven:check -DskipTests
    
- name: Upload Security Report
  uses: actions/upload-artifact@v3
  with:
    name: dependency-check-report
    path: services/user-service/target/dependency-check-report/
```

## 常见问题

### 1. 扫描时间过长

**原因**：首次运行需要下载漏洞数据库

**解决**：耐心等待，后续运行会使用缓存的数据库

### 2. 误报

**原因**：某些漏洞可能不适用于当前使用场景

**解决**：评估漏洞影响，必要时在配置中排除

### 3. 无法下载数据库

**原因**：网络问题或防火墙限制

**解决**：检查网络连接，或使用代理

## 最佳实践

1. **定期扫描**：建议每周或每月运行一次
2. **CI/CD 集成**：在 CI/CD 中自动运行扫描
3. **及时修复**：发现高危漏洞后及时更新依赖
4. **记录修复**：记录漏洞修复过程和决策

## 相关文档

- [OWASP Dependency Check 官方文档](https://jeremylong.github.io/DependencyCheck/)
- [安全规范](../../.cursor/rules/21-安全规范.mdc)
