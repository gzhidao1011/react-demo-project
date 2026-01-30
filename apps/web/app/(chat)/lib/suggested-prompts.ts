import type { SuggestedPrompt } from "./chat.types"

/** 默认快捷提示词（欢迎空状态） */
export const DEFAULT_SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { id: "1", label: "写一封邮件", text: "帮我写一封邮件" },
  { id: "2", label: "总结文章", text: "总结这篇文章" },
  { id: "3", label: "解释代码", text: "解释这段代码" },
  { id: "4", label: "头脑风暴", text: "帮我头脑风暴一些想法" },
]

/** AI 消息下方的建议回复（后续提示词） */
export const FOLLOW_UP_PROMPTS: SuggestedPrompt[] = [
  { id: "f1", label: "详细解释", text: "请更详细地解释一下" },
  { id: "f2", label: "翻译一下", text: "请把上面的内容翻译成中文" },
  { id: "f3", label: "简化表述", text: "请用更简单的语言重新表述" },
  { id: "f4", label: "举例说明", text: "请举几个例子说明" },
]
