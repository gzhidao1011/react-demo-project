# 微服务日志系统完整学习路径

> 从零开始掌握符合国际标准的微服务日志系统 - 完整学习指南

---

## 📚 文档导航

你现在正在学习一个**企业级微服务日志系统**，以下是各个文档的用途：

| 文档 | 用途 | 适合人群 |
|------|------|---------|
| [LOG_USAGE_GUIDE.md](./LOG_USAGE_GUIDE.md) | 深度讲解如何在代码中使用日志 | 开发工程师 |
| [KIBANA_QUICK_REFERENCE.md](./KIBANA_QUICK_REFERENCE.md) | Kibana操作速查表 | 所有人 |
| [DistributedTracingExample.java](./logging/DistributedTracingExample.java) | 分布式追踪代码实现 | 开发工程师 |
| [LOG_BEST_PRACTICES_INTERNATIONAL_STANDARDS.md](./LOG_BEST_PRACTICES_INTERNATIONAL_STANDARDS.md) | 国际标准最佳实践 | 架构师、高级工程师 |
| 本文档 | 学习路径 + 快速参考 | 所有人 |

---

## 🚀 快速开始（5分钟）

### Step 1: 验证系统运行
```bash
# 检查ELK Stack
docker-compose ps | grep -E "elasticsearch|kibana|logstash"

# 预期：都应该显示 "Up"
```

### Step 2: 查看日志
```
浏览器访问: http://localhost:5601
→ Discover
→ 选择 "logs" data view
→ 看实时日志
```

### Step 3: 执行查询
```
在Kibana中输入查询:
service: "chat-service" AND level: ERROR
→ 看错误日志
```

---

## 🎯 7天学习计划

### 第1天：理解日志的价值（1小时）

**核心概念：**
```
日志 = 计算机的黑匣子

飞机失事调查：
"飞行数据记录仪" 记录了所有操作参数
    ↓
分析人员根据记录找到失事原因
    ↓
改进飞行程序防止再次发生

同理：
应用日志 用于记录所有关键操作
    ↓
DevOps/SRE根据日志定位问题
    ↓
修复代码或调整资源配置
```

**学习目标：**
- ✓ 理解为什么需要日志
- ✓ 知道日志级别的区别 (INFO/WARN/ERROR)
- ✓ 明白日志可以用来做什么

**参考资源：**
- 阅读: LOG_USAGE_GUIDE.md 的 "核心概念" 部分

---

### 第2天：学会在代码中写日志（2小时）

**实际任务：**
1. 打开 `chat-service/ChatController.java`
2. 看代码中已有的 `log.info()` 和 `log.error()` 调用
3. 理解每个日志的作用：
   - 何时输出？
   - 输出了什么信息？
   - 用了什么日志级别？

**编码练习：**
```java
// 任务1: 在某个方法前后加日志
@PostMapping("/send")
public void sendMessage(@RequestBody MessageRequest req) {
    log.info("Received message request");         // ← 加这行
    
    // ... 业务逻辑 ...
    
    log.info("Message sent successfully");         // ← 加这行
}

// 任务2: 添加出错时的日志
try {
    // 业务代码
} catch (Exception e) {
    log.error("Failed to process message", e);    // ← 加这行
}
```

**学习目标：**
- ✓ 知道何时输出日志
- ✓ 知道输出什么信息
- ✓ 掌握 `log.info()`, `log.warn()`, `log.error()` 的用法

**参考资源：**
- 阅读: LOG_USAGE_GUIDE.md 的 "代码实践" 部分
- 参考: DistributedTracingExample.java

---

### 第3天：掌握Kibana基础操作（1.5小时）

**界面熟悉：**
```
访问: http://localhost:5601
→ 左侧菜单
  ├─ Discover (查看日志)
  ├─ Visualize (画图)
  ├─ Dashboard (看仪表板)
  └─ Stack Management (管理)
```

**实战任务：**

