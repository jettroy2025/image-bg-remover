# Image Background Remover - 产品需求文档 (PRD)

## 文档信息
- **项目名称**: Image Background Remover (AI智能抠图工具)
- **版本**: v1.0
- **创建日期**: 2026-03-24
- **作者**: 强哥
- **项目来源**: 哥飞社群实践 - 出海工具站

---

## 1. 项目概述

### 1.1 项目背景
本项目源于哥飞社群的出海实践，目标是开发一个简单、快速、免费的在线AI抠图工具，面向全球用户提供图片背景移除服务。

### 1.2 目标用户
| 用户类型 | 需求场景 | 使用频率 |
|---------|---------|---------|
| 电商卖家 | 快速处理产品图，制作白底图 | 高频 |
| 设计师 | 快速抠图，节省手动PS时间 | 中频 |
| 社交媒体运营 | 制作头像、封面图、营销素材 | 中频 |
| 普通用户 | 简单快速的图片处理需求 | 低频 |

### 1.3 核心价值主张
- **快** — 3秒出图，无需等待
- **简单** — 上传即用，零学习成本
- **免费起步** — 基础功能免费，降低使用门槛
- **隐私安全** — 纯内存处理，图片不保存到服务器

---

## 2. 开发历程回顾

### 2.1 开发时间线

| 日期 | 里程碑 | 关键产出 |
|-----|-------|---------|
| 2026-03-19 | 需求讨论 | 确定产品方向和MVP范围 |
| 2026-03-20 | 项目启动 | 初始化Next.js项目，完成MVP文档 |
| 2026-03-23 | 功能开发 | 完成核心抠图功能，对接Remove.bg API |
| 2026-03-23 | 部署配置 | 配置Cloudflare Pages部署方案 |
| 2026-03-24 | 上线验证 | 网站可正常访问，功能验证通过 |

### 2.2 Git提交记录
```
d6349c7 Fix next.config for deployment
e63ab52 Add Cloudflare Pages deployment config
043be16 Add image background remover feature with Remove.bg API integration
02e3c8b Initial commit: Next.js 14 setup
```

---

## 3. 功能迭代记录

### 3.1 MVP功能清单 (v1.0)

| 功能模块 | 功能描述 | 优先级 | 状态 |
|---------|---------|-------|------|
| 图片上传 | 支持拖拽、点击上传，格式JPG/PNG | P0 | ✅ 已完成 |
| AI背景移除 | 调用Remove.bg API，自动识别主体 | P0 | ✅ 已完成 |
| 预览对比 | 原图vs去背景图，左右对比展示 | P0 | ✅ 已完成 |
| 下载结果 | 支持PNG（透明背景）格式下载 | P0 | ✅ 已完成 |
| 文件验证 | 格式检查、大小限制（5MB） | P1 | ✅ 已完成 |
| 错误处理 | 上传失败、API失败等异常提示 | P1 | ✅ 已完成 |

### 3.2 功能边界（MVP不做）
- ❌ 批量处理（后续版本）
- ❌ 手动调整边缘（后续版本）
- ❌ 更换背景颜色（后续版本）
- ❌ 用户注册/登录（后续版本）
- ❌ 历史记录持久化（后续版本）

---

## 4. 技术架构

### 4.1 技术栈
```
前端框架: Next.js 14 (React 18)
样式方案: Tailwind CSS
语言: TypeScript
部署平台: Cloudflare Pages
AI服务: Remove.bg API
```

### 4.2 项目结构
```
image-bg-remover/
├── src/
│   └── app/
│       ├── page.tsx          # 主页面组件
│       ├── layout.tsx        # 根布局
│       └── api/
│           └── remove-bg/
│               └── route.ts  # API路由（开发环境）
├── functions/
│   └── api/
│       └── remove-bg/
│           └── index.js      # Cloudflare Worker函数
├── dist/                     # 构建输出目录
├── next.config.js            # Next.js配置
├── mvp-doc.md               # MVP需求文档
└── deploy-cf-pages.sh       # 部署脚本
```

### 4.3 数据流架构
```
用户上传图片
    ↓
前端转Base64/FormData
    ↓
调用 /api/remove-bg
    ↓
Cloudflare Worker 转发
    ↓
Remove.bg API 处理
    ↓
返回透明背景图(Base64)
    ↓
前端展示对比结果
    ↓
用户下载PNG
```

