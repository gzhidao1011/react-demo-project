import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
import "./layout.css";

export const meta: Route.MetaFunction = () => [
  { title: "Sign up - Repo" },
  { name: "robots", content: "index, nofollow" },
];

export default function SignUpLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
        {/* 背景装饰元素 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* 大圆形装饰 */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 dark:opacity-20 dark:mix-blend-soft-light animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 dark:opacity-20 dark:mix-blend-soft-light animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 dark:opacity-10 dark:mix-blend-soft-light animate-blob animation-delay-4000"></div>
          
          {/* 网格背景 */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10"></div>
        </div>

        {/* 内容区域 */}
        <div className="relative z-10">
          <Outlet />
        </div>
      </div>
  );
}
