import type { SuggestedPrompt } from "./chat.types";

/** 翻译函数类型 */
export type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

/** 默认快捷提示词（欢迎空状态），需传入 t 以支持 i18n */
export function getDefaultSuggestedPrompts(t: TranslateFn): SuggestedPrompt[] {
  return [
    { id: "1", label: t("chat.prompts.writeEmail"), text: "Help me write an email" },
    { id: "2", label: t("chat.prompts.summarize"), text: "Summarize this article" },
    { id: "3", label: t("chat.prompts.explainCode"), text: "Explain this code" },
    { id: "4", label: t("chat.prompts.brainstorm"), text: "Help me brainstorm some ideas" },
  ];
}

/** AI 消息下方的建议回复（后续提示词），需传入 t 以支持 i18n */
export function getFollowUpPrompts(t: TranslateFn): SuggestedPrompt[] {
  return [
    { id: "f1", label: t("chat.prompts.explainDetail"), text: "Please explain in more detail" },
    { id: "f2", label: t("chat.prompts.translate"), text: "Please translate the above content" },
    { id: "f3", label: t("chat.prompts.simplify"), text: "Please rephrase in simpler terms" },
    { id: "f4", label: t("chat.prompts.giveExamples"), text: "Please give some examples" },
  ];
}
