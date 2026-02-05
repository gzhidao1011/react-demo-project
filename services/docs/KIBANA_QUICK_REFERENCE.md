# Kibana操作快速参考卡

> 从零到精通 Kibana - 5分钟快速指南

---

## 🎯 开始使用

### Step 1: 访问Kibana
```
打开浏览器: http://localhost:5601
无需登录（开发环境）
```

### Step 2: 创建Data View（如果还没有）
```
1. 点击左侧 "Stack Management" → "Data Views"
2. 点击 "Create data view"
3. 名称: logs
4. Index Pattern: logs-*
5. Timestamp field: @timestamp
6. 点击 "Save"
```

### Step 3: 进入Discover查看日志
```
1. 左侧菜单 → Discover
2. 选择 data view: "logs"
3. 右上角设置时间范围（default: 最后15分钟）
4. 看到日志列表，点击任一条日志展开详情
```

---

## 📖 Kibana界面说明

```
┌─────────────────────────────────────────────────────────┐
│                    Kibana Web 界面                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  左侧菜单                    主区域                   右侧栏 │
│  ├─ Discover    ←─────┐                                 │
│  ├─ Visualize   日志列表    │┐ 时间选择器          可视化工具│
│  ├─ Dashboard   ├─────┤│                              │
│  ├─ Stack Mgmt. │详情 ││ 字段列表                      设置 │
│  └─ ...         └─────┘│                                │
│                          │ 日志内容区域                   │
│                          └────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 查询语法（KQL）

### 基础查询

| 查询 | 说明 | 例子 |
|------|------|------|
| `字段: 值` | 精确匹配 | `level: ERROR` |
| `字段: *值*` | 模糊匹配 | `message: *timeout*` |
| `字段 >= 数字` | 范围查询 | `duration_ms >= 1000` |
| `字段 exists` | 字段存在 | `error_code exists` |
| `字段1 AND 字段2` | 且 | `service: "chat-service" AND level: ERROR` |
| `字段1 OR 字段2` | 或 | `level: (ERROR OR FATAL)` |
| `NOT 字段` | 排除 | `NOT error_code: "USER_NOT_FOUND"` |

### 实战查询

#### 查询1: 找出特定用户的所有操作
```
userId: "user-12345"
```

#### 查询2: 找出最近1小时的所有错误
```
level: (ERROR OR FATAL) AND @timestamp >= now-1h
```

#### 查询3: 找出响应时间超过500ms的请求
```
performance.duration_ms > 500
```

#### 查询4: 找出特定服务的某类错误
```
service: "order-service" AND error.code: "DB_ERROR"
```

#### 查询5: 找出缓存未命中的操作
```
performance.cache_hits: 0
```

#### 查询6: 追踪单个请求
```
requestId: "req-123-abc-def"
```

---

## 📊 常用操作

### 操作1: 看到日志后怎么理解？

```
日志条目示例：
┌─────────────────────────────────────────┐
│ @timestamp      2024-02-05 14:30:45.123 │  ← 何时发生
│ level           INFO                    │  ← 严重性
│ service         chat-service            │  ← 来源服务
│ message         Message sent success..  │  ← 发生了什么
│ userId          user-12345              │  ← 谁的操作
│ duration_ms     245                     │  ← 耗时多长
│ error_code      -                       │  ← 是否有错误
└─────────────────────────────────────────┘

快速判断：
✓ level = INFO → 正常操作，不用担心
⚠️ level = WARN → 有异常但已处理，需要关注
❌ level = ERROR → 出错了，需要查原因
🔴 level = FATAL → 系统崩了！

时间信息：
Duration_ms = 245 → 这个操作花了245毫秒
- < 100ms: 很快 ✓
- 100-500ms: 正常 ✓
- 500-1000ms: 稍慢 ⚠️
- > 1000ms: 太慢 ❌
```

### 操作2: 查看日志的具体内容

```
在Discover中：
1. 看到一条日志时
2. 点击左边的 > 图标
3. 或点击日志所在行
4. 看到JSON格式的完整内容

JSON结构：
{
  "@timestamp": "2024-02-05T14:30:45.123Z",
  "level": "INFO",
  "message": "User message processed",
  "service": "chat-service",
  "userId": "user-12345",
  "performance": {
    "duration_ms": 245,
    "database_queries": 2
  }
}
```

### 操作3: 按字段过滤

```
Discover界面右侧是字段列表：

1. 找到感兴趣的字段（如 level）
2. 把鼠标悬停在字段名上
3. 点击 + 图标（勾选）→ 过滤显示这个值
4. 点击 - 图标（叉号）→ 排除这个值

例：
点击 level: ERROR 的 + 号
→ 只显示ERROR级别的日志
```

### 操作4: 查看时间范围的日志

```
右上角时间选择器：

默认显示：Last 15 minutes

快速选项：
• Last 15 minutes
• Last 1 hour
• Last 24 hours
• Last 7 days
• Last 30 days
• Custom range (自定义)

例：查看过去1小时的日志：
1. 点击时间选择器
2. 选 "Last 1 hour"
3. 点 Apply
```

---

## 📈 创建可视化

### 创建Line Chart（折线图）- 查看日志趋势

```
步骤：
1. 点击 "Visualize" → "Create visualization"
2. 选择 "Lens"
3. 选择 data view: "logs"
4. 选择 "Line" 图表
5. 配置：
   X轴: @timestamp (自动按时间分组)
   Y轴: Count (记录数)
   分组: service (按服务分组)
6. 点 "Save"

结果：
看到这些曲线随时间变化：
- api-gateway: 绿线
- chat-service: 蓝线
- order-service: 红线
```

### 创建Bar Chart（柱状图）- 比较服务性能

```
步骤：
1. Create Visualization → Lens
2. 选择 "Bar" 图表
3. 配置：
   X轴: Terms on service
   Y轴: Average on performance.duration_ms
