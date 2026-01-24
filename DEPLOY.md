# 小智 MCP 管理系统部署文档

本文档介绍如何将 "Xiaozhi MCP Manager" 部署到阿里云 Ubuntu 服务器。

## 1. 准备工作

确保你的阿里云 ECS 服务器满足以下条件：
- **操作系统**: Ubuntu 20.04 LTS 或更高版本
- **端口开放**: 
  - 80 (HTTP)
  - 443 (HTTPS, 可选)
  - 3005 (后端 API, 如需外网直接访问)
  - 3306 (MySQL, 建议仅限内网访问)

### 1.1 安装基础环境

登录到你的服务器，更新并安装必要的软件：

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Git, Curl, Nginx
sudo apt install git curl nginx -y

# 安装 Node.js (v20 LTS 推荐)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 MySQL Server
sudo apt install mysql-server -y

# 安装 PM2 (用于进程管理)
# 安装 PostgreSQL (用于向量数据库)
sudo apt install postgresql postgresql-contrib -y

# 安装 PM2 (用于进程管理)
sudo npm install -g pm2
sudo npm install -g typescript ts-node
```

## 2. 获取代码

将代码克隆到服务器上的 `/var/www` 或家目录 (例如 `~/app`)。

```bash
mkdir -p ~/app
cd ~/app
# 替换为你的 GitHub 仓库地址
git clone https://github.com/kun20031029/mcpmanage.git  .
```

## 3. 部署数据库

### 3.1 配置 MySQL 用户 (主业务库)

```bash
sudo mysql
```

在 MySQL 命令行中执行：
数据库：8.140.51.220，数据库：mcplist，账号：mcpadmin 密码：Mcp@20260109，端口3306

```sql
-- 创建数据库
CREATE DATABASE mcplist;

-- 创建用户 (请将 'your_password' 替换为强密码)
CREATE USER 'mcpadmin'@'%' IDENTIFIED BY 'Mcp@20260109';

-- 授权
GRANT ALL PRIVILEGES ON mcplist.* TO 'mcpadmin'@'%';
FLUSH PRIVILEGES;
EXIT;
```

### 3.2 配置 PostgreSQL 用户 (向量数据库)

如果是使用阿里云 RDS PostgreSQL，请跳过此步骤，直接在 `.env` 中配置连接信息。

如果是本地安装 PostgreSQL：

```bash
# 登录 postgres 用户
sudo -i -u postgres

# 进入 psql
psql

# 创建数据库和用户
CREATE DATABASE fcbaogao;
CREATE USER fcadmin WITH ENCRYPTED PASSWORD 'Fcadmin@20260119001';
GRANT ALL PRIVILEGES ON DATABASE fcbaogao TO fcadmin;

# 启用 pgvector 扩展 (必须确保已安装 pgvector 插件)
\c fcbaogao
CREATE EXTENSION IF NOT EXISTS vector;
\q
exit
```

## 4. 部署后端 (Backend)

### 4.1 安装依赖与编译

```bash
cd ~/app/backend
npm install
# 安装 Puppeteer 所需的 Chrome 浏览器
npx puppeteer browsers install chrome

# 【重要】如果是在 Linux 服务器上首次部署，需要安装 Chrome 运行所需的系统依赖：
sudo apt-get install -y ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils

npm run build
```

### 4.2 配置环境变量

复制环境变量模版：

```bash
cp .env.example .env  # 如果没有 .env.example，直接创建 .env
nano .env
```

在 `.env` 中填入配置（包含新增的 SiliconFlow 和 PostgreSQL 配置）：

```env
PORT=3005

# MySQL (业务数据)
DB_HOST=8.140.51.220
DB_PORT=3306
DB_USER=mcpadmin
DB_PASS=Mcp@20260109
DB_NAME=mcplist

# JWT & API Keys
JWT_SECRET=xJW+2JHzgs+Dx8gk8/VWLSJINLVC56j8my/umYTmiOk=
QWEN_API_KEY=sk-f65deeac876c48099bcb5e5889c82e01

# SiliconFlow API (新增 - 用于向量 Embedding 和 LLM)
SILICONFLOW_API_KEY=sk-rbtxqmcsdsbzrbwostosvkjojpbwtsxukxprvovvyaslcqgw
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICONFLOW_MODEL=BAAI/bge-m3

