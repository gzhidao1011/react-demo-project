# 中文提交信息生成配置说明

## 问题说明

Cursor 的内置 `cursor.generateGitCommitMessage` 命令默认生成**英文**提交信息，但项目规范要求：

- ✅ **类型（type）使用英文**：`feat`, `fix`, `docs` 等
- ✅ **描述（subject）使用中文**：如 "添加功能", "修复问题"
- ✅ **使用祈使语气，现在时**

## 解决方案

已将快捷键配置修改为打开 Cursor 聊天并自动输入提示，这样 AI 会使用 `generate-commit-message` 技能生成符合项目规范的中文提交信息。

## 配置详情

### 快捷键配置（`.vscode/keybindings.json`）

```json
{
  "key": "ctrl+m",
  "command": "workbench.action.chat.open",
  "args": {
    "query": "请使用 generate-commit-message 技能生成符合项目规范的中文提交信息。规范要求：类型使用英文（feat/fix/docs等），描述使用中文，祈使语气。"
  },
  "when": "scmRepository"
}
```

### 工作原理

1. **按 `Ctrl+M`** → 打开 Cursor 聊天
2. **自动输入提示** → AI 收到生成中文提交信息的请求
3. **AI 使用技能** → 自动调用 `generate-commit-message` 技能
4. **分析暂存文件** → AI 分析 Git 暂存的更改
5. **生成中文提交信息** → 符合项目规范（类型英文，描述中文）

## 使用方法

1. **暂存文件**：
   ```bash
   git add <文件>
   # 或在 Source Control 面板中暂存文件
   ```

2. **按 `Ctrl+M`**：
   - Cursor 聊天会自动打开
   - 已自动输入生成提交信息的提示

3. **等待 AI 生成**：
   - AI 会分析暂存的更改
   - 生成符合规范的中文提交信息

4. **复制并提交**：
   - 复制 AI 生成的提交信息
   - 粘贴到 Source Control 面板的提交消息输入框
   - 根据需要编辑后提交

## 示例

### 输入（暂存的文件）
- `.vscode/keybindings.json` - 修改快捷键配置
- `.vscode/KEYBINDINGS_README.md` - 更新使用说明

### 输出（AI 生成的中文提交信息）
```
docs(vscode): 更新快捷键配置为生成中文提交信息

- 修改快捷键配置，使用聊天方式生成提交信息
- 更新使用说明文档，说明中文提交信息的要求
```

## 为什么这样配置？

### 方案对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| **直接命令** (`cursor.generateGitCommitMessage`) | 快速，直接填充到输入框 | ❌ 生成英文提交信息 |
| **聊天方式** (`workbench.action.chat.open`) | ✅ 生成中文提交信息，符合项目规范 | 需要手动复制粘贴 |

### 选择聊天方式的原因

1. **符合项目规范**：确保生成中文描述
2. **使用项目技能**：自动调用 `generate-commit-message` 技能
3. **可编辑**：生成后可以进一步编辑优化
4. **学习项目规范**：AI 会参考项目的提交规范文档

## 相关文档

- Git 提交规范：`.cursor/rules/08-Git提交规范.mdc`
- 生成提交信息技能：`.cursor/skills/generate-commit-message/SKILL.md`
- 快捷键配置：`.vscode/keybindings.json`
- 使用说明：`.vscode/KEYBINDINGS_README.md`

## 故障排除

### 问题：快捷键无反应

**解决方法**：
1. 确保在 Git 仓库中
2. 检查快捷键是否被其他扩展占用
3. 重新加载窗口：`Ctrl+Shift+P` → "Developer: Reload Window"

### 问题：AI 仍然生成英文

**解决方法**：
1. 在聊天中明确说明："请使用中文生成提交信息"
2. 或者直接说："生成提交信息"（AI 会自动使用技能）

### 问题：命令不存在

**解决方法**：
1. 更新 Cursor 到最新版本
2. 检查命令：`Ctrl+Shift+P` → 搜索 "workbench.action.chat.open"
