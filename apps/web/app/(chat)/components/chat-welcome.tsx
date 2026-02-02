import { MicrophoneIcon, PaperClipIcon } from "@heroicons/react/16/solid";
import { useLocale } from "@repo/i18n";
import { Button } from "@repo/ui";
import type { SuggestedPrompt } from "../lib/chat.types";

interface ChatWelcomeProps {
  prompts: SuggestedPrompt[];
  onPromptSelect: (text: string) => void;
}

/**
 * 欢迎空状态 + 快捷提示词（参考 ChatGPT/Claude/AI Elements）
 * 当 messages.length === 0 时展示，居中布局符合国际主流交互
 */
export function ChatWelcome({ prompts, onPromptSelect }: ChatWelcomeProps) {
  const { t } = useLocale();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="mx-auto max-w-3xl w-full flex flex-col items-center gap-8">
        <h2 className="text-center text-xl font-medium text-foreground">{t("chat.welcomeTitle")}</h2>
        {/* 快捷提示词（ChatGPT/Claude 风格） */}
        {prompts.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {prompts.map((p) => (
              <Button
                key={p.id}
                type="button"
                variant="outline"
                onClick={() => onPromptSelect(p.text)}
                className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {p.label}
              </Button>
            ))}
          </div>
        )}
        {/* 功能入口提示 */}
        <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <PaperClipIcon className="h-4 w-4" aria-hidden />
            {t("chat.attachImages")}
          </span>
          <span className="flex items-center gap-1.5 opacity-60">
            <MicrophoneIcon className="h-4 w-4" aria-hidden />
            {t("chat.voiceComingSoon")}
          </span>
        </div>
      </div>
    </div>
  );
}