### 4.4 API设计

**Endpoint**: `POST /api/remove-bg`

**Request**:
```typescript
{
  image: File  // multipart/form-data
}
```

**Response**:
```typescript
{
  success: boolean,
  image: string,  // data:image/png;base64,...
  error?: string
}
```

---

## 5. 开发过程中的关键问题与解决方案

### 5.1 问题清单

| 序号 | 问题描述 | 影响 | 解决方案 | 状态 |
|-----|---------|------|---------|------|
| 1 | Next.js API路由在Cloudflare Pages静态导出时不工作 | 高 | 使用Cloudflare Functions重写API逻辑 | ✅ 已解决 |
| 2 | 部署配置需要适配静态导出模式 | 中 | 配置`output: 'export'`和`distDir: 'dist'` | ✅ 已解决 |
| 3 | Remove.bg API Key环境变量管理 | 中 | 使用Cloudflare Pages的环境变量配置 | ✅ 已解决 |
| 4 | Base64编码在Worker环境中的实现 | 低 | 自定义`arrayBufferToBase64`函数 | ✅ 已解决 |
| 5 | GitHub仓库连接和自动部署配置 | 中 | 创建部署脚本，使用API Token | ✅ 已解决 |

### 5.2 技术难点详解

#### 难点1: 静态导出与API路由的冲突
**问题**: Next.js的`output: 'export'`模式不支持API路由，但抠图功能需要后端处理

**解决方案**: 
- 开发环境使用Next.js API路由 (`src/app/api/remove-bg/route.ts`)
- 生产环境使用Cloudflare Functions (`functions/api/remove-bg/index.js`)
- 保持两者接口一致，便于维护

#### 难点2: Cloudflare Worker环境差异
**问题**: Worker环境没有Node.js的Buffer API

**解决方案**:
```javascript
// 自定义Base64编码函数
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
```

---

## 6. 部署方案

### 6.1 部署平台: Cloudflare Pages

**选择理由**:
- ✅ 免费额度充足
- ✅ 全球CDN加速
- ✅ 原生支持Edge Functions
- ✅ 与GitHub集成，自动部署

### 6.2 部署配置
```javascript
// next.config.js
const nextConfig = {
  output: 'export',
  distDir: 'dist',
};
```

### 6.3 环境变量
| 变量名 | 说明 | 获取方式 |
|-------|------|---------|
| REMOVE_BG_API_KEY | Remove.bg API密钥 | https://www.remove.bg/api |

---

## 7. 成本分析

### 7.1 开发期成本（每月）
| 项目 | 费用 | 说明 |
|-----|------|------|
| Cloudflare Pages | $0 | 免费额度够用 |
| Remove.bg API | $0 | 免费50张/月 |
| 域名 | $10-15 | .com/.io域名（可选） |
| **总计** | **$0-15/月** | 约 ¥0-100 |

### 7.2 后续扩展成本
- Remove.bg付费计划: $0.09/张
- Cloudflare Pro（如需）: $20/月

---

## 8. 商业化规划

### 8.1 免费版 (当前)
- 基础去背景功能
- 标准分辨率输出
- 每月50张额度（受限于Remove.bg免费额度）

### 8.2 Pro版规划
- 高清分辨率输出
- 批量处理
- 手动调整边缘
- 更换背景颜色
- 去除水印

### 8.3 变现路径
1. **广告** — 免费用户展示广告
2. **订阅** — Pro版月费/年费
3. **按量付费** — 超出免费额度后收费

---

## 9. 用户流程

### 9.1 主流程
```
1. 打开网站 → 看到上传区域
2. 上传图片 → 显示处理中动画
3. 处理完成 → 展示对比图（原图 vs 去背景）
4. 点击下载 → 保存PNG图片
5. 可选择处理新图片
```

### 9.2 异常流程
| 场景 | 处理方式 |
|-----|---------|
| 上传失败 | 提示"请重新上传"，保留原图 |
| API失败 | 提示"处理失败，请重试" |
| 文件过大 | 提示"图片需小于5MB" |
| 格式不支持 | 提示"请上传JPG/PNG格式" |
| API Key未配置 | 提示"服务配置错误" |

---

## 10. 界面设计规范

### 10.1 设计原则
- **极简** — 只有一个上传按钮，无干扰
- **快速反馈** — 上传后立即处理，3秒内出结果
- **对比明显** — 原图和结果左右对比，效果直观

