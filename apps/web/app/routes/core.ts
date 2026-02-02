import type { RouteConfigEntry } from "@react-router/dev/routes";
import { index, layout, route } from "@react-router/dev/routes";

export const coreRoutes: RouteConfigEntry[] = [
  layout("./(home)/layout.tsx", [index("./(home)/page.tsx")]),
  layout("./(all)/sign-up/layout.tsx", [route("sign-up", "./(all)/sign-up/page.tsx")]),
  layout("./(all)/sign-in/layout.tsx", [route("sign-in", "./(all)/sign-in/page.tsx")]),
  layout("./(all)/forgot-password/layout.tsx", [route("forgot-password", "./(all)/forgot-password/page.tsx")]),
  layout("./(all)/reset-password/layout.tsx", [route("reset-password", "./(all)/reset-password/page.tsx")]),
  layout("./(all)/verify-email/layout.tsx", [route("verify-email", "./(all)/verify-email/page.tsx")]),
  layout("./(all)/terms/layout.tsx", [route("terms", "./(all)/terms/page.tsx")]),
  layout("./(all)/privacy/layout.tsx", [route("privacy", "./(all)/privacy/page.tsx")]),
  layout("./(chat)/layout.tsx", [
    // 使用可选参数 :id? 匹配 /chat 和 /chat/:id，避免同一文件多路由导致重复 route id
    route("chat/:id?", "./(chat)/page.tsx"),
  ]),
  layout("./(settings)/layout.tsx", [route("settings", "./(settings)/page.tsx")]),
];
