import { PaperClipIcon } from "@heroicons/react/16/solid";
import { Button, cn, Textarea } from "@repo/ui";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, ClipboardEvent, DragEvent, KeyboardEvent, RefObject } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string, files?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
  /** 输入框 ref（用于自动聚焦） */
  inputRef?: RefObject<HTMLTextAreaElement | null>;
}

/**
 * 聊天输入框 + 发送按钮
 * Enter 发送，Shift+Enter 换行
 */
const ACCEPT_IMAGES = "image/png,image/jpeg,image/webp,image/gif";
const ACCEPT_IMAGE_TYPES = ACCEPT_IMAGES.split(",").map((t) => t.trim());

const TEXTAREA_MIN_HEIGHT = 40;
const TEXTAREA_MAX_HEIGHT = 200;
const TEXTAREA_CLASSES =
  "min-h-[40px] max-h-[200px] flex-1 resize-none overflow-y-auto border-0 bg-transparent px-2 py-2.5 shadow-none focus-visible:ring-0";

const INPUT_CONTAINER_CLASSES =
  "flex flex-col gap-2 rounded-xl border border-border bg-card shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background";

const FILE_CHIP_CLASSES = "inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs text-foreground";
const ARIA_ADD_ATTACHMENTS = "Add attachments";
const ARIA_MESSAGE = "Message";
const ARIA_SEND = "Send";
const ARIA_REMOVE_PREFIX = "Remove";

const SendIcon = memo(function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
  );
});

export const ChatInput = memo(function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Message...",
  inputRef: inputRefProp,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaEl = inputRefProp ?? textareaRef;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected?.length) return;
    setFiles((prev) => [...prev, ...Array.from(selected)]);
    e.target.value = "";
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const doSubmit = useCallback(() => {
    const trimmed = value.trim();
    const canSend = (trimmed || files.length > 0) && !disabled;
    if (!canSend) return;
    onSend(trimmed || "", files.length > 0 ? files : undefined);
    setFiles([]);
  }, [value, files, disabled, onSend]);

  const canSend = (value.trim() || files.length > 0) && !disabled;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        doSubmit();
      }
    },
    [doSubmit],
  );

  const handleSubmit = doSubmit;

  // 输入框自适应高度（多行自动扩展，参考 ChatGPT）
  const adjustHeight = useCallback(() => {
    const el = textareaEl.current;
    if (!el) return;
    el.style.height = "auto";
    const newHeight = Math.min(Math.max(el.scrollHeight, TEXTAREA_MIN_HEIGHT), TEXTAREA_MAX_HEIGHT);
    el.style.height = `${newHeight}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // 拖拽 + 粘贴图片（主流交互）
  const addFiles = useCallback((fileList: FileList | File[]) => {
    const arr = Array.isArray(fileList) ? fileList : Array.from(fileList);
    const images = arr.filter((f) => ACCEPT_IMAGE_TYPES.includes(f.type));
    if (images.length > 0) {
      setFiles((prev) => [...prev, ...images]);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.files;
      if (items?.length) {
        const images = Array.from(items).filter((f) => ACCEPT_IMAGE_TYPES.includes(f.type));
        if (images.length > 0) {
          e.preventDefault();
          addFiles(images);
        }
      }
    },
    [addFiles],
  );

  // AI Elements 风格：圆角容器、居中布局（参考 ChatGPT/Claude）
  return (
    <div className={INPUT_CONTAINER_CLASSES} onDrop={handleDrop} onDragOver={handleDragOver}>
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pt-3">
          {files.map((f, i) => (
            <span key={`${f.name}-${f.size}-${i}`} className={FILE_CHIP_CLASSES}>
              {f.name}
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => removeFile(i)}
                className="h-auto min-h-0 w-auto rounded p-0.5 hover:bg-muted-foreground/20"
                aria-label={`${ARIA_REMOVE_PREFIX} ${f.name}`}
              >
                ×
              </Button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2 p-2">
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
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={ARIA_ADD_ATTACHMENTS}
        >
          <PaperClipIcon className="h-5 w-5" />
        </Button>
        <Textarea
          ref={textareaEl}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={ARIA_MESSAGE}
          rows={1}
          className={cn(TEXTAREA_CLASSES)}
        />
        <Button
          type="button"
          variant="default"
          size="icon"
          onClick={handleSubmit}
          disabled={!canSend}
          className="shrink-0 rounded-lg"
          aria-label={ARIA_SEND}
        >
          <SendIcon />
        </Button>
      </div>
    </div>
  );
});
