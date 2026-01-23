import { Outlet } from "react-router";
import type { Route } from "./+types/layout";

export const meta: Route.MetaFunction = () => [
  { title: "Sign in - Repo" },
  { name: "robots", content: "index, nofollow" },
];

export default function SignInLayout() {
  return (
    <Outlet />
  );
}
