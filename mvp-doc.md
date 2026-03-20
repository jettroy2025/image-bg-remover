# Image Background Remover - MVP 需求文档

## 1. 产品定位

### 目标用户
- **电商卖家** — 快速处理产品图，去背景做白底图
- **设计师** — 快速抠图，节省手动时间
- **社交媒体运营** — 制作头像、封面图
- **普通用户** — 简单快速的图片处理需求

### 核心价值
- **快** — 3秒出图，无需等待
- **简单** — 上传即用，无需学习
- **免费起步** — 基础功能免费，降低使用门槛

---

## 2. 核心功能

### MVP 功能清单
| 功能 | 优先级 | 说明 |
|------|--------|------|
| 图片上传 | P0 | 支持拖拽、点击上传，格式：JPG/PNG |
| AI 背景移除 | P0 | 调用 Remove.bg API，自动识别主体 |
| 预览对比 | P0 | 原图 vs 去背景图，左右对比 |
| 下载结果 | P0 | 支持 PNG（透明背景）下载 |
| 格式转换 | P1 | 输出 JPG/PNG 可选 |
| 历史记录 | P2 | 本次会话的处理记录 |

### 功能边界（MVP不做）
- 批量处理（后续版本）
- 手动调整边缘（后续版本）
- 更换背景颜色（后续版本）
- 用户注册/登录（后续版本）

---

## 3. 技术方案

### 技术栈
```
前端：Next.js 14 + Tailwind CSS
部署：Vercel（免费，全球CDN）
AI服务：Remove.bg API（免费50张/月）
存储：无（纯内存处理，不存用户图片）
```

### 架构流程
```
用户上传图片 → 前端转Base64 → 调用Remove.bg API → 
返回透明背景图 → 前端展示 → 用户下载
```

### API 设计
```
POST /api/remove-bg
Request:
  - image: File (multipart) 或 base64
Response:
  - processedImage: base64
  - status: "success" | "error"
  - message: 错误信息（如有）
```

---

## 4. 用户流程

### 主流程
1. 打开网站 → 看到上传区域
2. 上传图片 → 显示处理中动画
3. 处理完成 → 展示对比图（原图 vs 去背景）
4. 点击下载 → 保存 PNG 图片

### 异常处理
| 场景 | 处理方式 |
|------|----------|
| 上传失败 | 提示"请重新上传"，保留原图 |
| API 失败 | 提示"处理失败，请重试" |
| 文件过大 | 提示"图片需小于 5MB" |
| 格式不支持 | 提示"请上传 JPG/PNG 格式" |

---

## 5. 界面设计

### 页面结构
```
┌─────────────────────────────────────┐
│  Logo + 标题：Image Background      │
│  Remover（简洁大气）                 │
├─────────────────────────────────────┤
│                                     │
│     ┌───────────────────────┐      │
│     │                       │      │
│     │    上传区域（拖拽/    │      │
│     │    点击，大图标）     │      │
│     │                       │      │
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

### 设计原则
- **极简** — 只有一个上传按钮，无干扰
- **快速反馈** — 上传后立即处理，3秒内出结果
- **对比明显** — 原图和结果左右对比，效果直观

---

## 6. 开发计划

### 5天完成MVP

| 天数 | 任务 | 产出 |
|------|------|------|
| Day 1 | 项目初始化 + 基础页面 | 可运行的空壳页面 |
| Day 2 | 上传功能 + 图片预览 | 能上传并预览图片 |
| Day 3 | 对接 Remove.bg API | 能处理并显示结果 |
| Day 4 | 下载功能 + 异常处理 | 完整可用版本 |
| Day 5 | 部署 + 测试 + 优化 | 上线版本 |

---

## 7. 成本预估

### 开发期成本（每月）
| 项目 | 费用 | 说明 |
|------|------|------|
| Vercel 部署 | $0 | 免费额度够用 |
| Remove.bg API | $0 | 免费50张/月 |
| 域名 | $10-15 | .com/.io 域名 |
| **总计** | **$10-15/月** | 约 ¥70-100 |

### 后续扩展成本
- 如需更多 API 调用：Remove.bg 付费计划 $0.09/张
- 如需存储用户图片：Cloudflare R2 / AWS S3

---

## 8. 商业化策略

### 免费版（MVP）
- 基础去背景功能
- 标准分辨率输出
- 每月50张额度

### Pro 版（后续）
- 高清分辨率输出
- 批量处理
- 手动调整边缘
- 更换背景颜色
- 去除水印

### 变现路径
1. **广告** — 免费用户展示广告
2. **订阅** — Pro 版月费/年费
3. **按量付费** — 超出免费额度后收费

---

## 9. 技术风险与应对

| 风险 | 影响 | 应对方案 |
|------|------|----------|
| Remove.bg API 限流 | 高 | 实现重试机制，提示用户稍后再试 |
| API 服务不可用 | 高 | 备选方案：集成其他去背景API |
| 大图片处理超时 | 中 | 限制上传大小（<5MB），压缩处理 |
| 浏览器兼容性问题 | 低 | 测试主流浏览器，降级处理 |

---

## 10. 代码示例

### 前端上传组件
```jsx
// components/ImageUploader.jsx
export default function ImageUploader({ onUpload }) {
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    onUpload(file);
  };

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center"
    >
      <p>拖拽图片到这里，或点击上传</p>
      <input 
        type="file" 
        accept="image/*"
        onChange={(e) => onUpload(e.target.files[0])}
      />
    </div>
  );
}
```

### API 路由
```javascript
// app/api/remove-bg/route.js
export async function POST(request) {
  const formData = await request.formData();
  const image = formData.get('image');
  
  // 调用 Remove.bg API
  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': process.env.REMOVE_BG_API_KEY,
    },
    body: formData,
  });
  
  const result = await response.blob();
  return new Response(result);
}
```

---

## 关键亮点 🔥

1. **纯内存处理** — 无存储成本，无隐私泄露风险
2. **5天开发周期** — 快速上线验证市场需求
3. **低成本启动** — 月成本 $10-15，约 ¥70-100
4. **全球CDN加速** — Vercel 自动部署到全球节点

---

## 下一步选项

1. **开始写代码** — 我帮你初始化项目，今晚出Demo
2. **修改需求** — 有什么要调整的？
3. **准备 API Key** — 去 Remove.bg 注册获取免费Key

强哥，选哪个？还是直接开始？

---
*文档创建时间：2026-03-20*
*版本：MVP v1.0*
