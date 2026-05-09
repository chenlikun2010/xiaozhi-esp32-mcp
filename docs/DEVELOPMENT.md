# 开发文档（Development Guide）

本文档面向二次开发者，说明如何在本地快速启动与调试项目。

## 1. 环境要求

- Node.js >= 20
- npm >= 10
- MySQL >= 8

## 2. 克隆仓库

```bash
git clone https://github.com/chenlikun2010/xiaozhi-esp32-mcp.git
cd xiaozhi-esp32-mcp
```

## 3. 后端启动

```bash
cd backend
npm install
cp .env.example .env
npm run db:bootstrap
npm run dev
```

默认后端地址：`http://localhost:3005`

## 4. 前端启动

```bash
cd frontend
npm install
npm run dev
```

默认前端地址：`http://localhost:5173`

## 5. 质量检查

```bash
# frontend
cd frontend
npm run lint
npm run build

# backend
cd ../backend
npm run test
npm run build
```

## 6. 开发约定

- 开源版不包含知识库模块，请勿新增知识库入口。
- 新服务接入请优先复用现有 MCP 工具注册模式。
- 提交 PR 前请阅读：`docs/CONTRIBUTING.md`
