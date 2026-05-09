# 小智 ESP32 的 MCP 平台部署指南

本文档面向开源用户，提供一套可复用的生产部署流程（Linux + PM2 + Nginx）。

---

## 1. 部署目标与默认拓扑

- 前端：静态文件（Nginx 托管）
- 后端：Node.js API（PM2 守护）
- 数据库：MySQL（必需）
- 可选：PostgreSQL + pgvector（仅行业报告 Worker 需要）

默认端口：

- 前端：`80/443`
- 后端：`3005`（仅内网监听）
- MySQL：`3306`
- PostgreSQL（可选）：`5432`

---

## 2. 服务器要求

- Ubuntu 20.04+（或等价 Linux）
- Node.js 20+
- npm 10+
- Nginx
- MySQL 8+

> 建议：生产环境中 MySQL/PostgreSQL 只开放内网访问。

---

## 3. 拉取代码

```bash
git clone https://github.com/chenlikun2010/xiaozhi-esp32-mcp.git
cd xiaozhi-esp32-mcp
```

---

## 4. 初始化数据库

### 4.1 创建 MySQL 数据库

在 MySQL 中创建业务数据库（示例名：`mcpdb`）。

### 4.2 初始化后端表结构 + 基础服务

```bash
cd backend
npm install
cp .env.example .env
```

编辑 `backend/.env`，至少保证以下配置正确：

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`

执行初始化：

```bash
npm run db:bootstrap
```

说明：

- `db:init`：初始化 MySQL 表结构
- `db:seed`：写入 `mcp_service` 基础数据（开源版运行必需）

> 备选：你也可以导入 `backend/mcp_service.sql` 覆盖 `mcp_service` 表数据。

---

## 5. 构建前后端

### 5.1 后端构建

```bash
cd backend
npm run build
```

### 5.2 前端构建

```bash
cd frontend
npm install
npm run build
```

构建产物：`frontend/dist`

---

## 6. 使用 PM2 启动后端

```bash
cd backend
pm2 start dist/index.js --name mcp-backend
pm2 save
pm2 startup
```

可选：若你启用报告处理 Worker（依赖 PostgreSQL + SiliconFlow），再启动：

```bash
cd backend
pm2 start src/workers/reportWorker.ts --interpreter ./node_modules/.bin/ts-node --name mcp-report-worker
pm2 save
```

---

## 7. 配置 Nginx

创建配置文件：

```bash
sudo nano /etc/nginx/sites-available/mcpmanage
```

参考配置（将 `your.domain.com` 与路径替换为实际值）：

```nginx
server {
    listen 80;
    server_name your.domain.com;

    root /path/to/mcpmanage/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3005/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用并重载：

```bash
sudo ln -s /etc/nginx/sites-available/mcpmanage /etc/nginx/sites-enabled/mcpmanage
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. 验证清单（上线前）

- `http://your.domain.com` 可访问前端
- `/api/services` 返回服务列表
- 可正常注册/登录
- 可创建并启动 MCP 实例

可选检查：

- `pm2 logs mcp-backend` 无持续报错
- MySQL `mcp_service` 表有基础数据

---

## 9. 升级与回滚建议

### 升级

1. 拉取新代码
2. 重新执行 `npm install`（前后端）
3. 后端执行 `npm run build`
4. 前端执行 `npm run build`
5. `pm2 restart mcp-backend`

### 回滚

- 保留上一个可运行版本目录
- 软链切回旧版 `frontend/dist`
- PM2 重启旧版后端构建产物

---

## 10. 常见问题

### 10.1 前端报 502 / 接口不通

- 检查后端是否在 `3005` 端口监听
- 检查 Nginx `proxy_pass` 是否指向 `127.0.0.1:3005`
- 查看 `pm2 logs mcp-backend`

### 10.2 登录时报数据库连接错误

- 核对 `backend/.env` 中 `DB_*` 配置
- 检查数据库用户权限是否包含目标库

### 10.3 服务市场为空

- 执行 `npm run db:seed`
- 或导入 `backend/mcp_service.sql`

---

## 11. 安全建议（生产必做）

- 使用强随机 `JWT_SECRET`
- 不要将 `.env` 提交到仓库
- 建议开启 HTTPS（Let's Encrypt）
- 限制数据库端口公网访问
- 定期备份 MySQL 数据
