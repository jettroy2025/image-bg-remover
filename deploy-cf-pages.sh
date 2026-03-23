#!/bin/bash

# Cloudflare Pages 自动部署脚本
# 使用 API Token 和 Account ID 创建项目并连接 GitHub

CF_API_TOKEN="cfut_5YMspl70b8gMtPBcmR497rGX17BOCoybE20LWNzFdebfdfb7"
CF_ACCOUNT_ID="22e7ed16c414a66c0ae19d80fc16373b"
PROJECT_NAME="image-bg-remover"
REPO_NAME="geek002/image-bg-remover"  # 需要替换为实际仓库

echo "🚀 开始创建 Cloudflare Pages 项目..."

# 1. 创建 Pages 项目
echo "📦 创建项目: $PROJECT_NAME"
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$PROJECT_NAME\",
    \"production_branch\": \"main\",
    \"build_config\": {
      \"build_command\": \"npm run build\",
      \"destination_dir\": \"dist\",
      \"root_dir\": \"\",
      \"web_analytics_tag\": null,
      \"web_analytics_token\": null
    },
    \"source\": {
      \"type\": \"github\",
      \"config\": {
        \"owner\": \"geek002\",
        \"repo_name\": \"image-bg-remover\",
        \"production_branch\": \"main\",
        \"pr_comments_enabled\": true,
        \"deployments_enabled\": true
      }
    }
  }"

echo ""
echo "✅ 项目创建完成！"
echo ""
echo "⚠️ 注意：首次连接 GitHub 需要手动授权"
echo "请访问 Cloudflare Dashboard 完成 GitHub 授权:"
echo "https://dash.cloudflare.com/$CF_ACCOUNT_ID/pages/$PROJECT_NAME"
