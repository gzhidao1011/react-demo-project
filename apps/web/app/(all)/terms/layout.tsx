import { Outlet } from "react-router";
import type { Route } from "./+types/layout";

export const meta: Route.MetaFunction = () => [
  { title: "Terms of Service - Repo" },
  { name: "robots", content: "index, follow" },
];

export default function TermsLayout() {
  return <Outlet />;
}
