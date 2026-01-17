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

### 3.1 配置 MySQL 用户

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

## 4. 部署后端 (Backend)

### 4.1 安装依赖与编译

```bash
cd ~/app/backend
npm install
npm run build
```

### 4.2 配置环境变量

复制环境变量模版：

```bash
cp .env.example .env  # 如果没有 .env.example，直接创建 .env
nano .env
```

在 `.env` 中填入你的配置：

```env
PORT=3005
DB_HOST=8.140.51.220
DB_PORT=3306
DB_USER=mcpadmin
DB_PASS=Mcp@20260109
DB_NAME=mcplist
JWT_SECRET=xJW+2JHzgs+Dx8gk8/VWLSJINLVC56j8my/umYTmiOk=
QWEN_API_KEY=sk-f65deeac876c48099bcb5e5889c82e01
```

### 4.3 初始化数据

运行 Seed 脚本初始化数据：

```bash
npx ts-node src/seed.ts
# 如果需要更新中文服务名称，确保运行过相关更新脚本
```

### 4.4 使用 PM2 启动服务

```bash
pm2 start dist/index.js --name "mcp-backend"
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
2.  你应该能看到登录页面。
3.  尝试注册、登录、访问服务市场，确认一切正常。

## 维护常用命令

- **查看后端日志**: `pm2 logs mcp-backend`
- **重启后端**: `pm2 restart mcp-backend`
- **更新代码**:
  ```bash
  # 1. 拉取最新代码
  cd ~/app
  git pull

  # 2. 更新后端 (安装新依赖 yahoo-finance2 等)
  cd backend
  npm install
  npm run build

  # 3. 初始化新服务数据 (运行本次新增的 Seed 脚本)
  # 注意：请确保 .env 配置文件正确
  npx ts-node src/scripts/add_how_to_cook_service.ts
  npx ts-node src/scripts/add_mbti_service.ts
  npx ts-node src/scripts/add_stock_service.ts
  npx ts-node src/scripts/add_exchange_service.ts

  # 4. 重启后端服务
  pm2 restart mcp-backend

  # 5. 更新前端 (可选，如果前端有修改)
  cd ../frontend
  npm install
  npm run build
  # 此时 Nginx 会自动服务新的 dist 文件，无需重启 Nginx (除非修改了 nginx 配置)
  ```
