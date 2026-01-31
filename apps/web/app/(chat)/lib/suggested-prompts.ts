import type { SuggestedPrompt } from "./chat.types";

/** 默认快捷提示词（欢迎空状态，国际主流风格） */
export const DEFAULT_SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { id: "1", label: "Write an email", text: "Help me write an email" },
  { id: "2", label: "Summarize article", text: "Summarize this article" },
  { id: "3", label: "Explain code", text: "Explain this code" },
  { id: "4", label: "Brainstorm ideas", text: "Help me brainstorm some ideas" },
];

/** AI 消息下方的建议回复（后续提示词） */
export const FOLLOW_UP_PROMPTS: SuggestedPrompt[] = [
  { id: "f1", label: "Explain in more detail", text: "Please explain in more detail" },
  { id: "f2", label: "Translate", text: "Please translate the above content" },
  { id: "f3", label: "Simplify", text: "Please rephrase in simpler terms" },
  { id: "f4", label: "Give examples", text: "Please give some examples" },
];
