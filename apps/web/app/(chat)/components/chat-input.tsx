import { useCallback, useEffect, useRef, useState } from "react"
import { MicrophoneIcon, PaperClipIcon } from "@heroicons/react/16/solid"
import { Button, Textarea, cn } from "@repo/ui"

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (text: string, files?: File[]) => void
  disabled?: boolean
  placeholder?: string
  /** 输入框 ref（用于自动聚焦） */
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
}

/**
 * 聊天输入框 + 发送按钮
 * Enter 发送，Shift+Enter 换行
 */
const ACCEPT_IMAGES = "image/png,image/jpeg,image/webp,image/gif"

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "输入消息...",
  inputRef: inputRefProp,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const textareaEl = inputRefProp ?? textareaRef
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files
    if (!selected?.length) return
    setFiles((prev) => [...prev, ...Array.from(selected)])
    e.target.value = ""
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        const trimmed = value.trim()
        const canSend = (trimmed || files.length > 0) && !disabled
        if (canSend) {
          onSend(trimmed || "", files.length > 0 ? files : undefined)
          setFiles([])
        }
      }
    },
    [value, files, disabled, onSend],
  )

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    const canSend = (trimmed || files.length > 0) && !disabled
    if (!canSend) return
    onSend(trimmed || "", files.length > 0 ? files : undefined)
    setFiles([])
  }, [value, files, disabled, onSend])

  const canSend = (value.trim() || files.length > 0) && !disabled

  // 输入框自适应高度（多行自动扩展，参考 ChatGPT）
  const adjustHeight = useCallback(() => {
    const el = textareaEl.current
    if (!el) return
    el.style.height = "auto"
    const newHeight = Math.min(Math.max(el.scrollHeight, 40), 200)
    el.style.height = `${newHeight}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  // 拖拽 + 粘贴图片（主流交互）
  const addFiles = useCallback((fileList: FileList | File[]) => {
    const arr = Array.isArray(fileList) ? fileList : Array.from(fileList)
    const images = arr.filter((f) => ACCEPT_IMAGES.split(",").some((t) => f.type === t.trim()))
    if (images.length > 0) {
      setFiles((prev) => [...prev, ...images])
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
    },
    [addFiles],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }, [])

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.files
      if (items?.length) {
        const images = Array.from(items).filter((f) =>
          ACCEPT_IMAGES.split(",").some((t) => f.type === t.trim()),
        )
        if (images.length > 0) {
          e.preventDefault()
          addFiles(images)
        }
      }
    },
    [addFiles],
  )

  return (
    <div
      className="flex flex-col gap-2 border-t border-border bg-card p-4"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <span
              key={`${f.name}-${i}`}
              className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs text-foreground"
            >
              {f.name}
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => removeFile(i)}
                className="h-auto min-h-0 w-auto rounded p-0.5 hover:bg-muted-foreground/20"
                aria-label={`移除 ${f.name}`}
              >
                ×
              </Button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_IMAGES}
          multiple
          onChange={handleFileChange}
          className="hidden"
          aria-hidden
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          aria-label="添加图片附件"
        >
          <PaperClipIcon className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled
          title="语音输入即将推出"
          aria-label="语音输入（即将推出）"
          className="cursor-not-allowed opacity-50"
        >
          <MicrophoneIcon className="h-5 w-5" />
        </Button>
        <Textarea
          ref={textareaEl}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={disabled}
          placeholder={placeholder}
          aria-label="输入消息"
          rows={1}
          className={cn(
            "min-h-[40px] max-h-[200px] flex-1 resize-none overflow-y-auto",
          )}
        />
        <Button
          type="button"
          variant="default"
          onClick={handleSubmit}
          disabled={!canSend}
          aria-label="发送"
        >
          发送
        </Button>
      </div>
    </div>
  )
}