### 10.2 页面结构
```
┌─────────────────────────────────────┐
│  Logo + 标题：Image Background      │
│  Remover（简洁大气）                 │
├─────────────────────────────────────┤
│                                     │
│     ┌───────────────────────┐      │
│     │    上传区域（拖拽/    │      │
│     │    点击，大图标）     │      │
│     └───────────────────────┘      │
│                                     │
├─────────────────────────────────────┤
│  对比区域（处理完成后显示）          │
│  ┌─────────────┐ ┌─────────────┐   │
│  │   原图      │ │  去背景图   │   │
│  └─────────────┘ └─────────────┘   │
│                                     │
│        [ 下载 PNG 按钮 ]            │
├─────────────────────────────────────┤
│  底部：隐私说明 + 使用条款           │
└─────────────────────────────────────┘
```

### 10.3 配色方案
- 主色调: Indigo (#4F46E5)
- 背景渐变: from-blue-50 to-indigo-100
- 成功色: Green
- 错误色: Red

---

## 11. 测试验证

### 11.1 功能测试
- [x] 图片上传（拖拽+点击）
- [x] 格式验证（JPG/PNG）
- [x] 大小限制（5MB）
- [x] AI抠图处理
- [x] 对比展示
- [x] PNG下载
- [x] 错误提示

### 11.2 兼容性测试
- [x] Chrome/Edge
- [x] Firefox
- [x] Safari
- [x] 移动端浏览器

---

## 12. 后续迭代计划

### 12.1 v1.1 计划
- [ ] 添加批量处理功能
- [ ] 支持更多输出格式（JPG/WebP）
- [ ] 添加图片压缩选项

### 12.2 v1.2 计划
- [ ] 手动调整边缘工具
- [ ] 更换背景颜色/图片
- [ ] 添加水印功能

### 12.3 v2.0 规划
- [ ] 用户系统（注册/登录）
- [ ] 历史记录云端存储
- [ ] 付费订阅系统
- [ ] 管理后台

---

## 13. 经验教训总结

### 13.1 成功经验
1. **MVP策略有效** — 5天完成核心功能，快速验证想法
2. **技术选型正确** — Next.js + Cloudflare Pages组合高效
3. **纯内存处理** — 避免存储成本，保护用户隐私

### 13.2 改进空间
1. **文档同步** — 开发过程中未及时更新memory文件
2. **测试覆盖** — 缺少自动化测试
3. **监控告警** — 未配置错误监控和性能监控

### 13.3 技术债务
1. API路由双份实现（Next.js + Cloudflare Functions）
2. 缺少类型定义共享
3. 部署脚本硬编码敏感信息

---

## 14. 附录

### 14.1 相关链接
- Remove.bg API文档: https://www.remove.bg/api
- Cloudflare Pages文档: https://developers.cloudflare.com/pages/
- Next.js文档: https://nextjs.org/docs

### 14.2 关键代码片段

**前端上传处理**:
```typescript
const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    setError('请上传图片文件 (JPG/PNG)');
    return;
  }

  // 验证文件大小 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    setError('图片大小不能超过 5MB');
    return;
  }

  // 显示原图预览并自动处理
  const reader = new FileReader();
  reader.onload = (event) => {
    setOriginalImage(event.target?.result as string);
  };
  reader.readAsDataURL(file);
  processImage(file);
}, []);
```

**Worker API处理**:
```javascript
export async function onRequestPost(context) {
  const { request, env } = context;
  
  const formData = await request.formData();
  const image = formData.get('image');

  // 调用Remove.bg API
  const apiFormData = new FormData();
  apiFormData.append('image_file', image);
  apiFormData.append('size', 'auto');

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': env.REMOVE_BG_API_KEY },
    body: apiFormData,
  });

  // 返回Base64图片
  const blob = await response.blob();
  const base64 = arrayBufferToBase64(await blob.arrayBuffer());
  
  return new Response(JSON.stringify({
    success: true,
    image: `data:image/png;base64,${base64}`,
  }));
}
```

---

## 文档变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|-----|------|---------|------|
| v1.0 | 2026-03-24 | 初始版本，完整记录MVP开发过程 | 强哥 |

---

**备注**: 本文档记录了Image Background Remover项目从需求到上线的完整过程，包括技术决策、问题解决方案和后续规划，供后续迭代参考。
