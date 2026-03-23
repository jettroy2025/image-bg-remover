# 创建 Cloudflare API Token 步骤

## 1. 登录 Cloudflare Dashboard
访问: https://dash.cloudflare.com

## 2. 创建 API Token
1. 点击右上角头像 → "My Profile"
2. 左侧菜单选择 "API Tokens"
3. 点击 "Create Token"
4. 选择 "Custom token"

## 3. 配置权限
填写以下信息：
- **Token name**: Pages Deploy
- **Permissions**:
  - Cloudflare Pages: Edit
  - Account: Read
  - Zone: Read (如果需要自定义域名)
- **Account Resources**: Include - 你的账号
- **Zone Resources**: Include - All zones (或指定域名)

## 4. 生成 Token
点击 "Continue to summary" → "Create Token"

## 5. 获取 Account ID
在 Cloudflare Dashboard 任意页面，右侧边栏能看到 "Account ID"

## 6. 发给我
把生成的 API Token 和 Account ID 发给我，我重新创建项目。
