import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
import "./layout.css";

export const meta: Route.MetaFunction = () => [
  { title: "Sign in - Repo" },
  { name: "robots", content: "index, nofollow" },
];

export default function SignInLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--decor-gradient-from)] via-[var(--decor-gradient-via)] to-[var(--decor-gradient-to)] relative overflow-hidden">
      {/* 背景装饰元素 - 完全支持系统主题模式 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 大圆形装饰 - 使用主题变量，自动响应系统主题变化 */}
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl animate-blob bg-[var(--decor-blob-primary)] opacity-[var(--decor-opacity)] dark:mix-blend-soft-light"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000 bg-[var(--decor-blob-secondary)] opacity-[var(--decor-opacity)] dark:mix-blend-soft-light"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000 bg-[var(--decor-blob-accent)] opacity-[var(--decor-opacity-small)] dark:mix-blend-soft-light"></div>

        {/* 网格背景 - 使用主题变量，自动响应系统主题变化 */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[var(--decor-grid-opacity)]"></div>
      </div>

      {/* 内容区域 */}
      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  );
}
