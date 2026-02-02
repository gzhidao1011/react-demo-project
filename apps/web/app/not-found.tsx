import { useLocale } from "@repo/i18n";
import { Link } from "react-router";
import type { Route } from "./+types/not-found";

export const meta: Route.MetaFunction = () => [
  { title: "404 - Page Not Found" },
  { name: "robots", content: "noindex, nofollow" },
];

function PageNotFound() {
  const { t } = useLocale();
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-surface-1">
      <Link to="/" className="text-primary underline hover:no-underline">
        {t("notFound.goHome")}
      </Link>
    </div>
  );
}

export default PageNotFound;
