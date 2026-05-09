# 小智 ESP32 的 MCP 平台

一个开源的 MCP（Model Context Protocol）服务管理平台，包含：

- 后端管理 API（用户、服务市场、实例管理）
- 前端管理面板（注册/登录、服务开通、实例启停）
- 可选的报告处理 Worker（PostgreSQL + 向量检索链路）

> 开源版已移除知识库功能，仅保留 MCP 管理核心能力。

---

## ✨ 功能概览

- 统一管理 MCP 服务目录（`mcp_service`）
- 用户实例创建、启动、停止、删除
- 登录注册、验证码、激活码等基础账号能力
- 管理员端用户与激活码管理

---

## 🧱 技术栈

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeORM + MySQL
- **Optional Worker**: Node.js + PostgreSQL + pgvector

---

## 📁 仓库结构

```text
.
├── frontend/     # Web 管理端
├── backend/      # 后端 API 与 Worker
├── DEPLOY.md     # 生产部署文档（PM2 + Nginx）
└── README.md
```

---

## 🚀 快速开始（本地开发）

### 1) 环境要求

- Node.js >= 20
- npm >= 10
- MySQL >= 8

### 2) 克隆仓库

```bash
git clone https://github.com/chenlikun2010/xiaozhi-esp32-mcp.git
cd xiaozhi-esp32-mcp
```

### 3) 初始化后端

```bash
cd backend
npm install
cp .env.example .env
```

请修改 `backend/.env` 中的 MySQL 配置（`DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME`）。

### 4) 初始化数据库（推荐一键）

在本地 MySQL 中先创建数据库（例如 `mcpdb`）后，执行：

```bash
cd backend
npm run db:bootstrap
```

说明：

- `db:init`：初始化业务表结构
- `db:seed`：写入开源版基础 MCP 服务数据

如果你希望使用仓库中导出的固定数据，也可执行：

```bash
mysql -u <your_user> -p mcpdb < backend/mcp_service.sql
```

### 5) 启动后端

```bash
cd backend
npm run dev
```

默认监听 `http://localhost:3005`。

### 6) 启动前端

```bash
cd frontend
npm install
npm run dev
```

默认访问 `http://localhost:5173`。前端开发代理会将 `/api/*` 转发到后端 `3005` 端口。

---

## ✅ 最小可用数据说明

开源用户要完成“注册 -> 进入市场 -> 创建实例”的最小链路，**必须有基础数据的表只有 `mcp_service`**。

运行 `npm run db:bootstrap`（或 `db:init + db:seed`）即可满足。

---

## 🧪 常用命令

### Backend

```bash
npm run dev
npm run build
npm run test
npm run db:init
npm run db:seed
npm run db:bootstrap
```

### Frontend

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

---

## 📦 生产部署

完整生产部署（PM2 + Nginx + 反向代理）请查看：

- [`DEPLOY.md`](./DEPLOY.md)

---

## 🤝 贡献

欢迎提交 Issue / PR 改进：

- 文档清晰度
- 错误处理与稳定性
- 新 MCP 服务接入

请先阅读贡献说明：[`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md)

---

## 📄 License

MIT（见仓库根目录 `LICENSE`）
