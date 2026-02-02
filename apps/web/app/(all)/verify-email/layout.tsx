import { Outlet } from "react-router";
import type { Route } from "./+types/layout";

/**
 * Referrer 策略（OWASP）：避免带 token 的 URL 通过 Referer 泄露到第三方
 */
export const meta: Route.MetaFunction = () => [
  { title: "Verify Email - Repo" },
  { name: "referrer", content: "no-referrer" },
  { name: "robots", content: "noindex, nofollow" },
];

export default function VerifyEmailLayout() {
  return <Outlet />;
}
