# 快捷键配置说明

## 生成提交信息快捷键

已配置 `Ctrl+M`（Windows/Linux）或 `Cmd+M`（Mac）快捷键来调用生成提交信息功能。

### ⚠️ 重要说明

**为什么使用聊天方式而不是直接命令？**

Cursor 的内置 `cursor.generateGitCommitMessage` 命令默认生成**英文**提交信息，但项目规范要求：
- ✅ 类型（type）使用英文：`feat`, `fix`, `docs` 等
- ✅ 描述（subject）使用**中文**：如 "添加功能", "修复问题"
- ✅ 使用祈使语气，现在时

因此，快捷键配置为打开 Cursor 聊天并自动输入提示，这样 AI 会使用 `generate-commit-message` 技能生成符合项目规范的中文提交信息。

### 使用方法

1. **确保有暂存的更改**：
   - 在 Source Control 面板中暂存（stage）要提交的文件
   - 或者使用 `git add` 命令暂存文件

2. **使用快捷键**：
   - 按 `Ctrl+M`（Windows/Linux）或 `Cmd+M`（Mac）
   - Cursor 聊天会自动打开，并已输入生成提交信息的提示

3. **AI 会自动生成提交信息**：
   - AI 会分析暂存的更改
   - 生成符合项目规范的中文提交信息（类型英文，描述中文）
   - 提交信息会显示在聊天中

4. **复制提交信息**：
   - 复制 AI 生成的提交信息
   - 粘贴到 Source Control 面板的提交消息输入框中
   - 根据需要编辑后提交

### 配置位置

快捷键配置位于 `.vscode/keybindings.json` 文件中：

```json
{
  "key": "ctrl+m",
  "command": "cursor.generateGitCommitMessage",
  "when": "scmRepository && !inputFocus"
}
```

### 配置说明

- **key**: 快捷键组合（`ctrl+m` 或 `cmd+m`）
- **command**: Cursor 的命令 ID（`cursor.generateGitCommitMessage`）
- **when**: 触发条件
  - `scmRepository`: 仅在 Git 仓库中生效
  - `!inputFocus`: 不在输入框中时生效（避免与输入冲突）

### 自定义快捷键

如果你想使用其他快捷键，可以：

1. 打开命令面板：`Ctrl+Shift+P`（Windows/Linux）或 `Cmd+Shift+P`（Mac）
2. 搜索 "Open Keyboard Shortcuts (JSON)"
3. 编辑 `.vscode/keybindings.json` 文件，修改 `key` 字段

### 注意事项

- 快捷键只在 Git 仓库中生效
- 需要先暂存文件才能生成提交信息
- 生成的提交信息遵循项目的 Conventional Commits 规范（见 `.cursor/rules/08-Git提交规范.mdc`）

### 相关文档

- Git 提交规范：`.cursor/rules/08-Git提交规范.mdc`
- 生成提交信息技能：`.cursor/skills/generate-commit-message/SKILL.md`
