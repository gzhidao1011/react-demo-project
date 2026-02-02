import { Outlet } from "react-router";
import type { Route } from "./+types/layout";

export const meta: Route.MetaFunction = () => [
  { title: "Forgot Password - Repo" },
  { name: "robots", content: "noindex, nofollow" },
];

export default function ForgotPasswordLayout() {
  return <Outlet />;
}
