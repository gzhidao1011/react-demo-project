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
 * 缓存策略（OWASP）：重置页设置 Cache-Control: no-store
 */
export function headers(_args: Route.HeadersArgs) {
  return {
    "Cache-Control": "no-store",
  };
}

export default function ResetPasswordLayout() {
  return <Outlet />;
}
