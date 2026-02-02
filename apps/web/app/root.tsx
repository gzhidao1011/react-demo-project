import { I18nProvider, LOCALE_COOKIE_NAME, LOCALE_STORAGE_KEY, useLocale } from "@repo/i18n";
import { Toaster, useTheme } from "@repo/propel";
import { updateUserLocale } from "@repo/services";
import { useEffect } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import { loadMessages } from "./i18n/load-messages";
import "./app.css";

export const links: Route.LinksFunction = () => [];

/**
 * 同步 html lang 属性与当前 locale
 * 在 I18nProvider 内使用，切换语言时更新 document.documentElement.lang
 */
function HtmlLangSync() {
  const { locale } = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* 在页面渲染前初始化主题，防止闪烁 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const THEME_STORAGE_KEY = 'theme-preference';
                const stored = localStorage.getItem(THEME_STORAGE_KEY);
                const theme = stored || 'system';
                let isDark = false;
                
                if (theme === 'system') {
                  isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                } else {
                  isDark = theme === 'dark';
                }
                
                const root = document.documentElement;
                root.classList.remove('dark', 'light');
                if (isDark) {
                  root.classList.add('dark');
                } else {
                  root.classList.add('light');
                }
              })();
            `,
          }}
        />
        {/* 在页面渲染前初始化 locale，设置 html lang 防止闪烁 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var locale = 'zh';
                try {
                  var fromCookie = document.cookie.match(new RegExp('${LOCALE_COOKIE_NAME}=([^;]+)'));
                  if (fromCookie) locale = decodeURIComponent(fromCookie[1].trim());
                  else {
                    var fromStorage = localStorage.getItem('${LOCALE_STORAGE_KEY}');
                    if (fromStorage) locale = fromStorage;
                  }
                } catch (e) {}
                document.documentElement.lang = locale;
              })();
            `,
          }}
        />
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning>
        <I18nProvider
          loadMessages={loadMessages}
          defaultLocale="zh"
          onLocaleChange={async (locale) => {
            await updateUserLocale(locale);
          }}
        >
          <HtmlLangSync />
          {children}
        </I18nProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // 使用 useTheme hook 确保主题能够响应系统变化
  useTheme();

  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}
