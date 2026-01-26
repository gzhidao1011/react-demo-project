import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import { cn } from "@repo/ui";
import { useTheme } from "./use-theme";

export interface ToggleModeProps {
  /**
   * 是否显示标签
   * @default false
   */
  showLabel?: boolean;
  /**
   * 自定义类名
   */
  className?: string;
  /**
   * 图标尺寸
   * @default "h-5 w-5"
   */
  iconSize?: string;
}

/**
 * 主题切换组件
 *
 * 用于在亮色和暗色模式之间切换，点击图标即可切换主题
 *
 * @example
 * ```tsx
 * <ToggleMode />
 * ```
 *
 * @example
 * ```tsx
 * <ToggleMode showLabel />
 * ```
 */
export function ToggleMode({ showLabel = false, className, iconSize = "h-5 w-5" }: ToggleModeProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isDark ? "切换到亮色模式" : "切换到暗色模式"}
        className="flex items-center justify-center rounded-lg p-2 text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
      >
        {isDark ? <MoonIcon className={iconSize} /> : <SunIcon className={iconSize} />}
      </button>
      {showLabel && (
        <span className="text-sm text-[var(--color-text-primary)]">{isDark ? "暗色模式" : "亮色模式"}</span>
      )}
    </div>
  );
}
