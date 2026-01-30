# Vercel AI SDK 使用指南

本文档基于 [AI SDK 官方文档](https://ai-sdk.dev/docs/introduction) 整理，提供官方推荐的完整使用指南，适用于 React、Next.js、Node.js、React Router 等框架。

## 一、概述

AI SDK 是 Vercel 推出的 TypeScript 工具包，用于构建 AI 应用和 Agent，支持：

- **AI SDK Core**：文本生成、结构化数据、工具调用、Embeddings 等
- **AI SDK UI**：`useChat`、`useCompletion` 等 React Hooks，快速构建聊天和生成式 UI

### 核心特性

- 多模型提供商：OpenAI、Anthropic、Google、Mistral 等（另见 Cursor 说明）
- 流式输出：实时打字机效果
- 框架无关：React、Next.js、Vue、Svelte、Node.js、Expo、TanStack Start
- 工具调用：支持多步 Tool 调用
- 消息持久化：会话历史存储与恢复

---

## 二、安装

### 基础依赖

```bash
pnpm add ai @ai-sdk/react
```

### 模型提供商（按需安装）

```bash
# Vercel AI Gateway（默认，推荐）
# 无需额外安装，配置 AI_GATEWAY_API_KEY 即可

# OpenAI 直连
pnpm add @ai-sdk/openai

# Anthropic 直连
pnpm add @ai-sdk/anthropic

# Google 直连
pnpm add @ai-sdk/google
```

### 可选依赖

```bash
pnpm add zod          # 工具 Schema 定义
pnpm add dotenv       # 环境变量（Node.js）
```

---

## 三、模型提供商选择

### 3.1 Vercel AI Gateway（推荐）

统一入口，支持多模型，[获取 API Key](https://vercel.com/d?to=/[team]/~/ai/api-keys)。

```env
AI_GATEWAY_API_KEY=your_api_key_here
```

```typescript
import { generateText } from "ai"

const { text } = await generateText({
  model: "anthropic/claude-sonnet-4.5",
  prompt: "What is love?",
})
```

### 3.2 专用提供商

```typescript
import { anthropic } from "@ai-sdk/anthropic"

model: anthropic("claude-sonnet-4-5")
```

### 3.3 自定义提供商

参考 [Writing a Custom Provider](https://ai-sdk.dev/providers/community-providers/custom-providers)。

### 3.4 Cursor

[Cursor](https://cursor.com/) 是 AI 编程 IDE，提供 **Cursor API** 用于程序化调用 AI 能力。与标准聊天补全接口不同，Cursor 主要提供 **Cloud Agents API**，用于启动和管理代码生成 Agent。

#### Cursor API 概览

| API | 用途 | 适用场景 |
|-----|------|----------|
| **Cloud Agents API** | 启动、管理 AI 编程 Agent | 自动化代码生成、PR 创建、仓库操作 |
| **Admin API** | 团队管理、用量、计费 | 企业团队管理 |
| **Analytics API** | 使用分析、模型用量 | 数据分析与监控 |

#### 与 useChat 的差异

- **Cursor Cloud Agents API**：面向「任务型 Agent」（如「为仓库添加 README」），非流式对话接口
- **useChat + streamText**：面向「对话型 Chat」，支持流式输出、多轮对话

若需在 Web 应用中实现 **对话式 Chat UI**，应使用 Vercel AI Gateway、OpenAI、Anthropic 等标准提供商，而非 Cursor API。

#### 使用 Cursor 同款模型

Cursor IDE 底层使用 OpenAI、Anthropic、Google 等模型。若希望 Web 应用与 Cursor 使用相同模型，可配置对应提供商：

```typescript
// 与 Cursor 使用相同模型（如 Claude、GPT）
import { anthropic } from "@ai-sdk/anthropic"
import { openai } from "@ai-sdk/openai"

// Claude（Cursor 常用）
model: anthropic("claude-sonnet-4-5")

// GPT-4
model: openai("gpt-4")
```

#### Cursor API 认证

若需调用 Cursor Cloud Agents API（非 useChat 场景），在 [Cursor Dashboard](https://cursor.com/dashboard?tab=integrations) 创建 API Key：

```env
CURSOR_API_KEY=key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

```typescript
// 调用 Cursor Cloud Agents API 示例
const response = await fetch("https://api.cursor.com/v0/agents", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Basic ${btoa(`${process.env.CURSOR_API_KEY}:`)}`,
  },
  body: JSON.stringify({
    prompt: { text: "Add a README.md file" },
    source: { repository: "https://github.com/your-org/your-repo" },
  }),
})
```

参考：[Cursor API 文档](https://cursor.com/docs/api)、[Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints)。

---

## 四、useChat 基础用法

### 4.1 最小示例

```tsx
"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useState } from "react"

export default function ChatPage() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  })
  const [input, setInput] = useState("")

  return (
    <>
      {messages.map((message) => (
        <div key={message.id}>
          {message.role === "user" ? "User: " : "AI: "}
          {message.parts.map((part, index) =>
            part.type === "text" ? <span key={index}>{part.text}</span> : null,
          )}
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (input.trim()) {
            sendMessage({ text: input })
            setInput("")
          }
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== "ready"}
          placeholder="Say something..."
        />
        <button type="submit" disabled={status !== "ready"}>
          Submit
        </button>
      </form>
    </>
  )
}
```

### 4.2 重要说明（AI SDK 5.0+）

- **Transport 架构**：`useChat` 使用 `DefaultChatTransport` 或 `DirectChatTransport`，不再内置 `api` 字符串
- **输入状态**：`useChat` 不再管理 `input`，需用 `useState` 自行管理
- **消息渲染**：推荐使用 `message.parts` 而非 `message.content`，支持 text、tool-invocation、file 等多种类型

### 4.3 status 状态

| 值 | 含义 |
|----|------|
| `submitted` | 请求已发送，等待流开始 |
| `streaming` | 正在接收流式响应 |
| `ready` | 响应完成，可发送新消息 |
| `error` | 发生错误 |

### 4.4 停止与重试

```tsx
const { stop, regenerate, status } = useChat({ ... })

// 停止当前流
<button onClick={stop} disabled={!(status === "streaming" || status === "submitted")}>
  Stop
</button>

// 重新生成最后一条 AI 消息
<button onClick={() => regenerate()} disabled={!(status === "ready" || status === "error")}>
  Regenerate
</button>
```

---

## 五、后端 API 实现

### 5.1 Next.js App Router

```typescript
// app/api/chat/route.ts
import { convertToModelMessages, streamText, UIMessage } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: "anthropic/claude-sonnet-4.5",
    system: "You are a helpful assistant.",
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
```

### 5.2 React Router / 通用 HTTP 服务

需提供符合 AI SDK 流式协议的 POST 接口，例如通过 Vite 代理到后端：

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      "/api/chat": "http://localhost:3001/api/chat",
    },
  },
})
```

后端（Node.js + Express 示例）：

```typescript
import express from "express"
import { convertToModelMessages, streamText, UIMessage } from "ai"

const app = express()
app.use(express.json())

app.post("/api/chat", async (req, res) => {
  const { messages }: { messages: UIMessage[] } = req.body

  const result = streamText({
    model: "anthropic/claude-sonnet-4.5",
    messages: await convertToModelMessages(messages),
  })

  result.toUIMessageStreamResponse().then((response) => {
    res.setHeader("Content-Type", response.headers.get("Content-Type") ?? "")
    response.body?.pipeTo(
      new WritableStream({
        write(chunk) {
          res.write(chunk)
        },
        close() {
          res.end()
        },
      }),
    )
  })
})
```

---

## 六、Transport 配置

### 6.1 自定义 API 地址与 Headers

```tsx
const { messages, sendMessage } = useChat({
  transport: new DefaultChatTransport({
    api: "/api/custom-chat",
    headers: {
      Authorization: "Bearer your_token",
      "X-API-Version": "2024-01",
    },
    credentials: "include",
  }),
})
```

### 6.2 动态配置（Token 刷新）

```tsx
transport: new DefaultChatTransport({
  api: "/api/chat",
  headers: () => ({
    Authorization: `Bearer ${getAuthToken()}`,
    "X-User-ID": getCurrentUserId(),
  }),
  body: () => ({
    sessionId: getCurrentSessionId(),
  }),
  credentials: () => "include",
})
```

### 6.3 仅发送最后一条消息（持久化场景）

```tsx
transport: new DefaultChatTransport({
  api: "/api/chat",
  prepareSendMessagesRequest: ({ id, messages }) => ({
    body: {
      message: messages[messages.length - 1],
      id,
    },
  }),
})
```

服务端需从存储加载历史消息并拼接新消息。

### 6.4 DirectChatTransport（无 HTTP，直连 Agent）

适用于 SSR、测试、单进程应用：

```tsx
import { useChat } from "@ai-sdk/react"
import { DirectChatTransport, ToolLoopAgent } from "ai"

const agent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  instructions: "You are a helpful assistant.",
})

const { messages, sendMessage } = useChat({
  transport: new DirectChatTransport({ agent }),
})
```

---

## 七、消息持久化

### 7.1 流程概览

1. 新建会话：创建 chatId，重定向到 `/chat/:id`
2. 加载会话：根据 chatId 从存储加载 `UIMessage[]`
3. 存储消息：在 `toUIMessageStreamResponse` 的 `onFinish` 中保存

### 7.2 服务端存储

```typescript
// util/chat-store.ts
import { UIMessage } from "ai"
import { generateId } from "ai"
import { readFile, writeFile } from "fs/promises"
import path from "path"

export async function createChat(): Promise<string> {
  const id = generateId()
  await writeFile(getChatFile(id), "[]")
  return id
}

export async function loadChat(id: string): Promise<UIMessage[]> {
  return JSON.parse(await readFile(getChatFile(id), "utf8"))
}

export async function saveChat({
  chatId,
  messages,
}: {
  chatId: string
  messages: UIMessage[]
}): Promise<void> {
  await writeFile(getChatFile(chatId), JSON.stringify(messages, null, 2))
}

function getChatFile(id: string): string {
  return path.join(process.cwd(), ".chats", `${id}.json`)
}
```

### 7.3 API 路由中保存

```typescript
return result.toUIMessageStreamResponse({
  originalMessages: messages,
  onFinish: ({ messages }) => {
    saveChat({ chatId: id, messages })
  },
})
```

### 7.4 客户端加载初始消息

```tsx
const { messages, sendMessage } = useChat({
  id: chatId,
  messages: initialMessages,
  transport: new DefaultChatTransport({ api: "/api/chat" }),
})
```

### 7.5 服务端 ID 生成（持久化必备）

```typescript
import { createIdGenerator } from "ai"

return result.toUIMessageStreamResponse({
  generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
  onFinish: ({ messages }) => saveChat({ chatId, messages }),
})
```

---

## 八、错误处理

### 8.1 客户端

```tsx
const { error, regenerate, clearError } = useChat({ ... })

{error && (
  <>
    <div>An error occurred.</div>
    <button type="button" onClick={() => regenerate()}>
      Retry
    </button>
    <button type="button" onClick={clearError}>
      Dismiss
    </button>
  </>
)}
```

建议向用户展示通用错误文案（如 "Something went wrong."），避免泄露服务端细节。

### 8.2 服务端自定义错误消息

```typescript
return result.toUIMessageStreamResponse({
  onError: (error) => {
    if (error instanceof Error) return error.message
    if (typeof error === "string") return error
    return "unknown error"
  },
})
```

---

## 九、请求配置

### 9.1 请求级配置（推荐）

```tsx
sendMessage(
  { text: input },
  {
    headers: { Authorization: "Bearer token123" },
    body: { temperature: 0.7, max_tokens: 100 },
    metadata: { userId: "user123", sessionId: "session456" },
  },
)
```

### 9.2 自定义 body 字段

服务端解构：

```typescript
const { messages, customKey }: { messages: UIMessage[]; customKey: string } =
  await req.json()
```

---

## 十、高级功能

### 10.1 附件（图片、文件）

```tsx
const [files, setFiles] = useState<FileList | undefined>(undefined)

sendMessage({
  text: input,
  files,
})
```

消息中 `part.type === "file"` 且 `part.mediaType?.startsWith("image/")` 时可渲染为 `<img>`。

### 10.2 消息元数据（Token 用量等）

服务端：

```typescript
return result.toUIMessageStreamResponse({
  messageMetadata: ({ part }) => {
    if (part.type === "finish") {
      return { totalUsage: part.totalUsage }
    }
  },
})
```

客户端：

```tsx
{message.metadata?.totalUsage && (
  <span>{message.metadata.totalUsage.totalTokens} tokens</span>
)}
```

### 10.3 事件回调

```tsx
useChat({
  onFinish: ({ message, messages, isAbort, isDisconnect, isError }) => {
    // 流结束后的逻辑
  },
  onError: (error) => {
    console.error("An error occurred:", error)
  },
  onData: (dataPart) => {
    console.log("Received data part:", dataPart)
  },
})
```

### 10.4 节流 UI 更新

```tsx
useChat({
  experimental_throttle: 50, // 50ms 节流
})
```

### 10.5 修改消息（如删除）

```tsx
const { messages, setMessages } = useChat()

const handleDelete = (id: string) => {
  setMessages(messages.filter((m) => m.id !== id))
}
```

---

## 十一、工具调用（Tool Calling）

参考 [Chatbot Tool Usage](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage)。

服务端定义工具：

```typescript
import { tool } from "ai"
import { z } from "zod"

const tools = {
  weather: tool({
    description: "Get weather information",
    parameters: z.object({
      location: z.string(),
      units: z.enum(["celsius", "fahrenheit"]),
    }),
    execute: async ({ location, units }) => {
      // 实现逻辑
      return { location, temperature: 25, units }
    },
  }),
}

const result = streamText({
  model: "anthropic/claude-sonnet-4.5",
  messages: await convertToModelMessages(messages),
  tools,
})
```

客户端需处理 `part.type === "tool-invocation"` 并调用 `addToolOutput`。

---

## 十二、React Router 适配说明

AI SDK 的 `useChat` 是纯 React Hook，不依赖 Next.js，可在 React Router 项目中使用：

1. **前端**：正常使用 `useChat` + `DefaultChatTransport`，`api` 指向你的后端（如 `/api/chat`）
2. **后端**：提供符合 AI SDK 流式协议的 POST 接口，可通过：
   - Vite 开发代理转发到 Node 服务
   - 生产环境由 Nginx/API Gateway 转发到后端服务
3. **认证**：在 `headers` 中传入 Token，后端校验后调用 LLM

---

## 十三、参考链接

| 文档 | 链接 |
|------|------|
| AI SDK 首页 | https://ai-sdk.dev/docs/introduction |
| useChat 参考 | https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat |
| Chatbot 指南 | https://ai-sdk.dev/docs/ai-sdk-ui/chatbot |
| 消息持久化 | https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence |
| Transport | https://ai-sdk.dev/docs/ai-sdk-ui/transport |
| 模型提供商 | https://ai-sdk.dev/providers |
| llms.txt（全文档 Markdown） | https://ai-sdk.dev/llms.txt |

---

## 十四、版本说明

- 本文档基于 **AI SDK 6.x** 编写
- AI SDK 5.0 起 `useChat` 采用 Transport 架构，API 有较大变化，迁移请参考 [Migration Guide](https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0)
