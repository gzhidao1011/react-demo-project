import type { Route } from "./+types/not-found";

export const meta: Route.MetaFunction = () => [
  { title: "404 - Page Not Found" },
  { name: "robots", content: "noindex, nofollow" },
];

function PageNotFound() {
  return <div className={`h-screen w-full overflow-hidden bg-surface-1`}>Go to Home</div>;
}

export default PageNotFound;
