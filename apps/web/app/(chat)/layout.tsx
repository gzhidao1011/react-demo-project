import { isAuthenticated } from "@repo/utils";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import type { Route } from "./+types/layout";

export const meta: Route.MetaFunction = () => [
  { name: "robots", content: "index, nofollow" },
  { name: "viewport", content: "width=device-width, initial-scale=1, minimum-scale=1, viewport-fit=cover" },
];

export default function ChatPageLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/sign-in", { replace: true });
    }
  }, [navigate]);

  return <Outlet />;
}