1. **查看日志**
   - 打开 Discover
   - 选择 "logs" data view
   - 看最近的日志条目
   - 点击任一条展开，看JSON结构

2. **基础查询**
   ```
   Query1: service: "chat-service"
   → 只看chat-service的日志
   
   Query2: level: ERROR
   → 只看错误级别的日志
   
   Query3: service: "chat-service" AND level: ERROR
   → 看chat-service的所有错误
   ```

3. **时间过滤**
   - 右上角调整时间范围
   - 观察日志如何变化

**学习目标：**
- ✓ 能打开Kibana并查看日志
- ✓ 能编写基础查询
- ✓ 能按时间、服务、级别过滤

**参考资源：**
- 阅读: KIBANA_QUICK_REFERENCE.md 的前2部分

---

### 第4天：创建可视化（2小时）

**任务1: 创建Line Chart（折线图）**
```
目标：看日志数量随时间的变化

步骤：
1. Kibana → Visualize → Create
2. 选择 Lens
3. 选择 Line 图表
4. X轴: @timestamp (时间)
5. Y轴: Count (日志数)
6. 分组: service (按服务)
7. 保存
```

**任务2: 创建Bar Chart（条形图）**
```
目标：比较不同服务的响应时间

配置：
X轴: Terms on service
Y轴: Average on performance.duration_ms
```

**任务3: 创建你的第一个Dashboard**
```
1. Dashboards → Create
2. 添加刚创建的两个可视化
3. 调整大小和位置
4. 保存
```

**学习目标：**
- ✓ 会创建基本可视化
- ✓ 会创建Dashboard
- ✓ 理解不同图表的用途

**参考资源：**
- 阅读: KIBANA_QUICK_REFERENCE.md 的 "创建Dashboard" 部分

---

### 第5天：掌握advanced查询（2小时）

**深层查询实战：**

1. **用户追踪**
   ```
   查询: userId: "user-12345" AND @timestamp >= now-24h
   
   看这个用户24小时内做了什么
   ```

2. **性能分析**
   ```
   查询: performance.duration_ms > 1000 AND @timestamp >= now-1h
   
   看最近1小时哪些操作慢了
   ```

3. **错误追踪**
   ```
   查询: level: ERROR AND service: "order-service"
   聚合: Terms on error.code → Count
   
   看order-service最常见的错误是什么
   ```

4. **缓存分析**
   ```
   查询: performance.cache_hits exists
   聚合: Sum(cache_hits) / (Sum(cache_hits) + Sum(cache_misses))
   
   计算缓存命中率
   ```

**学习目标：**
- ✓ 掌握KQL查询语法
- ✓ 会做聚合分析
- ✓ 能独立进行性能分析

**参考资源：**
- 阅读: KIBANA_QUICK_REFERENCE.md 的 "查询语法" 部分
- 阅读: LOG_USAGE_GUIDE.md 的 "故障排查场景"

---

### 第6天：实战故障排查（2小时）

**模拟场景1: 用户投诉发送消息慢**

```
流程：
1. 从用户那里获取 requestId (或从浏览器network中看)
2. 在Kibana查询这个requestId
3. 看所有相关的日志，按时间排序
4. 发现哪个服务慢了
5. 继续深入分析那个服务

时间: 应该在5分钟内定位问题
```

**模拟场景2: 系统错误率突增**

```
流程：
1. 创建一个Dashboard，显示最近1小时的错误率趋势
2. 看到错误率在某个时间点开始增加
3. 在那个时间点前后查询，找ERROR或WARN日志
4. 看日志找原因（可能是：代码部署了、流量激增了、外部依赖崩溃了）
5. 提出解决方案
```

**学习目标：**
- ✓ 会独立进行故障排查
- ✓ 知道从哪里找线索
- ✓ 能快速定位问题

**参考资源：**
- 阅读: LOG_USAGE_GUIDE.md 的 "故障排查场景"