4. 点 "Save"

结果：
看到各服务的平均响应时间柱子：
api-gateway: 50ms
chat-service: 250ms
order-service: 800ms (最慢！)
```

### 创建Pie Chart（饼图）- 看日志级别分布

```
步骤：
1. Create Visualization → Lens
2. 选择 "Pie" 图表
3. 配置：
   Slice size: Count
   Category: Terms on level
4. 点 "Save"

结果：
INFO: 95%（绿色）
WARN: 4%（黄色）
ERROR: 1%（红色）
```

---

## 🎨 创建Dashboard（仪表板）

### 集中显示多个可视化

```
步骤：
1. 点 "Dashboards"
2. 点 "Create dashboard"
3. 点 "Add"
4. 创建或添加已有的 Visualization
5. 调整大小和位置
6. 点 "Save dashboard"

建议的仪表板结构：
┌──────────────────┬──────────────────┐
│  请求数时序曲线  │  错误率时序曲线  │
├──────────────────┼──────────────────┤
│  按服务分类柱图  │  错误级别饼图    │
├──────────────────┴──────────────────┤
│        最后1小时的错误条目          │
└────────────────────────────────────┘
```

---

## 🚨 设置告警

### 创建错误率告警

```
步骤：
1. 创建一个 Visualization 用于监控错误
2. 在 Visualization 上点 "..."
3. 选 "Manage → Create new rule"
4. 配置：
   Name: "High Error Rate"
   Condition: Count of level: ERROR > 10 in last 5 minutes
   Action: Send email / Slack
5. 保存
```

---

## 💡 技巧和最佳实践

### 技巧1: 快速导出日志

```
在Discover中：
1. 点右上角 "..."
2. 选 "Export"
3. 选择格式: CSV 或 Saved search
4. 下载文件，用Excel打开
```

### 技巧2: 保存常用查询

```
找到好用的查询后：
1. Discover页面
2. 点左上角 "Save"
3. 给查询起个名字：如 "Chat Service Errors"
4. 下次可以直接加载
```

### 技巧3: 在日志中快速跳转

```
看到一条日志，想看相关的其他日志：

方式1: 按字段跳转
- 鼠标悬停字段值
- 点 + → 添加过滤
- 或点 - → 排除这个值

方式2: 打开Complete JSON
- 点日志展开
- JSON标签
- 看到所有字段
```

### 技巧4: 时间同步

```
多个Visualization同时看：
1. 创建Dashboard
2. 添加多个Visualization
3. 调整Dashboard时间 → 所有图表同时更新
4. 这样就能快速比较不同服务的行为
```

---

## ⚙️ 常见操作场景

### 场景1: "数据库怎么了？查一下性能"

```
步骤：
1. Discover中查询:
   service: ("order-service" OR "chat-service") AND 
   performance.database_duration_ms exists

2. 看字段列表中的 performance.database_duration_ms
3. 看平均值、最大值、最小值
4. 如果突然增大 → 数据库有问题
5. 继续查询:
   service: "order-service" AND 
   performance.database_duration_ms > 1000
   → 找出哪些操作慢了
```

### 场景2: "用户报错，我要查他的日志"

```
步骤：
1. 获取用户ID: user-12345
2. Discover查询:
   userId: "user-12345" AND @timestamp >= now-24h
3. 按时间排序，看所有操作
4. 找ERROR日志
5. 点击展开，看完整信息
6. 用requestId追踪跨服务的链路
```

### 场景3: "系统响应变慢了，查查原因"

```
步骤：
1. 创建折线图：
   X轴: @timestamp
   Y轴: Percentile(95) on performance.duration_ms
   分组: service

2. 看曲线跳跃：一般在哪个时间点开始变慢

3. 放大那个时间点，查询:
   @timestamp >= now-10m AND 
   level: (ERROR OR WARN)
   → 看有没有错误或告警

4. 检查资源：
   Query: "cpu_percent" OR "memory_percent" exists
   → 看服务器资源使用情况

5. 定位原因后修复
```

---

## 🎓 学习路径

```
初级目标（第一天）：
□ 能访问Kibana
□ 能查看日志
□ 能用基础查询

中级目标（第一周）：
□ 掌握KQL查询语法
□ 能对日志进行过滤和排序
□ 能创建简单的Visualization

高级目标（第一个月）：
□ 能创建Dashboard
□ 能设置告警规则
□ 会分析性能问题并找到优化方案
```

---

## 🆘 故障排查

### 问题: Kibana页面加载很慢

```
解决方案：
1. 查询时间范围太大
   → 缩小到 "Last 1 hour"
2. 查询条件太宽松
   → 加上service: "具体服务名"
3. 浏览器缓存问题
   → Ctrl+Shift+Del清除缓存
```

### 问题: 找不到我的日志

```
排查步骤：
1. 检查time range（是否选了"Last 15 minutes"但日志是10分钟前）
2. 检查data view（是否选了正确的"logs"）
3. 检查query（是否查询条件太严格）
4. 检查微服务是否真的输出了日志
   → 登录容器: docker exec -it chat-service bash
   → 看日志文件: ls logs/
```

---

## 📚 帮助资源

- 官方文档: https://www.elastic.co/guide/en/kibana/current/index.html
- KQL语法: https://www.elastic.co/guide/en/kibana/current/kuery-query.html
- 本项目文档: LOG_USAGE_GUIDE.md

---

**快速记忆口诀：**
```
"发查找 → Discover
想可视化 → Visualize
建仪表板 → Dashboard
设告警规 → Management"
```