# PostgreSQL (新增 - 用于向量存储)
# 如果是本地安装，Host 填写 localhost
POSTGRES_HOST=pgm-2ze12x5jpbo57x5jco.pg.rds.aliyuncs.com
POSTGRES_PORT=5432
POSTGRES_USER=fcadmin
POSTGRES_PASSWORD=Fcadmin@20260119001
POSTGRES_DB=fcbaogao
POSTGRES_SCHEMA=mcp

# Report Worker 配置 (新增)
REPORT_DOWNLOAD_DIR=./downloads/reports
REPORT_POLL_INTERVAL_MS=60000
REPORT_MAX_CONCURRENT=3
REPORTS_API_URL=https://m.fckvip.cn//api/words/getWords?pageSize=30
FETCH_REPORTS_CRON="0 7,22 * * *"
 
 # Qibook 企业信息 MCP（可选）
 # 设置访问密钥和服务地址，默认使用 https://mcp.bidata.com/mcp/basic
 QIBOOK_ACCESS_KEY=YOUR_QIBOOK_ACCESS_KEY
 # 如需自定义服务地址（例如 ModelScope/DashScope SSE），设置如下：
 # QIBOOK_SERVER_URL=https://dashscope.aliyuncs.com/api/v1/mcps/qibook/basic_ent_tools/sse
```

### 4.3 初始化数据

运行 Seed 脚本初始化数据：

```bash
# 初始化 MySQL 基础数据
npx ts-node src/seed.ts

# 初始化 PostgreSQL 向量数据库表结构 (新增)
# 注意：你需要先手动在 PostgreSQL 数据库中执行 `src/scripts/init_report_db.sql` 中的 SQL 语句
# 或者如果连接权限允许，使用 psql 命令行工具导入
psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -f src/scripts/init_report_db.sql
```

### 4.4 使用 PM2 启动服务

现在需要启动两个进程：API Server 和 Report Worker。

```bash
# 启动 API Server
pm2 start dist/index.js --name "mcp-backend"

# 启动 Report Worker (新增)
# 注意：Worker 需要运行 TypeScript 文件或者编译后的 JS
pm2 start src/workers/reportWorker.ts --interpreter ./node_modules/.bin/ts-node --name "mcp-report-worker"

