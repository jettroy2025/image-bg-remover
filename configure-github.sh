#!/bin/bash

# 配置 Cloudflare Pages GitHub 集成
# 项目: image-bg-remover

CF_API_TOKEN="cfut_5YMspl70b8gMtPBcmR497rGX17BOCoybE20LWNzFdebfdfb7"
CF_ACCOUNT_ID="22e7ed16c414a66c0ae19d80fc16373b"
PROJECT_NAME="image-bg-remover"

echo "🔗 配置 GitHub 集成..."

# 更新项目配置，添加 GitHub 源
curl -X PATCH "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/$PROJECT_NAME" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"production_branch\": \"main\",
    \"build_config\": {
      \"build_command\": \"npm run build\",
      \"destination_dir\": \"dist\",
      \"root_dir\": \"\"
    }
  }"

echo ""
echo "✅ 项目配置已更新！"
echo ""
echo "📝 项目信息："
echo "   名称: $PROJECT_NAME"
echo "   域名: https://image-bg-remover-39l.pages.dev"
echo "   生产分支: main"
echo ""
echo "⚠️  GitHub 集成需要手动授权"
echo ""
echo "请访问以下链接完成 GitHub 连接："
echo "https://dash.cloudflare.com/$CF_ACCOUNT_ID/pages/$PROJECT_NAME"
echo ""
echo "步骤："
echo "1. 点击 'Connect Git repository' 或 'Continue with GitHub'"
echo "2. 授权 GitHub 访问"
echo "3. 选择你的 image-bg-remover 仓库"
echo "4. 点击 'Save and Deploy'"
echo ""
