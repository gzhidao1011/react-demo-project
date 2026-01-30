import { MicrophoneIcon, PaperClipIcon } from "@heroicons/react/16/solid"
import { Button } from "@repo/ui"
import type { SuggestedPrompt } from "../lib/chat.types"

interface ChatWelcomeProps {
  prompts: SuggestedPrompt[]
  onPromptSelect: (text: string) => void
}

/**
 * 欢迎空状态 + 快捷提示词 + 功能入口提示（参考 ChatGPT）
 * 当 messages.length === 0 时展示
 */
export function ChatWelcome({ prompts, onPromptSelect }: ChatWelcomeProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <h2 className="text-center text-lg font-medium text-foreground">
        你好，有什么可以帮助你的？
      </h2>
      {/* 快捷提示词 */}
      {prompts.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {prompts.map((p) => (
            <Button
              key={p.id}
              type="button"
              variant="outline"
              onClick={() => onPromptSelect(p.text)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      )}
      {/* 功能入口提示（参考 ChatGPT：附件、语音等） */}
      <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <PaperClipIcon className="h-4 w-4" aria-hidden />
          支持图片附件
        </span>
        <span className="flex items-center gap-1.5 opacity-60">
          <MicrophoneIcon className="h-4 w-4" aria-hidden />
          语音输入（即将推出）
        </span>
      </div>
    </div>
  )
}