pm2 save
pm2 startup
```

## 5. 部署前端 (Frontend)

### 5.1 安装依赖与构建

```bash
cd ~/app/frontend
npm install
```

### 5.2 构建生产版本

```bash
npm run build
```

构建完成后，会生成 `dist` 目录。

## 6. 配置 Nginx 反向代理

配置 Nginx 以提供前端静态文件服务，并将 API 请求代理到后端。

```bash
sudo nano /etc/nginx/sites-available/mcpmanage
```

粘贴以下配置 (替换 `wx.aixuexi.cc` 为你的域名或公网 IP)：

```nginx
server {
    listen 80;
    server_name wx.aixuexi.cc;

    root /root/app/frontend/dist; # 确保路径正确指向 frontend/dist
    index index.html;

    # 前端静态文件
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:3005/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置并重启 Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/mcpmanage /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 7. 验证部署

1.  访问 `http://wx.aixuexi.cc`。
2.  登录系统。
3.  在服务市场安装 "行业报告专家"。
4.  测试对话："2026年世界经济展望"。

## 8. 故障排查

### 8.1 登录返回 502 Bad Gateway

如果访问登录接口返回 502，说明 Nginx 无法连接到后端服务。原因通常是后端服务未启动或已崩溃。

**排查步骤**：

1.  **检查 PM2 状态**：
    ```bash
    pm2 status
    ```
    如果 `mcp-backend` 的状态是 `errored` 或 `stopped`，或者 `restart` 次数一直在增加，说明服务启动失败。

2.  **查看错误日志**：
    ```bash
    pm2 logs mcp-backend --lines 50
    ```
    *   如果看到 `Cannot find module 'multer'`：说明构建不完整，请重新运行 `npm run build`。
    *   如果看到 `Error: connect ETIMEDOUT`：说明数据库连接失败，请检查 `.env` 中的数据库配置。
    *   如果看到 `EADDRINUSE`：说明端口被占用。

3.  **强制重装与重启**：
    如果以上都不行，尝试究极修复：
    ```bash
    cd ~/app/backend
    rm -rf node_modules dist  # 清理旧文件
    npm install               # 重新安装依赖
    npm run build             # 重新构建 (这一步必须成功)
    pm2 restart mcp-backend   # 重启服务
    ```

## 维护常用命令

- **查看日志**: 
  - Backend: `pm2 logs mcp-backend`
  - Worker: `pm2 logs mcp-report-worker`
- **重启服务**: 
  - `pm2 restart mcp-backend`
  - `pm2 restart mcp-report-worker`
- **更新代码**:
  ```bash
  # 1. 拉取最新代码
  cd ~/app
  git pull

  # 2. 更新后端
  cd backend
  npm install
  npm run build

  # 3. 初始化新服务数据
  # 注册新的报告专家服务
  npx ts-node src/scripts/add_report_expert_service.ts
  # 注册个人知识库助手服务
  npx ts-node src/scripts/add_knowledge_service.ts
  
  # 4. 重启所有服务
  pm2 restart all

  # 5. 更新前端
  cd ../frontend
  npm install
  npm run build
  # Nginx 自动生效
  ```

---

## 升级记录

### 2026-01-20: 修复 PDF 上传 OCR 功能

**问题描述**: PDF 上传后显示 "OCR识别中"，然后失败，错误信息: `Image or Canvas expected`

**根本原因**:
1. `pdf-img-convert` 库与 `officeparser` 的 pdfjs-dist 版本冲突导致 canvas 对象不兼容
2. OCR 模型名称 `deepseek-ai/deepseek-vl2-tiny` 在 SiliconFlow 平台不存在

**修复内容**:
- 新增依赖 `pdf-to-img` 替代 `pdf-img-convert` 进行 PDF 转图片
- 更正 OCR 模型为 `deepseek-ai/DeepSeek-OCR`

**升级步骤**:
```bash
# 1. 进入项目目录并拉取最新代码
cd ~/app
git pull

# 2. 进入后端目录，安装新依赖
cd backend
npm install          # 会安装新增的 pdf-to-img 依赖
npm run build

# 3. 重启后端服务
pm2 restart mcp-backend

# 4. 验证: 
#    - 登录系统上传一个扫描版 PDF 文件
#    - 观察状态从 "parsing" -> "OCR识别中" -> "completed"
#    - 使用 pm2 logs mcp-backend 查看日志确认成功
```

**变更文件**:
- `backend/src/utils/pdf_to_image.ts` - 使用 pdf-to-img 替代 pdf-img-convert
- `backend/src/utils/deepseek_ocr.ts` - 更正 OCR 模型名称
- `backend/package.json` - 新增 pdf-to-img 依赖

### 2026-01-21: 图片上传支持与UI优化

**更新内容**:
1.后端: 支持图片文件上传与 OCR 识别 (`.jpg`, `.png` 等)。
2.前端: 
   - 首页标题与 Dashboard 文案优化 (移除"小慧"，添加"机器人")。
   - Dashboard 显示账号有效期。
   - 上传组件 UI 更新。

**升级步骤**:

```bash
# 1. 拉取最新代码
cd ~/app
git pull

# 2. 后端升级
cd backend
npm install          # 确保依赖更新
npm run build        # 重新编译 TypeScript
pm2 restart mcp-backend

# 3. 前端升级
cd ../frontend
npm install          # 确保依赖更新
npm run build        # 重新编译前端静态资源
# Nginx 会自动读取最新的 dist 目录，无需重启 Nginx (除非修改了 nginx 配置)

# 4. 验证
# - 刷新页面，检查首页标题是否变更为 "机器人 MCP 服务平台"
# - 登录 Dashboard，检查是否显示 "有效期至..."
# - 尝试上传一张图片，验证是否能成功解析
```

**变更文件**:
- `backend/src/controllers/UserKnowledgeController.ts`
- `backend/src/services/UserKnowledgeService.ts`
- `frontend/src/pages/KnowledgeBase.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/components/Layout.tsx`
- `frontend/index.html`

### 2026-01-23: 快递查询服务与邀请机制

**更新内容**:
1.  **新增服务**: 集成 Kuaidi100 API，提供"快递查询助手"服务，支持自动识别快递公司。
2.  **邀请机制**:
    *   后端: 新增 `/api/user/invited` 接口，支持查询受邀用户列表。
    *   前端: 新增邀请列表页面 `/invite-list`，展示邀请码及受邀好友详情。
    *   Dashboard: 邀请码卡片更新为可点击链接。
3.  **系统优化**:
    *   **会话失效修复**: 前端新增拦截器，API 返回 401/403 时自动跳转登录页。

**升级步骤**:

```bash
# 1. 拉取最新代码
cd ~/app
git pull

# 2. 后端升级
cd backend
npm install          # 安装新依赖 (crypto等)
npm run build        # 重新编译
# 注册 Kuaidi100 服务 (仅需运行一次)
npx ts-node src/scripts/add_kuaidi_service.ts
pm2 restart mcp-backend

# 3. 前端升级
cd ../frontend
npm install
npm run build        # 编译新页面

# 4. 验证
# - 登录后进入"服务市场"，确认"快递查询助手"已上线。
# - 尝试对话查询快递："查询顺丰 SF3267298793600" (需确保提供手机号)。
# - 点击 Dashboard "邀请码" 卡片，进入邀请列表页查看信息。
# - 模拟 Token 过期 (手动清除 localStorage user/token) 后刷新页面，确认跳转到登录页。
```

**变更文件**:
- `backend/src/mcp/tools/Kuaidi100Tool.ts`
- `backend/src/scripts/add_kuaidi_service.ts`
- `backend/src/controllers/AuthController.ts`
- `frontend/src/pages/InviteList.tsx`
- `frontend/src/App.tsx`


### 2026-01-24: 番茄小说服务网络优化

**更新内容**:
1.  **性能优化**: 针对番茄小说服务 (`mcp-server-fanqie`) 进行了网络传输优化，极大减少了 API 响应包体大小 (减少 ~90%)。
2.  **稳定性修复**: 解决了因 Response Payload 过大导致的 WebSocket 连接超时/断开问题 ("网络出现了异常")。
3.  **代码提交**: 将 `backend/services/mcp-server-fanqie` 正式纳入 Git 版本控制。

**升级步骤**:

```bash
# 1. 拉取最新代码
cd ~/app
git pull
# 注意：如果提示 'backend/services/mcp-server-fanqie' 冲突或空目录，请先删除该目录再 pull
# rm -rf backend/services/mcp-server-fanqie
# git checkout backend/services/mcp-server-fanqie

# 2. 编译番茄小说子服务 【关键步骤】
cd backend/services/mcp-server-fanqie
npm install          # 安装子服务依赖
npm run build        # 编译子服务 (必须执行，否则旧代码仍会生效)

# 3. 重启后端服务
cd ../../../backend  # 回到 backend 目录
pm2 restart mcp-backend

# 4. 验证
# - 在对话框中输入 "找下修仙类小说"
# - 确认响应迅速且无网络异常报错
```

**变更文件**:
- `backend/services/mcp-server-fanqie/src/index.ts` (添加数据简化逻辑)
- `backend/services/mcp-server-fanqie/src/FanQieApi.ts` (优化日志)
- `.gitignore` (允许提交 services 目录)


### 2026-01-24: 联网搜索升级 - 智谱 AI

**更新内容**:
1.  **新增搜索源**: 默认使用智谱 AI (ZhipuAI GLM) 进行联网搜索，提供更精准的搜索结果。
2.  **保留旧源**: 原通义千问 (Qwen) 搜索作为备用，工具名变更为 `qwen_internet_search`。
3.  **配置更新**: 需要配置 `ZHIPU_API_KEY`。

**升级步骤**:

```bash
# 1. 拉取最新代码
cd ~/app
git pull

# 2. 更新后端代码并编译
cd backend
npm install
npm run build

# 3. 配置 .env
nano .env
# 添加或更新以下内容:
# ZHIPU_API_KEY=95eaaa5ffcf747d001ab32bb48894a9a.vrPMJt8jw3TKNjpz

# 4. 重启后端服务
pm2 restart mcp-backend

# 5. 验证
# - 登录系统，对话输入 "查一下今天的新闻" 或 "Search internet for latest AI news"
# - 检查日志或结果，确认调用的是 [Zhipu Search]
```

**变更文件**:
- `backend/src/mcp/tools/ZhipuSearchTool.ts` (新增)
- `backend/src/mcp/tools/QwenSearchTool.ts` (重命名工具)
- `backend/src/mcp/XiaozhiMCPServer.ts` (注册新工具)
