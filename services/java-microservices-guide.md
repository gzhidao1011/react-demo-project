# Java 微服务从零搭建指南

> 为不熟悉 Java 的开发者提供完整的微服务搭建教程，从环境准备到第一个微服务，再到完整的微服务架构。

## 目录

- [一、环境准备](#一环境准备)
- [二、Spring Boot 基础](#二spring-boot-基础)
- [三、创建第一个微服务](#三创建第一个微服务)
- [四、服务注册与发现](#四服务注册与发现)
- [五、API 网关](#五api-网关)
- [六、服务间通信](#六服务间通信)
- [七、数据库集成](#七数据库集成)
- [八、运行和测试](#八运行和测试)
- [九、Docker 部署](#九docker-部署)
- [十、学习路径建议](#十学习路径建议)
- [十一、常见问题解决](#十一常见问题解决)
- [十二、推荐学习资源](#十二推荐学习资源)

---

## 一、环境准备

### 1.1 安装 Java 开发环境

#### 下载和安装 JDK

1. **下载 JDK 17**（推荐 LTS 版本）
   - 访问：https://adoptium.net/ 或 https://www.oracle.com/java/technologies/downloads/
   - 选择 Windows x64 版本下载
   - 安装到默认路径（如 `C:\Program Files\Java\jdk-17`）

2. **配置环境变量**
   
   打开"系统属性" → "环境变量"，添加：
   
   ```bash
   # 新建系统环境变量
   JAVA_HOME = C:\Program Files\Java\jdk-17
   
   # 添加到 PATH（在现有 PATH 后添加）
   PATH = %JAVA_HOME%\bin;%PATH%
   ```

3. **验证安装**
   
   打开命令提示符（CMD）或 PowerShell，运行：
   
   ```bash
   java -version
   javac -version
   ```
   
   应该显示类似以下信息：
   ```
   openjdk version "17.0.x" 2024-xx-xx
   OpenJDK Runtime Environment (build 17.0.x+xx)
   OpenJDK 64-Bit Server VM (build 17.0.x+xx, mixed mode, sharing)
   ```

### 1.2 安装 Maven（项目构建工具）

1. **下载 Maven**
   - 访问：https://maven.apache.org/download.cgi
   - 下载 `apache-maven-3.9.x-bin.zip`

2. **解压和配置**
   - 解压到 `C:\Program Files\Apache\maven`
   - 配置环境变量：
     ```bash
     MAVEN_HOME = C:\Program Files\Apache\maven
     PATH = %MAVEN_HOME%\bin;%PATH%
     ```

3. **验证安装**
   ```bash
   mvn -version
   ```
   
   应该显示 Maven 版本信息。

4. **配置 Maven 镜像**（加速下载）
   
   编辑 `C:\Program Files\Apache\maven\conf\settings.xml`，在 `<mirrors>` 标签内添加：
   
   ```xml
   <mirror>
     <id>aliyun</id>
     <mirrorOf>central</mirrorOf>
     <name>Aliyun Maven</name>
     <url>https://maven.aliyun.com/repository/public</url>
   </mirror>
   ```

### 1.3 安装 IDE（开发工具）

#### 选项一：IntelliJ IDEA Community Edition（推荐，免费）

1. **下载**
   - 访问：https://www.jetbrains.com/idea/download/
   - 下载 Community Edition（免费版）

2. **安装后配置**
   - File → Settings → Build → Build Tools → Maven
   - 设置 Maven home directory：`C:\Program Files\Apache\maven`
   - 设置 User settings file：`C:\Program Files\Apache\maven\conf\settings.xml`

#### 选项二：VS Code + Java 扩展包

1. **安装 VS Code**
   - 访问：https://code.visualstudio.com/

2. **安装 Java 扩展**
   - 打开扩展面板（Ctrl+Shift+X）
   - 搜索并安装 "Extension Pack for Java"
   - 配置 Java 路径

### 1.4 安装 Docker（可选，用于部署）

1. **下载 Docker Desktop**
   - 访问：https://www.docker.com/products/docker-desktop
   - 安装并启动 Docker Desktop

2. **验证安装**
   ```bash
   docker --version
   docker-compose --version
   ```

---

## 二、Spring Boot 基础

### 2.1 什么是 Spring Boot？

**Spring Boot** 是 Java 开发框架，简化了 Spring 应用的创建和配置。

**核心优势**：
- ✅ **自动配置**：无需手动配置，开箱即用
- ✅ **内嵌服务器**：内置 Tomcat，无需单独部署
- ✅ **生产就绪**：提供监控、健康检查等功能
- ✅ **约定优于配置**：减少配置，提高开发效率

### 2.2 创建第一个 Spring Boot 项目

#### 方法一：使用 Spring Initializr（推荐）

1. **访问 Spring Initializr**
   - 打开：https://start.spring.io/

2. **配置项目信息**
   - **Project**: Maven
   - **Language**: Java
   - **Spring Boot**: 3.2.x（选择最新稳定版）
   - **Group**: com.example
   - **Artifact**: demo-service
   - **Name**: demo-service
   - **Package name**: com.example.demo
   - **Packaging**: Jar
   - **Java**: 17
   - **Configuration**: YAML（推荐，本指南后续示例均使用 YAML 格式）

   > **说明**：Configuration 选项用于选择配置文件格式。
   > - **YAML**（推荐）：层次清晰，可读性好，适合复杂配置，本指南所有示例均使用 YAML
   > - **Properties**：传统格式，简单直接，适合简单配置

3. **添加依赖**
   - 点击 "Add Dependencies"
   - 搜索并添加：
     - **Spring Web**（构建 REST API）
     - **Spring Boot DevTools**（热重载，开发时自动重启）

4. **生成并下载项目**
   - 点击 "Generate" 按钮
   - 下载 ZIP 文件并解压

5. **导入到 IDE**
   - **IntelliJ IDEA**: File → Open → 选择解压后的文件夹
   - **VS Code**: File → Open Folder → 选择解压后的文件夹

### 2.3 项目结构说明

```
demo-service/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/demo/
│   │   │       └── DemoServiceApplication.java  # 主启动类
│   │   └── resources/
│   │       ├── application.properties           # 配置文件
│   │       └── static/                          # 静态资源
│   └── test/                                    # 测试代码
├── pom.xml                                      # Maven 配置文件
└── README.md
```

**关键文件说明**：
- **`pom.xml`**：Maven 项目配置，定义依赖和构建配置
- **`application.properties`**：应用配置文件（端口、数据库等）
- **`DemoServiceApplication.java`**：Spring Boot 启动类，包含 `main` 方法

### 2.4 创建第一个 REST API

#### 1. 创建实体类（Model）

首先创建 User 实体类，用于表示用户数据。

创建文件 `src/main/java/com/example/demo/model/User.java`：

```java
package com.example.demo.model;

public class User {
    private Long id;
    private String name;
    private String email;
    
    // 无参构造函数（Java 默认提供，但显式声明更清晰）
    public User() {
    }
    
    // 带参构造函数（可选）
    public User(Long id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }
    
    // Getter 和 Setter 方法
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
}
```

> **提示**：在实际项目中，可以使用 Lombok 注解简化代码（`@Data` 会自动生成 Getter/Setter），但为了初学者理解，这里使用传统方式。

#### 2. 创建 Controller（处理 HTTP 请求）

创建文件 `src/main/java/com/example/demo/controller/HelloController.java`：

```java
package com.example.demo.controller;

import com.example.demo.model.User;  // 导入 User 类
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HelloController {
    
    @GetMapping("/hello")
    public String hello() {
        return "Hello, Microservices!";
    }
    
    @GetMapping("/user")
    public User getUser() {
        User user = new User();
        user.setId(1L);
        user.setName("张三");
        user.setEmail("zhangsan@example.com");
        return user;
    }
}
```

**代码说明**：
- `@RestController`：标识这是一个 REST 控制器，自动将返回值转换为 JSON
- `@RequestMapping("/api")`：所有接口的前缀路径
- `@GetMapping("/hello")`：处理 GET 请求，路径为 `/api/hello`
- `@GetMapping("/user")`：返回 User 对象，Spring Boot 会自动转换为 JSON 格式
- `import com.example.demo.model.User`：导入 User 类，使用独立的类文件而不是内部类

#### 2. 运行项目

**方法一：使用 Maven 命令**
```bash
cd demo-service
mvn spring-boot:run
```

**方法二：在 IDE 中运行**
- 找到 `DemoServiceApplication.java` 文件
- 右键 → Run 'DemoServiceApplication'
- 或点击类名旁边的绿色运行按钮

#### 3. 测试 API

打开浏览器或使用 Postman 访问：
- http://localhost:8080/api/hello
- http://localhost:8080/api/user

**预期结果**：
- `/api/hello` 返回：`"Hello, Microservices!"`
- `/api/user` 返回：`{"id":1,"name":"张三","email":"zhangsan@example.com"}`

---

## 三、创建第一个微服务

> **重要说明**：本章节将创建一个**全新的微服务项目**（`microservices-demo`），与第二章的 `demo-service` 是**不同的项目**。
> 
> **两者的区别**：
> - **`demo-service`**（第二章）：单个 Spring Boot 项目，用于学习 Spring Boot 基础
> - **`microservices-demo`**（第三章）：多模块微服务项目，包含多个独立的服务模块
> 
> **建议**：
> - 如果你已经完成了第二章的学习，可以保留 `demo-service` 作为参考
> - 现在创建一个新的目录来存放微服务项目，例如在项目根目录创建 `microservices-demo` 文件夹
> - 或者直接在项目根目录创建，与 `demo-service` 并列

### 3.1 微服务项目结构

创建多模块项目结构（**新项目**，与 `demo-service` 分开）：

```
microservices-demo/
├── user-service/          # 用户服务
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
├── order-service/         # 订单服务
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
├── api-gateway/           # API 网关
│   ├── src/
│   └── pom.xml
├── service-registry/      # 服务注册中心（可选）
│   ├── src/
│   └── pom.xml
└── pom.xml               # 父 POM（聚合所有模块）
```

### 3.2 创建父项目（聚合项目）

在项目根目录创建 `pom.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>microservices-demo</artifactId>
    <version>1.0.0</version>
    <packaging>pom</packaging>

    <name>Microservices Demo</name>
    <description>微服务架构示例项目</description>

    <properties>
        <java.version>17</java.version>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <spring-boot.version>3.2.0</spring-boot.version>
        <spring-cloud.version>2023.0.0</spring-cloud.version>
    </properties>

    <!-- 子模块列表 -->
    <modules>
        <module>user-service</module>
        <module>order-service</module>
        <module>api-gateway</module>
    </modules>

    <!-- 依赖管理：统一管理所有子模块的依赖版本 -->
    <dependencyManagement>
        <dependencies>
            <!-- Spring Boot -->
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>${spring-boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <!-- Spring Cloud -->
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <build>
        <pluginManagement>
            <plugins>
                <plugin>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-maven-plugin</artifactId>
                    <version>${spring-boot.version}</version>
                </plugin>
            </plugins>
        </pluginManagement>
    </build>
</project>
```

### 3.3 创建用户服务（user-service）

#### 1. 创建模块目录结构

```bash
mkdir -p user-service/src/main/java/com/example/user
mkdir -p user-service/src/main/resources
mkdir -p user-service/src/test/java
```

#### 2. 创建 `user-service/pom.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.example</groupId>
        <artifactId>microservices-demo</artifactId>
        <version>1.0.0</version>
    </parent>

    <artifactId>user-service</artifactId>
    <packaging>jar</packaging>

    <dependencies>
        <!-- Spring Boot Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <!-- Spring Cloud Alibaba Nacos（服务注册与发现） -->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        </dependency>
        
        <!-- Spring Boot Actuator（健康检查） -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        
        <!-- Lombok（简化代码，自动生成 Getter/Setter） -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

#### 3. 创建配置文件 `user-service/src/main/resources/application.yml`

```yaml
server:
  port: 8001  # 服务端口

spring:
  application:
    name: user-service  # 服务名称
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848  # Nacos 服务器地址
        namespace: public  # 命名空间，默认 public
        group: DEFAULT_GROUP  # 分组，默认 DEFAULT_GROUP

# 健康检查配置
management:
  endpoints:
    web:
      exposure:
        include: health,info  # 暴露健康检查端点
```

#### 4. 创建主启动类 `UserServiceApplication.java`

```java
package com.example.user;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient  // 启用服务发现，注册到 Nacos
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}
```

#### 5. 创建用户实体类 `User.java`

```java
package com.example.user.model;

import lombok.Data;

@Data  // Lombok 注解，自动生成 Getter、Setter、toString 等方法
public class User {
    private Long id;
    private String name;
    private String email;
    private String phone;
}
```

#### 6. 创建 Controller `UserController.java`

```java
package com.example.user.controller;

import com.example.user.model.User;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    // 临时使用内存存储，实际应该使用数据库
    private List<User> users = new ArrayList<>();
    
    // 初始化一些测试数据
    public UserController() {
        User user1 = new User();
        user1.setId(1L);
        user1.setName("张三");
        user1.setEmail("zhangsan@example.com");
        user1.setPhone("13800138000");
        
        User user2 = new User();
        user2.setId(2L);
        user2.setName("李四");
        user2.setEmail("lisi@example.com");
        user2.setPhone("13900139000");
        
        users.add(user1);
        users.add(user2);
    }
    
    // 获取所有用户
    @GetMapping
    public List<User> getAllUsers() {
        return users;
    }
    
    // 根据 ID 获取用户
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return users.stream()
                .filter(user -> user.getId().equals(id))
                .findFirst()
                .orElse(null);
    }
    
    // 创建用户
    @PostMapping
    public User createUser(@RequestBody User user) {
        user.setId((long) (users.size() + 1));
        users.add(user);
        return user;
    }
    
    // 更新用户
    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User user) {
        User existingUser = users.stream()
                .filter(u -> u.getId().equals(id))
                .findFirst()
                .orElse(null);
        
        if (existingUser != null) {
            existingUser.setName(user.getName());
            existingUser.setEmail(user.getEmail());
            existingUser.setPhone(user.getPhone());
        }
        
        return existingUser;
    }
    
    // 删除用户
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        users.removeIf(user -> user.getId().equals(id));
    }
}
```

### 3.4 创建订单服务（order-service）

按照同样的方式创建订单服务，结构类似：

**`order-service/pom.xml`**（与 user-service 类似，修改 artifactId）

**`order-service/src/main/resources/application.yml`**：
```yaml
server:
  port: 8002

spring:
  application:
    name: order-service
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848  # Nacos 服务器地址
        namespace: public
        group: DEFAULT_GROUP
```

**`OrderServiceApplication.java`**：
```java
package com.example.order;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class OrderServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}
```

---

## 四、服务注册与发现

### 4.1 什么是服务注册与发现？

在微服务架构中，服务需要知道其他服务的位置。服务注册与发现机制让服务可以：
- **注册**：服务启动时向注册中心注册自己的地址
- **发现**：通过服务名查找其他服务的地址
- **健康检查**：注册中心定期检查服务是否健康

### 4.1.1 Nacos 是什么？

**Nacos** 是阿里巴巴开源的一个动态服务发现、配置管理和服务管理平台。

#### Nacos 的核心功能

1. **服务发现（Service Discovery）**
   - 服务启动时自动注册到 Nacos
   - 其他服务通过服务名查找服务地址
   - 自动处理服务实例的添加和移除
   - 支持服务分组和命名空间

2. **健康检查（Health Checking）**
   - 定期检查服务是否正常运行
   - 自动移除不健康的服务实例
   - 支持多种健康检查方式（HTTP、TCP、MySQL 等）

3. **配置管理（Configuration）**
   - 集中管理服务配置
   - 支持配置的动态更新和实时推送
   - 支持多环境配置（开发、测试、生产）
   - 支持配置版本管理和回滚

4. **服务管理（Service Management）**
   - 服务元数据管理
   - 服务路由规则配置
   - 服务权重和流量管理

#### Nacos 在微服务架构中的作用

**没有 Nacos 的问题**：
```
用户服务 → 需要知道订单服务的 IP 和端口
订单服务 → 需要知道用户服务的 IP 和端口
支付服务 → 需要知道订单服务的 IP 和端口

问题：
- 服务地址硬编码，难以维护
- 服务实例变化时需要手动更新配置
- 无法自动发现新服务
- 无法检测服务是否健康
- 配置修改需要重启服务
```

**使用 Nacos 后**：
```
所有服务 → 注册到 Nacos
         ↓
    Nacos 注册中心
         ↓
服务通过服务名查找其他服务（如：user-service、order-service）

优势：
- 服务地址动态发现，无需硬编码
- 自动处理服务实例的变化
- 自动健康检查，移除不健康实例
- 支持负载均衡
- 配置动态更新，无需重启服务
```

#### Nacos 工作流程示例

```
1. 服务启动
   user-service 启动在 192.168.1.100:8001
   ↓
2. 注册到 Nacos
   user-service 向 Nacos 注册：服务名=user-service, 地址=192.168.1.100:8001
   ↓
3. Nacos 存储服务信息
   Nacos 记录：user-service → [192.168.1.100:8001, 192.168.1.101:8001, ...]
   ↓
4. 其他服务查找
   order-service 需要调用 user-service
   → 向 Nacos 查询：user-service 的地址是什么？
   → Nacos 返回：192.168.1.100:8001
   ↓
5. 服务调用
   order-service → http://192.168.1.100:8001/api/users/1
   ↓
6. 健康检查
   Nacos 定期检查 user-service 是否健康
   → 如果服务挂了，自动从列表中移除
```

**为什么选择 Nacos？**
- ✅ 功能全面（服务发现 + 配置管理）
- ✅ 中文文档完善，适合国内开发者
- ✅ 与 Spring Cloud Alibaba 深度集成
- ✅ 支持动态配置刷新
- ✅ 国内访问速度快，社区活跃
- ✅ 易于学习和使用

### 4.2 安装 Nacos

> **前置要求**：如果还没有安装 Docker，请先参考 [第一章 1.4 节](#14-安装-docker可选用于部署) 安装 Docker Desktop。

#### 方法一：使用 Docker（推荐）

**步骤 1：确保 Docker 已安装并运行**

```bash
# 验证 Docker 是否安装
docker --version

# 如果显示版本号，说明已安装
# 如果没有安装，请先安装 Docker Desktop（见第一章 1.4 节）
```

**步骤 2：运行 Nacos 容器**

```bash
# 运行 Nacos（单机模式，带控制台）
docker run -d \
  -p 8848:8848 \
  -p 9848:9848 \
  --name nacos \
  -e MODE=standalone \
  -e PREFER_HOST_MODE=hostname \
  nacos/nacos-server:v2.3.0

# 参数说明：
# -d: 后台运行
# -p 8848:8848: 映射主端口（Nacos 控制台和 API）
# -p 9848:9848: 映射 gRPC 端口（服务注册）
# --name nacos: 容器名称
# -e MODE=standalone: 单机模式（开发环境）
# -e PREFER_HOST_MODE=hostname: 使用主机名模式
# nacos/nacos-server:v2.3.0: Nacos 镜像版本

# 如果遇到网络问题，可以先手动拉取镜像
docker pull nacos/nacos-server:v2.3.0
docker run -d -p 8848:8848 -p 9848:9848 --name nacos \
  -e MODE=standalone \
  -e PREFER_HOST_MODE=hostname \
  nacos/nacos-server:v2.3.0
```

**步骤 3：验证 Nacos 运行状态**

```bash
# 查看运行中的容器
docker ps

# 应该能看到 nacos 容器在运行

# 查看 Nacos 日志
docker logs nacos

# 如果看到 "Nacos started successfully" 说明启动成功
```

**常用 Docker 命令**

```bash
# 停止 Nacos
docker stop nacos

# 启动已停止的 Nacos
docker start nacos

# 重启 Nacos
docker restart nacos

# 删除 Nacos 容器（会删除数据）
docker rm -f nacos

# 查看 Nacos 容器详细信息
docker inspect nacos
```

#### 方法二：直接下载（不推荐，配置复杂）

1. 访问：https://github.com/alibaba/nacos/releases
2. 下载 Nacos Server 压缩包
3. 解压后运行：
   ```bash
   # Windows
   startup.cmd -m standalone
   
   # Linux/Mac
   sh startup.sh -m standalone
   ```

#### 访问 Nacos 控制台

打开浏览器访问：http://localhost:8848/nacos

**默认登录信息**：
- 用户名：`nacos`
- 密码：`nacos`

在控制台中可以：
- 查看所有注册的服务（服务管理 → 服务列表）
- 查看服务健康状态
- 管理配置（配置管理 → 配置列表）
- 查看服务详情和实例信息

### 4.3 验证服务注册

1. **启动 Nacos**（如果还没启动）
   ```bash
   docker start nacos
   # 或
   docker run -d -p 8848:8848 -p 9848:9848 --name nacos \
     -e MODE=standalone \
     -e PREFER_HOST_MODE=hostname \
     nacos/nacos-server:v2.3.0
   ```

2. **启动用户服务**
   ```bash
   cd services/user-service
   mvn spring-boot:run
   ```
   等待看到 "Started UserServiceApplication" 消息

3. **查看 Nacos 控制台**
   - 访问 http://localhost:8848/nacos
   - 登录（用户名：`nacos`，密码：`nacos`）
   - 进入 "服务管理" → "服务列表"
   - 应该能看到 `user-service` 服务

4. **查看服务详情**
   - 点击 `user-service` 服务名
   - 可以看到服务的实例列表、IP 地址、端口等信息
   - 可以看到服务的健康状态

---

## 五、API 网关

### 5.1 什么是 API 网关？

API 网关是微服务架构的入口，提供：
- **统一入口**：所有请求都通过网关
- **路由转发**：根据路径转发到不同服务
- **负载均衡**：在多个服务实例间分配请求
- **认证授权**：统一处理认证
- **限流熔断**：保护后端服务

### 5.2 创建 API 网关

#### 1. 创建 `api-gateway/pom.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.example</groupId>
        <artifactId>microservices-demo</artifactId>
        <version>1.0.0</version>
    </parent>

    <artifactId>api-gateway</artifactId>
    <packaging>jar</packaging>

    <dependencies>
        <!-- Spring Cloud Gateway -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-gateway</artifactId>
        </dependency>
        
        <!-- Nacos 服务发现 -->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        </dependency>
        
        <!-- LoadBalancer（负载均衡） -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-loadbalancer</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

#### 2. 创建配置文件 `api-gateway/src/main/resources/application.yml`

```yaml
server:
  port: 8080  # 网关端口

spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      routes:
        # 用户服务路由
        - id: user-service
          uri: lb://user-service  # lb 表示负载均衡，user-service 是服务名
          predicates:
            - Path=/api/users/**  # 匹配路径
          # 不使用 StripPrefix，直接转发完整路径 /api/users/** 到服务
        
        # 订单服务路由
        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
          # 不使用 StripPrefix，直接转发完整路径 /api/orders/** 到服务
    
    nacos:
      discovery:
        server-addr: localhost:8848  # Nacos 服务器地址
        namespace: public
        group: DEFAULT_GROUP
```

#### 3. 创建主启动类 `ApiGatewayApplication.java`

```java
package com.example.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class ApiGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
```

### 5.3 测试 API 网关

1. **启动所有服务**（按顺序）
   - **第一步**：启动 Nacos（如果还没启动）
     ```bash
     docker start nacos
     # 或
     docker run -d -p 8848:8848 -p 9848:9848 --name nacos \
       -e MODE=standalone \
       -e PREFER_HOST_MODE=hostname \
       nacos/nacos-server:v2.3.0
     ```
   
   - **第二步**：启动 user-service
     ```bash
     cd services/user-service
     mvn spring-boot:run
     ```
     等待看到 "Started UserServiceApplication" 消息
   
   - **第三步**：启动 order-service
     ```bash
     cd services/order-service
     mvn spring-boot:run
     ```
   
   - **第四步**：启动 api-gateway
     ```bash
     cd services/api-gateway
     mvn spring-boot:run
     ```

2. **验证服务注册**
   - 访问 Nacos 控制台：http://localhost:8848/nacos
   - 登录（用户名：`nacos`，密码：`nacos`）
   - 进入 "服务管理" → "服务列表"
   - 确认能看到：`user-service`、`order-service`、`api-gateway`

3. **通过网关访问服务**
   - http://localhost:8080/api/users（通过网关访问用户服务）
   - http://localhost:8080/api/users/1（获取 ID 为 1 的用户）
   - http://localhost:8080/api/orders（通过网关访问订单服务）

4. **对比直接访问**
   - http://localhost:8001/api/users（直接访问用户服务）
   - http://localhost:8002/api/orders（直接访问订单服务）

5. **如果遇到 404 错误，检查以下内容**：
   - ✅ Nacos 是否正常运行（访问 http://localhost:8848/nacos）
   - ✅ 服务是否已注册到 Nacos（在控制台查看服务列表）
   - ✅ 网关路由配置是否正确（检查 `application.yml`）
   - ✅ 服务是否正常启动（查看启动日志，确认端口）
   - ✅ 直接访问服务是否正常（先测试 http://localhost:8001/api/users）

---

## 六、服务间通信

### 6.1 国内常用的服务间通信方案

在国内 Java 微服务开发中，主要有以下几种服务间通信方案：

#### 方案对比

| 方案 | 国内使用情况 | 优势 | 适用场景 |
|------|------------|------|----------|
| **Dubbo** | ⭐⭐⭐⭐⭐ 非常流行 | 性能高、功能全、中文文档完善 | **国内企业项目、RPC 调用（推荐）** |
| **RestTemplate** | ⭐⭐⭐ 传统方案 | 灵活 | 简单场景（已不推荐） |
| **WebClient** | ⭐⭐ 较少使用 | 响应式、性能好 | 高并发、响应式项目 |

#### 为什么选择 Dubbo？

**Dubbo 的优势**：
- ✅ **国内最流行**：国内企业级项目中使用非常广泛
- ✅ **阿里巴巴开源**：中文文档完善，社区活跃
- ✅ **性能优秀**：RPC 调用，比 HTTP 更快
- ✅ **功能全面**：负载均衡、容错、路由、限流等
- ✅ **支持多种注册中心**：Nacos、Zookeeper、Consul 等
- ✅ **国内社区活跃**：问题解决快，资源丰富

### 6.2 使用 Dubbo（RPC 框架）

Dubbo 是阿里巴巴开源的高性能 RPC 框架，让服务间调用像调用本地方法一样简单，性能比 HTTP 调用更高。

> **重要提示**：在微服务架构中，服务不能直接引用其他服务的类。我们需要创建一个**共享 API 模块**来存放服务间共享的模型类和服务接口。

#### 1. 创建共享 API 模块

在微服务架构中，当多个服务需要共享模型类或接口时，应该创建一个共享模块。

**创建 `services/api-common/pom.xml`**：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.example</groupId>
        <artifactId>microservices-demo</artifactId>
        <version>1.0.0</version>
    </parent>

    <artifactId>api-common</artifactId>
    <packaging>jar</packaging>
    <description>共享 API 模块，包含服务间共享的模型类和服务接口</description>

    <dependencies>
        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
</project>
```

**创建共享的 User 模型类**：`services/api-common/src/main/java/com/example/api/model/User.java`

```java
package com.example.api.model;

import lombok.Data;

@Data
public class User {
    private Long id;
    private String name;
    private String email;
    private String phone;
}
```

**创建共享的 UserService 接口**：`services/api-common/src/main/java/com/example/api/service/UserService.java`

```java
package com.example.api.service;

import com.example.api.model.User;
import java.util.List;

public interface UserService {
    User getUserById(Long id);
    List<User> getAllUsers();
}
```

**更新父 POM**：在 `services/pom.xml` 的 `<modules>` 中添加：

```xml
<modules>
    <module>api-common</module>
    <module>user-service</module>
    <module>order-service</module>
    <module>api-gateway</module>
</modules>
```

#### 2. 在父 POM 中添加 Dubbo 依赖管理

修改 `services/pom.xml`，在 `dependencyManagement` 中添加：

```xml
<!-- Dubbo Spring Boot Starter -->
<dependency>
    <groupId>org.apache.dubbo</groupId>
    <artifactId>dubbo-spring-boot-starter</artifactId>
    <version>3.2.10</version>
</dependency>
```

#### 3. 在 user-service 中添加依赖和配置

**修改 `user-service/pom.xml`，添加依赖**：

```xml
<!-- 共享 API 模块 -->
<dependency>
    <groupId>com.example</groupId>
    <artifactId>api-common</artifactId>
    <version>${project.version}</version>
</dependency>

<!-- Dubbo Spring Boot Starter -->
<dependency>
    <groupId>org.apache.dubbo</groupId>
    <artifactId>dubbo-spring-boot-starter</artifactId>
</dependency>
```

**修改 `user-service/src/main/resources/application.yml`**：

```yaml
server:
  port: 8001

spring:
  application:
    name: user-service

# Dubbo 配置
dubbo:
  application:
    name: user-service
  registry:
    address: nacos://localhost:8848  # 使用 Nacos 作为注册中心
  protocol:
    name: dubbo
    port: 20880  # Dubbo 协议端口
  scan:
    base-packages: com.example.user.service  # 扫描服务实现类
```

#### 4. 创建服务接口（在 user-service 中）

创建 `user-service/src/main/java/com/example/user/service/UserService.java`，继承共享接口：

```java
package com.example.user.service;

import com.example.api.service.UserService;

/**
 * 用户服务接口（继承共享接口）
 */
public interface UserService extends com.example.api.service.UserService {
    // 如果需要添加 user-service 特有的方法，可以在这里定义
}
```

#### 5. 实现服务接口（在 user-service 中）

创建 `user-service/src/main/java/com/example/user/service/impl/UserServiceImpl.java`：

```java
package com.example.user.service.impl;

import com.example.api.model.User;  // 使用共享模块的 User
import com.example.user.service.UserService;
import org.apache.dubbo.config.annotation.DubboService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@DubboService  // 标记为 Dubbo 服务，会被注册到注册中心
@Service
public class UserServiceImpl implements UserService {
    
    private List<User> users = new ArrayList<>();
    
    public UserServiceImpl() {
        // 初始化测试数据
        User user1 = new User();
        user1.setId(1L);
        user1.setName("张三");
        user1.setEmail("zhangsan@example.com");
        user1.setPhone("13800138000");
        
        User user2 = new User();
        user2.setId(2L);
        user2.setName("李四");
        user2.setEmail("lisi@example.com");
        user2.setPhone("13900139000");
        
        users.add(user1);
        users.add(user2);
    }
    
    @Override
    public User getUserById(Long id) {
        return users.stream()
                .filter(user -> user.getId().equals(id))
                .findFirst()
                .orElse(null);
    }
    
    @Override
    public List<User> getAllUsers() {
        return users;
    }
}
```

#### 4.1 更新 UserController（可选，推荐）

为了保持数据一致性，让 `UserController` 也使用 `UserService`：

修改 `user-service/src/main/java/com/example/user/controller/UserController.java`：

```java
package com.example.user.controller;

import com.example.user.model.User;
import com.example.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;  // 注入 Dubbo 服务
    
    // 获取所有用户
    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }
    
    // 根据 ID 获取用户
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }
}
```

这样，`user-service` 同时提供：
- **REST API**：供前端和 API 网关调用（HTTP）
- **Dubbo 服务**：供其他后端服务调用（RPC）

#### 6. 在 order-service 中添加依赖和配置

**修改 `order-service/pom.xml`，添加依赖**：

```xml
<!-- 共享 API 模块 -->
<dependency>
    <groupId>com.example</groupId>
    <artifactId>api-common</artifactId>
    <version>${project.version}</version>
</dependency>

<!-- Dubbo Spring Boot Starter -->
<dependency>
    <groupId>org.apache.dubbo</groupId>
    <artifactId>dubbo-spring-boot-starter</artifactId>
</dependency>
```

**修改 `order-service/src/main/resources/application.yml`**：

```yaml
server:
  port: 8002

spring:
  application:
    name: order-service

# Dubbo 配置
dubbo:
  application:
    name: order-service
  registry:
    address: nacos://localhost:8848  # 使用 Nacos 作为注册中心
  protocol:
    name: dubbo
    port: 20881  # Dubbo 协议端口（每个服务使用不同端口）
```

#### 7. 在 order-service 中引用远程服务

创建 `order-service/src/main/java/com/example/order/service/UserService.java`，继承共享接口：

```java
package com.example.order.service;

import com.example.api.service.UserService;

/**
 * 用户服务接口（使用共享接口）
 * 用于在 order-service 中引用远程服务
 */
public interface UserService extends com.example.api.service.UserService {
    // 如果需要添加 order-service 特有的方法，可以在这里定义
}
```

**在 Controller 中使用**：

修改 `order-service/src/main/java/com/example/order/controller/OrderController.java`：

```java
package com.example.order.controller;

import com.example.api.model.User;  // 使用共享模块的 User
import com.example.order.model.Order;
import com.example.order.service.UserService;  // 导入远程服务接口
import org.apache.dubbo.config.annotation.DubboReference;  // Dubbo 引用注解
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    
    @DubboReference  // 引用远程服务，Dubbo 会自动从注册中心查找服务
    private UserService userService;  // 注入远程服务
    
    private List<Order> orders = new ArrayList<>();
    
    @GetMapping
    public List<Order> getAllOrders() {
        return orders;
    }
    
    @GetMapping("/{id}")
    public Order getOrderById(@PathVariable Long id) {
        Order order = orders.stream()
                .filter(o -> o.getId().equals(id))
                .findFirst()
                .orElse(null);
        
        if (order != null) {
            // 通过 Dubbo 调用用户服务，获取用户信息
            User user = userService.getUserById(order.getUserId());
            // 注意：Order 模型中没有 user 字段，这里只是示例
            // 实际项目中可以添加 user 字段或返回 DTO
        }
        
        return order;
    }
    
    @PostMapping
    public Order createOrder(@RequestBody Order order) {
        // 验证用户是否存在
        User user = userService.getUserById(order.getUserId());
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        
        order.setId((long) (orders.size() + 1));
        order.setStatus("待支付");
        orders.add(order);
        return order;
    }
}
```

**说明**：
- `@DubboService`：标记服务提供者，会被注册到注册中心，供其他服务通过 RPC 调用
- `@DubboReference`：引用远程服务，Dubbo 会自动从 Nacos 查找服务
- 调用 `userService.getUserById()` 就像调用本地方法一样，但实际是 RPC 调用
- 性能比 HTTP 调用更高，因为使用二进制协议（Dubbo Protocol）

**共享 API 模块的作用**：
- **api-common**：包含服务间共享的模型类（如 `User`）和服务接口（如 `UserService`）
- **user-service** 和 **order-service** 都依赖 `api-common`，使用共享的类和接口
- 这样避免了服务间直接引用，符合微服务架构的最佳实践

**架构说明**：
- **api-common**：共享模块，包含 `User` 模型和 `UserService` 接口
- **user-service**：同时提供 REST API（供前端/网关调用）和 Dubbo 服务（供其他后端服务调用）
- **order-service**：通过 Dubbo 调用 user-service，同时提供 REST API（供前端/网关调用）
- **api-gateway**：通过 HTTP 调用各个服务的 REST API

**调用链路**：
```
前端 → API Gateway (HTTP) → user-service REST API
前端 → API Gateway (HTTP) → order-service REST API
order-service → user-service (Dubbo RPC)
```

**项目结构**：
```
services/
├── api-common/          # 共享 API 模块
│   └── src/main/java/com/example/api/
│       ├── model/       # 共享模型类
│       │   └── User.java
│       └── service/     # 共享服务接口
│           └── UserService.java
├── user-service/        # 用户服务
├── order-service/       # 订单服务
└── api-gateway/         # API 网关
```

---

## 七、数据库集成

### 7.1 添加 MySQL 支持

#### 在 `pom.xml` 添加依赖

```xml
<!-- Spring Data JPA -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<!-- MySQL 驱动 -->
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
</dependency>
```

#### 配置数据库连接

修改 `application.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/user_db?useSSL=false&serverTimezone=UTC&characterEncoding=utf8
    username: root
    password: your_password  # 修改为你的 MySQL 密码
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update  # 自动创建/更新表结构
    show-sql: true  # 显示 SQL 语句
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQLDialect
```

#### 创建实体类

```java
package com.example.user.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    private String phone;
}
```

#### 创建 Repository

```java
package com.example.user.repository;

import com.example.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // JpaRepository 已经提供了基本的 CRUD 方法
    // 可以添加自定义查询方法
    User findByEmail(String email);
}
```

#### 修改 Controller 使用数据库

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserRepository userRepository;  // 注入 Repository
    
    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();  // 从数据库查询
    }
    
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userRepository.findById(id).orElse(null);
    }
    
    @PostMapping
    public User createUser(@RequestBody User user) {
        return userRepository.save(user);  // 保存到数据库
    }
    
    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User user) {
        user.setId(id);
        return userRepository.save(user);
    }
    
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
    }
}
```

---

## 八、运行和测试

### 8.1 启动顺序

1. **启动 Nacos**
   ```bash
   docker run -d -p 8848:8848 -p 9848:9848 --name nacos \
     -e MODE=standalone \
     -e PREFER_HOST_MODE=hostname \
     nacos/nacos-server:v2.3.0
   ```

2. **启动用户服务**
   ```bash
   cd user-service
   mvn spring-boot:run
   ```
   等待看到 "Started UserServiceApplication" 消息

3. **启动订单服务**
   ```bash
   cd order-service
   mvn spring-boot:run
   ```

4. **启动 API 网关**
   ```bash
   cd api-gateway
   mvn spring-boot:run
   ```

### 8.2 测试 API

#### 测试用户服务（直接访问）

```bash
# 获取所有用户
curl http://localhost:8001/api/users

# 获取指定用户
curl http://localhost:8001/api/users/1

# 创建用户
curl -X POST http://localhost:8001/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"王五","email":"wangwu@example.com","phone":"13700137000"}'
```

#### 测试 API 网关

```bash
# 通过网关访问用户服务
curl http://localhost:8080/api/users

# 通过网关获取指定用户
curl http://localhost:8080/api/users/1
```

#### 测试服务间调用

```bash
# 创建订单（订单服务会调用用户服务）
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"productName":"商品A","price":99.99}'
```

### 8.3 查看服务注册情况

访问 Nacos 控制台：http://localhost:8848/nacos

登录后（用户名：`nacos`，密码：`nacos`），进入 "服务管理" → "服务列表"，应该能看到：
- `user-service`
- `order-service`
- `api-gateway`

点击服务名可以查看服务的详细信息，包括：
- 服务实例列表
- 实例的 IP 地址和端口
- 实例的健康状态
- 实例的元数据信息

---

## 九、Docker 部署

### 9.1 为每个服务创建 Dockerfile

#### user-service/Dockerfile

```dockerfile
# 使用多阶段构建
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY user-service/pom.xml ./user-service/
COPY user-service/src ./user-service/src
RUN mvn clean package -DskipTests

FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/user-service/target/user-service-*.jar app.jar
EXPOSE 8001
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 9.2 创建 docker-compose.yml

在项目根目录创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  # Nacos 服务注册中心
  nacos:
    image: nacos/nacos-server:v2.3.0
    container_name: nacos
    ports:
      - "8848:8848"
      - "9848:9848"
    environment:
      - MODE=standalone
      - PREFER_HOST_MODE=hostname
    networks:
      - microservices-network

  # MySQL 数据库
  mysql:
    image: mysql:8.0
    container_name: mysql
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: user_db
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - microservices-network

  # 用户服务
  user-service:
    build:
      context: .
      dockerfile: user-service/Dockerfile
    container_name: user-service
    ports:
      - "8001:8001"
    environment:
      - SPRING_CLOUD_NACOS_DISCOVERY_SERVER_ADDR=nacos:8848
      - SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/user_db
      - SPRING_DATASOURCE_USERNAME=root
      - SPRING_DATASOURCE_PASSWORD=root123
    depends_on:
      - nacos
      - mysql
    networks:
      - microservices-network

  # 订单服务
  order-service:
    build:
      context: .
      dockerfile: order-service/Dockerfile
    container_name: order-service
    ports:
      - "8002:8002"
    environment:
      - SPRING_CLOUD_NACOS_DISCOVERY_SERVER_ADDR=nacos:8848
    depends_on:
      - nacos
      - user-service
    networks:
      - microservices-network

  # API 网关
  api-gateway:
    build:
      context: .
      dockerfile: api-gateway/Dockerfile
    container_name: api-gateway
    ports:
      - "8080:8080"
    environment:
      - SPRING_CLOUD_NACOS_DISCOVERY_SERVER_ADDR=nacos:8848
    depends_on:
      - nacos
      - user-service
      - order-service
    networks:
      - microservices-network

networks:
  microservices-network:
    driver: bridge

volumes:
  mysql-data:
```

### 9.3 构建和启动

```bash
# 构建所有镜像
docker-compose build

# 启动所有服务
docker-compose up -d

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f user-service

# 停止所有服务
docker-compose down
```

---

## 十、学习路径建议

### 第一阶段：基础（1-2周）

1. ✅ 安装开发环境（JDK、Maven、IDE）
2. ✅ 创建第一个 Spring Boot 项目
3. ✅ 理解 REST API 概念
4. ✅ 学习 Spring Boot 基础注解
5. ✅ 理解 Maven 项目结构

**目标**：能够独立创建和运行 Spring Boot 项目

### 第二阶段：微服务基础（2-3周）

1. ✅ 创建多个独立的服务
2. ✅ 理解服务注册与发现
3. ✅ 配置和使用 API 网关
4. ✅ 实现服务间通信（Dubbo）
5. ✅ 理解微服务架构的优势和挑战

**目标**：能够搭建简单的微服务架构

### 第三阶段：进阶（3-4周）

1. 数据库集成（MySQL、JPA）
2. 消息队列（RabbitMQ/Kafka）
3. 配置中心（Nacos Config）
4. 分布式事务（Seata）
5. 监控和日志（Prometheus、ELK）

**目标**：掌握微服务架构的核心组件

### 第四阶段：生产就绪（2-3周）

1. 安全认证（JWT、OAuth2）
2. 性能优化（缓存、数据库优化）
3. 容器化部署（Docker、Kubernetes）
4. CI/CD 流程
5. 故障排查和监控

**目标**：能够部署和维护生产环境的微服务系统

---

## 十一、常见问题解决

### 问题1：端口被占用

**错误信息**：`Port 8080 is already in use`

**解决方法**：
```bash
# Windows 查看端口占用
netstat -ano | findstr :8080

# 结束进程
taskkill /PID <进程ID> /F

# 或者修改 application.yml 中的端口
server:
  port: 8081
```

### 问题2：Maven 下载依赖慢

**解决方法**：配置阿里云镜像（见环境准备部分）

### 问题3：服务无法注册到 Nacos

**可能原因**：
- Nacos 没有启动
- 配置文件中的 Nacos 地址错误
- 网络连接问题

**解决方法**：
1. 检查 Nacos 是否运行：`docker ps` 或访问 http://localhost:8848/nacos
2. 检查配置文件中的 `spring.cloud.nacos.discovery.server-addr`
3. 查看服务启动日志，查找错误信息

### 问题4：服务间调用失败

**可能原因**：
- 服务没有注册到 Nacos
- 服务名称不匹配
- 网络问题

**解决方法**：
1. 在 Nacos 控制台中确认服务已注册
2. 检查 Dubbo 服务接口和实现类是否正确
3. 检查 `@DubboService` 和 `@DubboReference` 注解是否正确
4. 查看服务启动日志，确认 Dubbo 服务是否成功注册

### 问题5：数据库连接失败

**可能原因**：
- MySQL 没有启动
- 用户名或密码错误
- 数据库不存在

**解决方法**：
1. 启动 MySQL：`docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root123 mysql:8.0`
2. 创建数据库：`CREATE DATABASE user_db;`
3. 检查配置文件中的数据库连接信息

### 问题6：Lombok 不生效

**解决方法**：
1. 在 IDE 中安装 Lombok 插件
2. 启用注解处理：File → Settings → Build → Compiler → Annotation Processors → Enable annotation processing
3. 重启 IDE

### 问题7：Docker 连接错误

**错误信息**：`docker: error during connect: Head "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/_ping": open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`

**原因**：Docker Desktop 没有运行

**解决方法**：
1. **启动 Docker Desktop**
   - 在 Windows 开始菜单搜索 "Docker Desktop"
   - 点击启动 Docker Desktop
   - 等待 Docker Desktop 完全启动（系统托盘图标不再闪烁）

2. **验证 Docker 运行状态**
   ```bash
   docker ps
   ```
   如果显示容器列表（即使为空），说明 Docker 已正常运行

3. **如果 Docker Desktop 无法启动**
   - 检查是否已安装 Docker Desktop
   - 尝试以管理员身份运行
   - 重启电脑后再试

### 问题8：Docker 镜像找不到

**错误信息**：`manifest for nacos/nacos-server:latest not found: manifest unknown`

**原因**：Docker Hub 上可能没有 `latest` 标签，或网络问题导致无法拉取镜像

**解决方法**：

**方法一：使用具体版本号（推荐）**
```bash
# 使用具体版本号
docker run -d -p 8848:8848 -p 9848:9848 --name nacos \
  -e MODE=standalone \
  -e PREFER_HOST_MODE=hostname \
  nacos/nacos-server:v2.3.0
```

**方法二：先手动拉取镜像**
```bash
# 拉取 Nacos 镜像
docker pull nacos/nacos-server:v2.3.0

# 然后再运行容器
docker run -d -p 8848:8848 -p 9848:9848 --name nacos \
  -e MODE=standalone \
  -e PREFER_HOST_MODE=hostname \
  nacos/nacos-server:v2.3.0
```

**方法三：查看可用版本**
```bash
# 访问 Docker Hub 查看可用版本
# https://hub.docker.com/r/nacos/nacos-server/tags

# 或使用命令行查看（需要安装额外工具）
```

**方法四：配置 Docker 镜像加速器（如果网络慢）**
1. 打开 Docker Desktop
2. Settings → Docker Engine
3. 添加镜像加速器配置：
   ```json
   {
     "registry-mirrors": [
       "https://docker.mirrors.ustc.edu.cn",
       "https://hub-mirror.c.163.com"
     ]
   }
   ```
4. 点击 "Apply & Restart"

---

## 十二、推荐学习资源

### 官方文档

1. **Spring Boot 官方文档**
   - 网址：https://spring.io/projects/spring-boot
   - 内容：完整的 Spring Boot 文档和指南

2. **Spring Cloud 官方文档**
   - 网址：https://spring.io/projects/spring-cloud
   - 内容：微服务相关组件文档

3. **Maven 官方文档**
   - 网址：https://maven.apache.org/guides/
   - 内容：Maven 使用指南

### 视频教程

1. **B站搜索关键词**
   - "Spring Boot 入门"
   - "Spring Cloud 微服务"
   - "Java 微服务实战"

2. **慕课网**
   - 搜索 Spring Boot 相关课程

### 实践项目

1. **GitHub 开源项目**
   - 搜索 "spring-cloud-microservices"
   - 搜索 "microservices-demo"
   - 参考优秀的开源项目学习

2. **Spring 官方示例**
   - https://github.com/spring-cloud-samples

### 书籍推荐

1. **《Spring Boot 实战》**
2. **《Spring Cloud 微服务实战》**
3. **《微服务架构设计模式》**

---

## 总结

本指南从零开始，带你完成了：

1. ✅ **环境搭建**：JDK、Maven、IDE、Docker
2. ✅ **Spring Boot 基础**：创建第一个 REST API
3. ✅ **微服务架构**：多服务、服务注册、API 网关
4. ✅ **服务通信**：使用 Dubbo 进行 RPC 服务调用
5. ✅ **数据库集成**：MySQL + JPA
6. ✅ **容器化部署**：Docker + Docker Compose

### 下一步行动

1. **立即开始**：按照步骤一安装环境
2. **动手实践**：每完成一步，测试验证
3. **遇到问题**：查看日志，搜索解决方案
4. **持续学习**：阅读文档，实践项目
5. **扩展功能**：添加更多服务，实现更复杂的业务逻辑

### 记住

- **实践是最好的老师**：不要只看不练，动手操作才能真正掌握
- **遇到问题很正常**：每个开发者都会遇到问题，学会解决问题是成长的关键
- **循序渐进**：不要急于求成，扎实掌握每个知识点
- **保持耐心**：学习新技术需要时间，坚持下去就会看到成果

祝你学习顺利！🚀
