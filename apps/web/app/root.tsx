import { Toaster } from "@repo/propel";
import { useTheme } from "@repo/propel";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning>
        {children}
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
