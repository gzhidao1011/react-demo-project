/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ADMIN_BASE_PATH?: string;
  // 添加其他环境变量类型定义
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
