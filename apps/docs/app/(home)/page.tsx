import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "@repo/ui";
import { ToggleMode } from "@repo/propel";
import {
  Bars3Icon,
  HomeIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function HomePage() {
  const navigate = useNavigate();

  // 导航菜单项
  const menuItems = [
    { name: "首页", href: "/", icon: HomeIcon },
    { name: "文档", href: "/", icon: DocumentTextIcon },
  ];

  // 特性列表
  const features = [
    {
      title: "快速部署",
      description: "一键部署，快速上线，让您的应用在几分钟内运行起来。",
      icon: CheckCircleIcon,
    },
    {
      title: "安全可靠",
      description: "企业级安全保障，数据加密传输，确保您的数据安全无忧。",
      icon: CheckCircleIcon,
    },
    {
      title: "易于扩展",
      description: "灵活的架构设计，支持快速扩展，满足业务增长需求。",
      icon: CheckCircleIcon,
    },
    {
      title: "智能监控",
      description: "实时监控系统状态，智能预警，让您随时掌握系统运行情况。",
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
            <ToggleMode iconSize="h-5 w-5" />
            <Button
              variant="ghost"
              size="default"
              onClick={() => navigate("/sign-in")}
              className="hidden sm:flex"
            >
              登录
            </Button>
            <Button
              variant="default"
              size="default"
              onClick={() => navigate("/sign-up")}
            >
              注册
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
                构建下一代
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {" "}
                  应用系统
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                强大的开发平台，让您专注于业务创新。提供完整的解决方案，从开发到部署，一站式服务。
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate("/sign-up")}
                  className="h-12 px-8 text-base"
                >
                  立即开始
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
                为什么选择我们
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                我们提供企业级解决方案，帮助您快速构建和部署应用
              </p>
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
              <span className="text-sm text-muted-foreground">
                © 2026 System. All rights reserved.
              </span>
            </div>
            <nav className="flex items-center gap-6">
              <a
                href="#"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                隐私政策
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                服务条款
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                联系我们
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
