import type { RouteConfigEntry } from "@react-router/dev/routes";
import { route } from "@react-router/dev/routes";
import { coreRoutes } from "./routes/core";
import { extendedRoutes } from "./routes/extended";
import { mergeRoutes } from "./routes/helper";

const mergedRoutes: RouteConfigEntry[] = mergeRoutes(coreRoutes, extendedRoutes);

const routes: RouteConfigEntry[] = [...mergedRoutes, route("*", "./not-found.tsx")];

export default routes;
