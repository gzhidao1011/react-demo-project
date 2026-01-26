---
name: file-upload
description: Implement file upload functionality including image upload, file validation, progress tracking, and error handling. Use when implementing file upload features or handling file operations.
---

# File Upload

Implement file upload functionality with validation, progress tracking, and error handling.

## Quick Checklist

When implementing file upload:

- [ ] **File validation** implemented (type, size)
- [ ] **Progress tracking** added
- [ ] **Error handling** for upload failures
- [ ] **Preview** functionality (for images)
- [ ] **Multiple files** support (if needed)
- [ ] **Drag and drop** support (optional)
- [ ] **File compression** (if needed)

## Basic File Upload

### 1. Upload Service

```typescript
// packages/services/src/upload.service.ts
import { APIServiceBase } from "./api.service.base";

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export class UploadService extends APIServiceBase {
  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const token = getAccessToken();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.data);
          } catch {
            reject(new Error("Invalid response format"));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error"));
      });

      xhr.open("POST", "/api/upload");
      
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  }

  async uploadMultiple(
    files: File[],
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<UploadResponse[]> {
    const uploads = files.map((file, index) =>
      this.uploadFile(file, (progress) => {
        onProgress?.(index, progress);
      })
    );

    return Promise.all(uploads);
  }
}

export const uploadService = new UploadService();
```

### 2. File Validation

```typescript
// packages/utils/src/file-validation.ts
export interface FileValidationOptions {
  maxSize?: number; // bytes
  allowedTypes?: string[];
  maxFiles?: number;
}

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): FileValidationResult {
  const errors: string[] = [];
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ["image/jpeg", "image/png", "image/gif"],
  } = options;

  // Check file size
  if (file.size > maxSize) {
    errors.push(
      `文件大小不能超过 ${(maxSize / 1024 / 1024).toFixed(2)}MB`
    );
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(
      `不支持的文件类型。支持的类型：${allowedTypes.join(", ")}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateFiles(
  files: File[],
  options: FileValidationOptions = {}
): FileValidationResult {
  const errors: string[] = [];
  const { maxFiles = 10 } = options;

  // Check file count
  if (files.length > maxFiles) {
    errors.push(`最多只能上传 ${maxFiles} 个文件`);
  }

  // Validate each file
  files.forEach((file, index) => {
    const result = validateFile(file, options);
    if (!result.valid) {
      errors.push(`文件 ${index + 1}: ${result.errors.join(", ")}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

## React Upload Component

### 1. Upload Hook

```tsx
// packages/hooks/src/useFileUpload.ts
import { useState, useCallback } from "react";
import { uploadService } from "@repo/services";
import { validateFile } from "@repo/utils";
import toast from "react-hot-toast";

interface UseFileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(
    async (file: File) => {
      // Validate file
      const validation = validateFile(file, {
        maxSize: options.maxSize,
        allowedTypes: options.allowedTypes,
      });

      if (!validation.valid) {
        const error = new Error(validation.errors.join(", "));
        options.onError?.(error);
        toast.error(error.message);
        return;
      }

      try {
        setUploading(true);
        setProgress(0);

        const result = await uploadService.uploadFile(file, (prog) => {
          setProgress(prog);
        });

        options.onSuccess?.(result.url);
        toast.success("上传成功");
        return result;
      } catch (error) {
        const err = error as Error;
        options.onError?.(err);
        toast.error(err.message || "上传失败");
        throw error;
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [options]
  );

  return {
    upload,
    uploading,
    progress,
  };
}
```

### 2. Upload Component

```tsx
// apps/web/app/components/FileUpload.tsx
import { useRef, useState } from "react";
import { useFileUpload } from "@repo/hooks";

interface FileUploadProps {
  onUploadComplete?: (url: string) => void;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
}

export function FileUpload({
  onUploadComplete,
  accept = "image/*",
  maxSize = 10 * 1024 * 1024,
  multiple = false,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { upload, uploading, progress } = useFileUpload({
    maxSize,
    allowedTypes: accept.includes("image") ? ["image/jpeg", "image/png"] : undefined,
    onSuccess: (url) => {
      onUploadComplete?.(url);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    await upload(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      await upload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-[var(--color-primary)] transition-colors"
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />

      {preview ? (
        <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded" />
      ) : (
        <div>
          <p className="text-[var(--color-text-secondary)]">
            点击或拖拽文件到此处上传
          </p>
        </div>
      )}

      {uploading && (
        <div className="mt-4">
          <div className="w-full bg-[var(--color-bg-secondary)] rounded-full h-2">
            <div
              className="bg-[var(--color-primary)] h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">
            {Math.round(progress)}%
          </p>
        </div>
      )}
    </div>
  );
}
```

## Image Upload with Compression

### 1. Image Compression

```typescript
// packages/utils/src/image-compression.ts
export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  maxSize?: number; // bytes
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    maxSize = 2 * 1024 * 1024, // 2MB
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            // If still too large, reduce quality
            if (blob.size > maxSize && quality > 0.5) {
              compressImage(file, { ...options, quality: quality - 0.1 })
                .then(resolve)
                .catch(reject);
            } else {
              resolve(new File([blob], file.name, { type: file.type }));
            }
          },
          file.type,
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
```

### 2. Usage

```tsx
import { compressImage } from "@repo/utils";
import { useFileUpload } from "@repo/hooks";

export function ImageUpload() {
  const { upload, uploading } = useFileUpload();

  const handleUpload = async (file: File) => {
    // Compress image before upload
    const compressed = await compressImage(file, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.8,
      maxSize: 2 * 1024 * 1024,
    });

    await upload(compressed);
  };

  return <FileUpload onUploadComplete={handleUpload} />;
}
```

## Best Practices

### ✅ Good Practices

- Validate file type and size before upload
- Show upload progress
- Compress images before upload
- Handle errors gracefully
- Provide file preview
- Support drag and drop
- Use FormData for multipart uploads
- Set appropriate file size limits

### ❌ Anti-Patterns

- Don't skip file validation
- Don't ignore upload errors
- Don't upload without progress feedback
- Don't upload large files without compression
- Don't store files in base64
- Don't skip error handling

## Related Rules

- API Structure: `.cursor/rules/06-API结构.mdc`
- Security: `.cursor/rules/21-安全规范.mdc`
