import { ChevronDownIcon, LanguageIcon } from "@heroicons/react/24/outline";
import { Button, cn, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui";
import { useLocale } from "./use-locale";

/** 支持的语言列表 */
const SUPPORTED_LOCALES = [
  { code: "zh", label: "简体中文" },
  { code: "en", label: "English" },
] as const;

export interface LocaleSwitcherProps {
  /** 是否显示标签 */
  showLabel?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 语言切换组件
 *
 * 用于在多语言之间切换，使用 shadcn DropdownMenu 组件。
 * 可在任意使用 I18nProvider 的项目中复用。
 *
 * @example
 * ```tsx
 * <LocaleSwitcher />
 * <LocaleSwitcher showLabel className="fixed right-4 top-4 z-10" />
 * ```
 */
export function LocaleSwitcher({ showLabel = false, className = "" }: LocaleSwitcherProps) {
  const { locale, setLocale, isLoading } = useLocale();

  const currentLabel = SUPPORTED_LOCALES.find((l) => l.code === locale)?.label ?? locale;

  const handleSelect = async (code: string) => {
    if (code === locale || isLoading) return;
    await setLocale(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={showLabel ? "default" : "icon"}
          disabled={isLoading}
          aria-label="切换语言"
          className={cn("group", className)}
        >
          <LanguageIcon className="h-5 w-5" />
          {showLabel && <span className="text-sm">{currentLabel}</span>}
          <ChevronDownIcon className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {SUPPORTED_LOCALES.map(({ code, label }) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => handleSelect(code)}
            disabled={isLoading}
            className={cn(locale === code && "bg-muted/50 font-medium")}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
