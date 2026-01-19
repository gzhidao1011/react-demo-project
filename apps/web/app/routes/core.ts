import type { RouteConfigEntry } from "@react-router/dev/routes";
import { index, layout, route } from "@react-router/dev/routes";

export const coreRoutes: RouteConfigEntry[] = [
  layout("./(home)/layout.tsx", [index("./(home)/page.tsx")]),
  layout("./(all)/sign-up/layout.tsx", [route("sign-up", "./(all)/sign-up/page.tsx")]),
  layout("./(all)/sign-in/layout.tsx", [route("sign-in", "./(all)/sign-in/page.tsx")]),
];
