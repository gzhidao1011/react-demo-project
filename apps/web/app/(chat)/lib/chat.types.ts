/**
 * Chat 相关类型定义（与后端契约对齐）
 */

/** 会话项（侧边栏展示） */
export interface Conversation {
  id: string
  title: string
  createdAt: number
}

/** 快捷提示词（欢迎空状态） */
export interface SuggestedPrompt {
  id: string
  label: string
  text: string
}

/** 消息 part（与 AI SDK 对齐） */
export interface MessagePart {
  type: string
  text?: string
  /** 文件/图片 URL（用于渲染） */
  url?: string
  /** MIME 类型 */
  mimeType?: string
  /** 来源标题（source-url） */
  title?: string
}
