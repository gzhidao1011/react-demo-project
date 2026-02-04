# 快捷键测试指南

## 测试场景已准备

已暂存以下文件用于测试：
- `.vscode/keybindings.json` - 快捷键配置文件
- `.vscode/KEYBINDINGS_README.md` - 使用说明文档

## 测试步骤

### 方法 1：使用快捷键测试

1. **打开 Source Control 面板**：
   - 点击左侧边栏的 Source Control 图标（或按 `Ctrl+Shift+G`）

2. **确认文件已暂存**：
   - 在 "Staged Changes" 区域应该能看到：
     - `.vscode/keybindings.json`
     - `.vscode/KEYBINDINGS_README.md`

3. **点击提交消息输入框**：
   - 在 Source Control 面板顶部找到提交消息输入框
   - 确保输入框获得焦点

4. **按快捷键 `Ctrl+M`**（Windows/Linux）或 `Cmd+M`（Mac）

5. **验证结果**：
   - ✅ **成功**：提交消息输入框中应该自动填充生成的提交信息
   - ❌ **失败**：如果没有反应，检查下面的故障排除步骤

### 方法 2：通过命令面板测试

如果快捷键不工作，可以通过命令面板测试：

1. **打开命令面板**：
   - 按 `Ctrl+Shift+P`（Windows/Linux）或 `Cmd+Shift+P`（Mac）

2. **搜索命令**：
   - 输入 "Generate Commit Message" 或 "cursor.generateGitCommitMessage"

3. **执行命令**：
   - 选择 "Cursor: Generate Git Commit Message" 命令

4. **验证结果**：
   - 提交消息输入框中应该自动填充生成的提交信息

## 预期结果

根据暂存的文件，应该生成类似这样的提交信息：

```
docs(vscode): 添加快捷键配置和使用说明

- 添加 Ctrl+M 快捷键配置用于生成提交信息
- 添加快捷键使用说明文档
```

## 故障排除

### 问题 1：快捷键无反应

**可能原因**：
- 快捷键被其他扩展占用
- 配置文件格式错误
- Cursor 未识别配置文件

**解决方法**：
1. 检查快捷键冲突：
   - 打开命令面板：`Ctrl+Shift+P`
   - 搜索 "Open Keyboard Shortcuts"
   - 搜索 `ctrl+m` 查看是否有冲突

2. 验证配置文件格式：
   ```bash
   # 检查 JSON 格式是否正确
   cat .vscode/keybindings.json | python -m json.tool
   ```

3. 重新加载窗口：
   - 按 `Ctrl+Shift+P`
   - 选择 "Developer: Reload Window"

### 问题 2：命令不存在

**可能原因**：
- Cursor 版本过旧
- 命令 ID 错误

**解决方法**：
1. 更新 Cursor 到最新版本
2. 检查命令是否存在：
   - 打开命令面板：`Ctrl+Shift+P`
   - 输入 "cursor.generate" 查看相关命令

### 问题 3：命令执行但无效果

**可能原因**：
- 没有暂存的文件
- 不在 Git 仓库中

**解决方法**：
1. 确保有暂存的文件：
   ```bash
   git status --short
   # 应该显示以 "A" 或 "M" 开头的文件
   ```

2. 确保在 Git 仓库中：
   ```bash
   git rev-parse --git-dir
   # 应该返回 .git 目录路径
   ```

## 验证配置

### 检查配置文件格式

```bash
# Windows PowerShell
Get-Content .vscode/keybindings.json | ConvertFrom-Json

# Linux/Mac
cat .vscode/keybindings.json | python -m json.tool
```

### 检查命令是否存在

1. 打开命令面板：`Ctrl+Shift+P`
2. 输入 ">Cursor: Generate Git Commit Message"
3. 如果能看到命令，说明命令存在

## 测试完成后

测试完成后，你可以：

1. **提交这些文件**（如果测试成功）：
   ```bash
   git commit -m "docs(vscode): 添加快捷键配置和使用说明"
   ```

2. **或者取消暂存**（如果需要修改）：
   ```bash
   git reset HEAD .vscode/
   ```

## 相关文档

- 快捷键配置：`.vscode/keybindings.json`
- 使用说明：`.vscode/KEYBINDINGS_README.md`
- Git 提交规范：`.cursor/rules/08-Git提交规范.mdc`
