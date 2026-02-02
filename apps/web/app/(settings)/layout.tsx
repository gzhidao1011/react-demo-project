import { isAuthenticated } from "@repo/utils";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import type { Route } from "./+types/layout";

export const meta: Route.MetaFunction = () => [
  { title: "账户设置 - Repo" },
  { name: "robots", content: "noindex, nofollow" },
];

export default function SettingsLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/sign-in", { replace: true });
    }
  }, [navigate]);

  return <Outlet />;
}
