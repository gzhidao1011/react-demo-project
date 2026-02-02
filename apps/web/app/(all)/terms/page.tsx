import { LocaleSwitcher, useLocale } from "@repo/i18n";
import { Button } from "@repo/ui";
import { useNavigate } from "react-router";

export default function TermsPage() {
  const navigate = useNavigate();
  const { t } = useLocale();

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center">
      <LocaleSwitcher className="fixed right-4 top-4 z-10" />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground">{t("terms.title")}</h1>
        <p className="mt-6 text-muted-foreground">{t("terms.intro")}</p>
        <Button variant="outline" className="mt-8" onClick={() => navigate("/")}>
          {t("notFound.goHome")}
        </Button>
      </div>
    </div>
  );
}
