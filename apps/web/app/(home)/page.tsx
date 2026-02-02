import { ArrowRightIcon, Bars3Icon, CheckCircleIcon, DocumentTextIcon, HomeIcon } from "@heroicons/react/24/outline";
import { LocaleSwitcher, useLocale } from "@repo/i18n";
import { ToggleMode } from "@repo/propel";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui";
import { useNavigate } from "react-router";

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useLocale();

  // 导航菜单项
  const menuItems = [
    { name: t("home.nav.home"), href: "/", icon: HomeIcon },
    { name: t("home.nav.docs"), href: "/", icon: DocumentTextIcon },
  ];

  // 特性列表
  const features = [
    {
      title: t("home.features.fastDeploy.title"),
      description: t("home.features.fastDeploy.description"),
      icon: CheckCircleIcon,
    },
    {
      title: t("home.features.secure.title"),
      description: t("home.features.secure.description"),
      icon: CheckCircleIcon,
    },
    {
      title: t("home.features.extensible.title"),
      description: t("home.features.extensible.description"),
      icon: CheckCircleIcon,
    },
    {
      title: t("home.features.monitoring.title"),
      description: t("home.features.monitoring.description"),
      icon: CheckCircleIcon,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* 左侧菜单 */}
          <nav className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-bold">S</span>
              </div>
              <span className="text-lg font-semibold">System</span>
            </div>
            <div className="hidden items-center gap-6 md:flex">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </a>
                );
              })}
            </div>
            {/* 移动端菜单按钮 */}
            <button className="flex items-center gap-2 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden">
              <Bars3Icon className="h-5 w-5" />
            </button>
          </nav>

          {/* 右侧登录入口 */}
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <ToggleMode iconSize="h-5 w-5" />
            <Button variant="ghost" size="default" onClick={() => navigate("/sign-in")} className="hidden sm:flex">
              {t("auth.login")}
            </Button>
            <Button variant="default" size="default" onClick={() => navigate("/sign-up")}>
              {t("auth.signUp")}
              <ArrowRightIcon className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-background to-muted/20 py-20 sm:py-24 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {t("home.hero.title")}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {" "}
                  {t("home.hero.titleHighlight")}
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                {t("home.hero.subtitle")}
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Button size="lg" onClick={() => navigate("/sign-up")} className="h-12 px-8 text-base">
                  {t("home.hero.cta")}
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 sm:py-24 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {t("home.features.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("home.features.subtitle")}</p>
            </div>
            <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title} size="sm">
                    <CardHeader>
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-bold">S</span>
              </div>
              <span className="text-sm text-muted-foreground">{t("home.footer.copyright")}</span>
            </div>
            <nav className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {t("home.footer.privacy")}
              </a>
              <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {t("home.footer.terms")}
              </a>
              <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {t("home.footer.contact")}
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
