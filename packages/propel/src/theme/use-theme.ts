import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "theme-preference";

/**
 * 获取系统主题偏好
 */
function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * 应用主题到 DOM
 */
function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  // 移除所有主题类
  root.classList.remove("dark", "light");
  // 添加对应的主题类
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.add("light");
  }
}

/**
 * 主题切换 Hook
 *
 * @returns 返回当前主题、设置主题的函数和实际应用的主题
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "system";
    }
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    return stored || "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored === "dark" || stored === "light") {
      return stored;
    }
    return getSystemTheme();
  });

  // 监听系统主题变化
  useEffect(() => {
    if (theme !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? "dark" : "light";
      setResolvedTheme(newTheme);
      applyTheme(newTheme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // 应用主题
  useEffect(() => {
    let resolved: "light" | "dark";
    if (theme === "system") {
      resolved = getSystemTheme();
    } else {
      resolved = theme;
    }

    setResolvedTheme(resolved);
    applyTheme(resolved);

    // 持久化用户选择
    if (theme !== "system") {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } else {
      localStorage.removeItem(THEME_STORAGE_KEY);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return {
    theme,
    setTheme,
    resolvedTheme,
  };
}
