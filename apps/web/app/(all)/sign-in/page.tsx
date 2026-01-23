import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@repo/ui"
import { useNavigate } from "react-router";

export default function SignInPage({
    className,
    loaderData,
    actionData,
    ...props
  }: React.ComponentProps<"div"> & {
    loaderData?: unknown
    actionData?: unknown
  }) {
  const navigate = useNavigate(); 
  return (
    <div className={`flex  min-h-svh overflow-hidden w-full items-center justify-center `} {...props}>
      <Card  className="w-[400px]">
        <CardHeader>
          <CardTitle>登录到您的账户</CardTitle>
          <CardDescription>
            输入您的邮箱地址以登录到您的账户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
              邮箱地址
              </Label>
              <Input
                id="email"
                type="text"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password" className="text-sm font-medium">
                  密码
                </Label>
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  忘记密码？
                </a>
              </div>
              <Input id="password" type="text" required />
            </div>
            <div className="space-y-2">
              {/* 按钮组 */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button type="submit" className="flex-1">
                  登录
                </Button>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                没有账户？{" "}
                <Button type="button" variant="link" onClick={() => navigate("/sign-up")} className="p-0 h-auto">
                立即注册
                </Button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
