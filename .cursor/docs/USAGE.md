# Ant Design LLMs.txt 使用指南

本文档说明如何在 Cursor 中使用 Ant Design 的 LLMs.txt 文档。

## 📚 文档位置

- **文档文件**：`.cursor/docs/ant-design-llms.txt`
- **来源**：https://ant.design/llms.txt

## 🚀 使用方法

### 方法 1：在 Cursor 聊天中直接引用（推荐）

在 Cursor 的聊天框中输入：

```
@Docs ant-design-llms.txt
```

或者使用完整路径：

```
@Docs .cursor/docs/ant-design-llms.txt
```

然后继续提问，例如：

```
@Docs ant-design-llms.txt 如何使用 Ant Design 的 Form 组件创建一个登录表单？
```

### 方法 2：结合代码上下文使用

如果你正在编写代码，可以：

1. **选中相关代码**
2. **在聊天中输入**：`@Docs ant-design-llms.txt` + 你的问题
3. Cursor 会结合代码上下文和文档内容提供建议

**示例**：

```
@Docs ant-design-llms.txt 这段代码如何用 Ant Design 的 Form 组件重构？
[你的代码]
```

### 方法 3：在代码编写时使用

当需要 Ant Design 相关帮助时：

1. 在聊天中输入你的问题
2. 使用 `@Docs` 引用文档
3. Cursor 会基于文档提供更准确的建议

**示例**：

```
@Docs ant-design-llms.txt 创建一个使用 Ant Design Table 组件的示例，包含分页和排序功能
```

## 💡 实际使用示例

### 示例 1：询问组件用法

```
@Docs ant-design-llms.txt 如何使用 Ant Design 的 Table 组件实现数据展示和分页？
```

### 示例 2：询问设计规范

```
@Docs ant-design-llms.txt Ant Design 的表单设计规范是什么？
```

### 示例 3：询问最佳实践

```
@Docs ant-design-llms.txt 在 Ant Design 中如何处理表单验证和错误提示？
```

### 示例 4：代码重构建议

```
@Docs ant-design-llms.txt 如何将这段代码改为使用 Ant Design 的组件？

const MyForm = () => {
  return (
    <form>
      <input type="text" />
      <button>提交</button>
    </form>
  );
};
```

## 🎯 使用场景

### 1. 学习 Ant Design 组件

当你需要了解某个组件的用法时：

```
@Docs ant-design-llms.txt Ant Design 的 DatePicker 组件如何使用？
```

### 2. 参考设计规范

当你需要了解设计规范时：

```
@Docs ant-design-llms.txt Ant Design 的布局设计规范是什么？
```

### 3. 代码生成

当你需要生成使用 Ant Design 的代码时：

```
@Docs ant-design-llms.txt 创建一个使用 Ant Design 的完整表单页面，包含验证和提交功能
```

### 4. 问题排查

当你遇到 Ant Design 相关问题时：

```
@Docs ant-design-llms.txt Ant Design 的 Form 组件为什么无法提交？
```

## ⚠️ 注意事项

1. **文档位置**：确保文档文件存在于 `.cursor/docs/ant-design-llms.txt`
2. **文件命名**：使用 `ant-design-llms.txt` 作为文件名，便于识别
3. **更新文档**：定期从 https://ant.design/llms.txt 更新文档内容

## 🔄 更新文档

如需更新到最新版本：

1. 访问 https://ant.design/llms.txt
2. 复制最新内容
3. 替换 `.cursor/docs/ant-design-llms.txt` 文件内容

## 📖 相关资源

- [Ant Design 官方文档](https://ant.design/)
- [Ant Design LLMs.txt 说明](https://ant.design/docs/react/llms-cn)
- [Cursor @Docs 功能文档](https://cursor.com/docs)

## 🎨 优势

使用 LLMs.txt 文档后，Cursor AI 能够：

- ✅ **更准确的组件建议**：理解 Ant Design 的 API 和使用方式
- ✅ **完整的设计规范**：了解 Ant Design 的设计理念和最佳实践
- ✅ **更好的代码生成**：生成符合 Ant Design 规范的代码
- ✅ **问题排查**：帮助解决 Ant Design 相关的问题
