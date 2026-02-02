import { Outlet } from "react-router";
import type { Route } from "./+types/layout";

export const meta: Route.MetaFunction = () => [
  { title: "Privacy Policy - Repo" },
  { name: "robots", content: "index, follow" },
];

export default function PrivacyLayout() {
  return <Outlet />;
}
