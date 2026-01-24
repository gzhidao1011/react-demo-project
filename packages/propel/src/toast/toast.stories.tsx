import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "@repo/ui"
import { Toaster, toast } from "./toast"

const ToastPlayground = () => {
  return (
    <div style={{ maxWidth: 720, padding: 24 }}>
      <Toaster richColors />
      <div style={{ display: "grid", gap: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Toast</h2>
        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
          点击按钮触发不同类型的 toast（基于 sonner）。
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Button type="button" onClick={() => toast.success("保存成功")}>
            Success
          </Button>
          <Button type="button" onClick={() => toast.error("保存失败，请稍后重试")}>
            Error
          </Button>
          <Button type="button" onClick={() => toast.message("这是一条普通提示")}>
            Message
          </Button>
          <Button
            type="button"
            onClick={() =>
              toast("带操作的 toast", {
                action: {
                  label: "撤销",
                  onClick: () => toast.success("已撤销"),
                },
              })
            }
          >
            With Action
          </Button>
        </div>
      </div>
    </div>
  )
}

const meta: Meta<typeof ToastPlayground> = {
  title: "propel/toast",
  component: ToastPlayground,
}

export default meta

type Story = StoryObj<typeof ToastPlayground>

export const Playground: Story = {}