---

### 第7天：分布式追踪深入（2小时）

**理论学习：**
```
分布式追踪 = 跟踪一个用户请求如何在多个微服务间流转

例：
用户 → API Gateway → Auth Service → Chat Service → Order Service → 返回用户

如果没有追踪机制：
每个服务记录自己的日志，看不出关联
问题: 中间哪个服务出错了？

有了追踪机制：
所有相关日志都有同一个 traceId
一个查询就能看完整链路
```

**实践：**
1. 打开 `DistributedTracingExample.java`
2. 理解 MDC (Mapped Diagnostic Context) 的概念
3. 理解 Filter 如何初始化 traceId
4. 理解服务间调用如何传递 traceId
5. 在Kibana用 traceId 查询，看完整链路

**代码修改（可选）：**
```java
// 如果还没有实现, 可以copy示例代码到你的服务
// 参考: DistributedTracingExample.java 中的 
// DistributedTracingFilter 和相关代码
```

**学习目标：**
- ✓ 理解分布式追踪的原理
- ✓ 知道traceId是什么
- ✓ 能用traceId追踪跨服务请求

**参考资源：**
- 代码: DistributedTracingExample.java
- 文档: LOG_USAGE_GUIDE.md 的 "分布式追踪" 部分

---

## 📖 主题学习指南

### 如果你想学...

#### 学"如何在代码里写日志"
→ 读 [LOG_USAGE_GUIDE.md](./LOG_USAGE_GUIDE.md) 的 "代码实践" 部分
→ 参考 [DistributedTracingExample.java](./logging/DistributedTracingExample.java) 的ChatService类

#### 学"Kibana怎么用"
→ 先读 [KIBANA_QUICK_REFERENCE.md](./KIBANA_QUICK_REFERENCE.md) 的快速开始
→ 然后在Kibana里实际操作
→ 需要深入理解时，读[LOG_USAGE_GUIDE.md](./LOG_USAGE_GUIDE.md) 的 "Kibana查询" 部分

#### 学"故障排查"
→ 读 [LOG_USAGE_GUIDE.md](./LOG_USAGE_GUIDE.md) 的 "故障排查场景"
→ 跟着步骤实际操作一遍

#### 学"分布式追踪"
→ 读 [LOG_USAGE_GUIDE.md](./LOG_USAGE_GUIDE.md) 的 "分布式追踪" 部分
→ 参考 [DistributedTracingExample.java](./logging/DistributedTracingExample.java)
→ 理解 traceId/spanId 的生成和传递

#### 学"国际标准最佳实践"
→ 读 [LOG_BEST_PRACTICES_INTERNATIONAL_STANDARDS.md](./LOG_BEST_PRACTICES_INTERNATIONAL_STANDARDS.md)
→ 这是整个系统的理论基础

---

## 🎬 实践项目

### 项目1: "用户反馈功能经常出错，找出原因"

**要求：**
1. 访问Kibana
2. 查询最近24小时的所有ERROR日志
3. 统计各服务的错误数
4. 找出错误最多的服务
5. 找出最常见的错误现象 (通过error_code)
6. 写报告说明原因和建议

**预期时间：** 30分钟

**学到的技能：**
- 聚合分析
- 数据统计
- 问题分析

---

### 项目2: "系统P95响应时间从400ms增加到1200ms，找瓶颈"

**要求：**
1. 从Kibana看出性能下降的时间点
2. 在那个时间点前后对比日志
3. 找出哪个服务变慢了
4. 分析这个服务变慢的原因
   - 数据库变慢了？
   - 缓存命中率下降了？
   - API调用变多了？
5. 提出优化方案

**预期时间：** 1小时

**学到的技能：**
- 性能分析
- 指标对比
- 问题诊断

---

### 项目3: "实现一个新功能的日志记录"

