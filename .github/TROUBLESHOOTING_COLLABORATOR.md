# 协作者权限设置故障排除

本文档说明在设置协作者权限时可能遇到的问题和解决方案。

## ❓ 问题：GitHub 页面没有显示权限下拉菜单

### 可能原因和解决方案

#### 原因 1：个人账户私有仓库的限制

**现象**：
- 添加协作者时，没有权限选择菜单
- 协作者列表中没有权限下拉菜单
- 默认权限可能是 **Read**

**解决方案**：

**方法 A：移除后重新添加（推荐）**

1. 进入 **Settings** → **Collaborators**
2. 找到协作者，点击右侧的 **X** 或 **Remove** 按钮
3. 确认移除
4. 点击 **Add people**
5. 输入用户名并添加
6. **添加后立即检查权限**：
   - 如果显示为 **Read**，需要联系 GitHub 支持或使用组织账户

**方法 B：使用 GitHub CLI（高级）**

如果 GitHub Web 界面不支持权限修改，可以使用 GitHub CLI：

```bash
# 安装 GitHub CLI（如果未安装）
# Windows: winget install GitHub.cli
# Mac: brew install gh
# Linux: 参考官方文档

# 登录 GitHub CLI
gh auth login

# 查看当前协作者权限
gh api repos/:owner/:repo/collaborators/:username --jq '.permissions'

# 注意：个人账户的私有仓库可能不支持通过 API 修改权限
```

**方法 C：升级到组织账户**

个人账户的私有仓库对协作者权限有限制：
- ✅ 可以添加协作者
- ❌ 权限级别可能无法修改
- ❌ 默认权限可能是 **Read**

**解决方案**：
- 将仓库转移到 GitHub 组织账户
- 或升级到 GitHub Team/Enterprise

#### 原因 2：界面位置不同

**现象**：
- 权限设置可能在添加时显示，而不是在列表中

**解决方案**：

1. **添加时选择权限**：
   - 点击 **Add people**
   - 输入用户名
   - **在添加对话框中查找权限选择**
   - 可能显示为下拉菜单或单选按钮

2. **查看协作者详情**：
   - 点击协作者名称
   - 查看详细信息页面
   - 可能在那里可以修改权限

#### 原因 3：浏览器缓存问题

**现象**：
- 界面显示异常
- 按钮或菜单不显示

**解决方案**：

1. **清除浏览器缓存**：
   - 按 `Ctrl + Shift + Delete`（Windows）
   - 或 `Cmd + Shift + Delete`（Mac）
   - 清除缓存和 Cookie

2. **使用无痕模式**：
   - 打开浏览器的无痕/隐私模式
   - 重新访问 GitHub

3. **尝试其他浏览器**：
   - Chrome、Firefox、Edge 等

#### 原因 4：GitHub 界面更新

**现象**：
- 界面布局与文档描述不同
- 功能位置发生变化

**解决方案**：

1. **查找新位置**：
   - 权限设置可能在 **Settings** → **Access** 或 **People**
   - 或直接在协作者列表中点击用户名

2. **查看 GitHub 帮助文档**：
   - 访问：https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/managing-teams-and-people-with-access-to-your-repository

## 🔍 如何确认当前权限

### 方法 1：在协作者列表中查看

1. 进入 **Settings** → **Collaborators**
2. 查看协作者列表
3. 权限可能显示为：
   - 文本标签（Read、Write、Admin 等）
   - 图标
   - 或在用户名旁边

### 方法 2：查看协作者详情

1. 点击协作者名称
2. 查看详细信息页面
3. 权限信息应该在那里显示

### 方法 3：让协作者自己查看

协作者可以：
1. 打开仓库页面
2. 点击右上角的 **Settings**（个人设置）
3. 查看 **Access** 部分
4. 查看自己的权限级别

## 🛠️ 替代方案

### 方案 1：使用 CODEOWNERS 分配审查者

即使无法修改权限级别，也可以通过 CODEOWNERS 让协作者参与审查：

1. 编辑 `.github/CODEOWNERS` 文件
2. 添加协作者为审查者：
   ```codeowners
   * @gzhidao1011 @dujiaoai
   ```
3. 协作者可以审查 PR，但不能合并（如果权限是 Read）

### 方案 2：创建 GitHub 组织

**优势**：
- ✅ 完整的权限管理功能
- ✅ 可以设置详细的权限级别
- ✅ 可以管理团队和权限

**步骤**：
1. 创建 GitHub 组织
2. 将仓库转移到组织
3. 在组织中管理协作者权限

### 方案 3：使用分支保护规则

即使权限是 Read，也可以通过以下方式控制合并：

1. 配置分支保护规则（如果仓库是公开的）
2. 要求审查者审批
3. 只有获得审批的 PR 才能合并

**注意**：个人账户的私有仓库不支持分支保护规则。

## 📋 检查清单

如果无法修改权限，请检查：

- [ ] 仓库类型：个人账户私有仓库 vs 组织账户
- [ ] 账户类型：个人账户 vs GitHub Team/Enterprise
- [ ] 浏览器：尝试清除缓存或使用其他浏览器
- [ ] GitHub 界面：查看是否有更新或变化
- [ ] 协作者状态：确认协作者已接受邀请

## 🔧 实际操作步骤（针对个人账户私有仓库）

### 步骤 1：添加协作者

1. **Settings** → **Collaborators**
2. 点击 **Add people**
3. 输入用户名
4. 添加（可能没有权限选择）

### 步骤 2：确认权限

1. 查看协作者列表
2. 确认显示的权限级别
3. 如果是 **Read**，这是个人账户私有仓库的限制

### 步骤 3：替代方案

如果权限无法修改为 Write：

1. **使用 CODEOWNERS**：
   - 让协作者参与审查
   - 但不能合并 PR

2. **手动合并**：
   - 协作者创建 PR
   - 仓库所有者审查和合并

3. **升级账户**：
   - 考虑升级到 GitHub Team
   - 或创建组织账户

## 📚 相关资源

- [GitHub 协作者权限文档](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/managing-teams-and-people-with-access-to-your-repository)
- [GitHub 组织 vs 个人账户](https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/about-organizations)
- [添加协作者指南](./ADD_COLLABORATOR.md)

## 💡 建议

### 对于个人账户私有仓库

1. ✅ **接受限制**：个人账户私有仓库的权限管理有限
2. ✅ **使用 CODEOWNERS**：通过 CODEOWNERS 分配审查者
3. ✅ **手动管理**：重要操作由仓库所有者执行
4. ✅ **考虑升级**：如果需要完整权限管理，考虑升级到组织账户

### 对于组织账户

1. ✅ **完整权限管理**：可以设置详细的权限级别
2. ✅ **团队管理**：可以创建团队并分配权限
3. ✅ **分支保护**：可以配置分支保护规则

## ❓ 常见问题

### Q: 为什么个人账户私有仓库没有权限下拉菜单？

**A**: 这是 GitHub 的限制。个人账户的私有仓库对协作者权限管理有限，默认权限通常是 Read，且可能无法修改。

### Q: 如何让协作者合并 PR？

**A**: 
- 如果是个人账户私有仓库：可能需要仓库所有者手动合并
- 如果是组织账户：授予 Write 权限即可

### Q: 可以联系 GitHub 支持修改权限吗？

**A**: 
- 个人账户的限制是平台限制，不是 bug
- 如果需要完整权限管理，建议升级到组织账户或 GitHub Team

### Q: 组织账户是免费的吗？

**A**: 
- GitHub 组织账户本身是免费的
- 但某些高级功能（如私有仓库的完整权限管理）可能需要付费计划
