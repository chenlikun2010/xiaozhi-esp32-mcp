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
REPORTS_API_URL=https://m.fckvip.cn//api/words/getWords?pageSize=100
FETCH_REPORTS_CRON="0 7,22 * * *"
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
  
  # 4. 重启所有服务
  pm2 restart all

  # 5. 更新前端
  cd ../frontend
  npm install
  npm run build
  # Nginx 自动生效
  ```