**要求：**
1. 在chat-service中添加一个新API
2. 在API中写日志，遵循：
   - 请求入口输出INFO
   - 重要步骤输出DEBUG
   - 错误输出ERROR
   - 性能问题输出WARN
3. 测试API，在Kibana验证日志
4. 用traceId追踪完整请求链

**预期时间：** 2小时

**学到的技能：**
- 日志规范
- MDC使用
- 分布式追踪

---

## 💡 常见问题速查表

| 问题 | 答案 | 参考 |
|------|------|------|
| 为什么需要日志？ | 快速定位问题、数据驱动决策 | LOG_USAGE_GUIDE.md 核心原则 |
| 什么时候用INFO，什么时候用ERROR？ | INFO是正常情况，ERROR是故障 | LOG_USAGE_GUIDE.md 日志级别规范 |
| 怎么查找单个请求的所有日志？ | 用requestId或traceId查询 | KIBANA_QUICK_REFERENCE.md |
| traceId是什么？ | 一条请求在多个服务间的唯一标识 | LOG_USAGE_GUIDE.md 分布式追踪 |
| 如何传递traceId给下游服务？ | 在HTTP Header中传递 | DistributedTracingExample.java |
| 日志太多导致磁盘满了怎么办？ | 日志会自动轮转和删除 | logback-spring.xml配置 |
| 敏感信息（密码）怎么防护？ | 输出前用掩码函数处理 | LOG_USAGE_GUIDE.md 安全章节 |

---

## 📊 能力评估

### 初级（完成第3天）
- [ ] 能查看和理解日志
- [ ] 能用基础查询过滤日志
- [ ] 知道日志级别的区别

### 中级（完成第5天）
- [ ] 能在代码中正确输出日志
- [ ] 能创建Dashboard和可视化
- [ ] 会advanced查询和聚合

### 高级（完成第7天）
- [ ] 能独立进行故障排查
- [ ] 理解和使用分布式追踪
- [ ] 能基于日志做性能优化

### 专家（完成所有项目）
- [ ] 能设计日志系统架构
- [ ] 能定义公司的日志规范
- [ ] 能培训其他工程师

---

## 🎓 理论基础

### Google SRE Book中的4个黄金信号

任何系统监控都应该关注这4个指标：

```
1. Latency (延迟)
   - P50, P95, P99都要监控
   - SLA应该基于P95制定
   
2. Traffic (流量)  
   - 每秒请求数（RPS）
   - 字节率（Bytes/sec）
   
3. Errors (错误率)
   - 4xx错误（客户端）
   - 5xx错误（服务器）
   
4. Saturation (饱和度)
   - CPU/内存/磁盘使用率
   - 数据库连接池使用率
```

所有日志都应该为这4个信号服务！

---

## 🏆 最终目标

完成本学习路径后，你应该能够：

```
✓ 1. 快速定位生产问题（5分钟内）
✓ 2. 进行性能分析和优化
✓ 3. 设计微服务的日志策略
✓ 4. 为团队的可观测性做出贡献
✓ 5. 在故障应急时冷静地用数据做决策
```

---

## 📞 获取帮助

- **官方文档**: https://www.elastic.co/guide/en/kibana/current/
- **本项目文档**: 查看 [LOG_BEST_PRACTICES_INTERNATIONAL_STANDARDS.md](./LOG_BEST_PRACTICES_INTERNATIONAL_STANDARDS.md)
- **代码参考**: 查看 [DistributedTracingExample.java](./logging/DistributedTracingExample.java)
- **快速查询**: 使用 [KIBANA_QUICK_REFERENCE.md](./KIBANA_QUICK_REFERENCE.md)

---

## 🎉 总结

```
Day 1: 明白为什么要有日志
Day 2: 学会写日志
Day 3: 学会看日志
Day 4: 学会画图表
Day 5: 学会深度查询
Day 6: 学会排查故障
Day 7: 学会追踪请求

最终：从日志数据做出工程决策！
```

现在，打开Kibana，开始探索吧！🚀

