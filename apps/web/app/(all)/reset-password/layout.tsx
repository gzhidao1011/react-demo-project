import { Outlet } from "react-router";
import type { Route } from "./+types/layout";

/**
 * Referrer 策略（OWASP）：避免带 token 的 URL 通过 Referer 泄露到第三方
 * 缓存策略：防止敏感页面被缓存
 */
export const meta: Route.MetaFunction = () => [
  { title: "Reset Password - Repo" },
  { name: "referrer", content: "no-referrer" },
  { name: "robots", content: "noindex, nofollow" },
];

/**
 * 注意：在 SPA 模式（ssr: false）下，不能使用 headers 导出
 * 缓存策略通过 meta 标签中的 robots 和 referrer 策略来实现
 */
export default function ResetPasswordLayout() {
  return <Outlet />;
}
