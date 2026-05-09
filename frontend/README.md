# 小智 ESP32 的 MCP 平台 - Frontend

前端基于 React + TypeScript + Vite，用于 MCP 服务市场与实例管理。

## 开发启动

```bash
npm install
npm run dev
```

默认地址：`http://localhost:5173`

## 后端联调

- 本项目使用 Vite 代理：`/api/* -> http://127.0.0.1:3005/*`
- 请先确保后端已启动（`backend` 目录下 `npm run dev`）

## 生产构建

```bash
npm run build
npm run preview
```

## 代码质量

```bash
npm run lint
```

## 目录说明

```text
src/
├── pages/        # 页面级组件
├── components/   # 通用组件
├── layouts/      # 布局组件
└── lib/          # 工具函数/配置
```

更多部署细节请查看仓库根目录 [`DEPLOY.md`](../DEPLOY.md)。
