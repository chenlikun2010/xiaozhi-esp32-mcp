/*
  Unified initialization SQL for open-source edition
  - Creates all core tables
  - Seeds initial admin account
  - Seeds default MCP services
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================
-- Drop existing tables (safe re-init order)
-- =========================
DROP TABLE IF EXISTS `user_mcp_instance`;
DROP TABLE IF EXISTS `verification_code`;
DROP TABLE IF EXISTS `activation_code`;
DROP TABLE IF EXISTS `mcp_service`;
DROP TABLE IF EXISTS `user`;

-- =========================
-- user
-- =========================
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'user',
  `invitation_code` varchar(255) NOT NULL,
  `referred_by` varchar(255) DEFAULT NULL,
  `expire_date` datetime NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_user_email` (`email`),
  UNIQUE KEY `UQ_user_invitation_code` (`invitation_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- mcp_service
-- =========================
CREATE TABLE `mcp_service` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'stopped',
  `url` varchar(255) DEFAULT NULL,
  `config` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- activation_code
-- =========================
CREATE TABLE `activation_code` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(255) NOT NULL,
  `durationDays` int NOT NULL,
  `isUsed` tinyint(1) NOT NULL DEFAULT 0,
  `usedBy` int DEFAULT NULL,
  `usedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_activation_code_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- verification_code
-- =========================
CREATE TABLE `verification_code` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `expiresAt` datetime NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_verification_email` (`email`),
  KEY `IDX_verification_email_code` (`email`, `code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- user_mcp_instance
-- =========================
CREATE TABLE `user_mcp_instance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `service_id` int NOT NULL,
  `xiaozhi_wss_url` text NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'stopped',
  `start_time` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_user_instance_user_id` (`user_id`),
  KEY `IDX_user_instance_service_id` (`service_id`),
  CONSTRAINT `FK_user_instance_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_user_instance_service` FOREIGN KEY (`service_id`) REFERENCES `mcp_service` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- Seed initial admin user
-- email: admin@facaiai.cn
-- password: 123456 (bcrypt)
-- =========================
INSERT INTO `user` (
  `id`, `email`, `password`, `role`, `invitation_code`, `referred_by`, `expire_date`, `createdAt`, `updatedAt`
) VALUES (
  1,
  'admin@facaiai.cn',
  '$2b$10$JoJWU4v7Wb8Itdh1n4ohBeLAXKff2woJ81.gBl3VH60j72oFCpl/u',
  'admin',
  'ADMIN2026',
  NULL,
  '2099-12-31 23:59:59',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  `password` = VALUES(`password`),
  `role` = VALUES(`role`),
  `expire_date` = VALUES(`expire_date`),
  `updatedAt` = NOW();

-- =========================
-- Seed MCP services
-- (align with backend/src/seed.ts)
-- =========================
INSERT INTO `mcp_service` (`id`, `name`, `description`, `image_url`, `status`, `url`, `config`) VALUES
(1,  '联网搜索服务',   '支持联网查询最新信息，适用于通用问答与实时资讯检索。', '/vite.svg',         'stopped', NULL, NULL),
(2,  '做饭助手',       '根据食材和口味推荐菜谱与做法，提供家庭烹饪指导。',       '/vite.svg',         'stopped', NULL, NULL),
(3,  'MBTI 性格测试',  '提供 MBTI 性格类型分析与结果解读。',                     '/vite.svg',         'stopped', NULL, NULL),
(4,  '股票查询助手',   '支持股票基础信息与行情查询。',                           '/vite.svg',         'stopped', NULL, NULL),
(5,  '汇率查询助手',   '查询常见币种汇率，支持多币种换算。',                     '/vite.svg',         'stopped', NULL, NULL),
(6,  '12306 火车票助手','提供火车票余票与车次信息查询。',                         '/vite.svg',         'stopped', NULL, NULL),
(7,  '黄金价格查询',   '查询黄金价格与市场参考数据。',                           '/vite.svg',         'stopped', NULL, NULL),
(8,  '行业报告专家',   '提供行业报告检索与问答能力。',                           '/report_expert.png','stopped', NULL, NULL),
(9,  '快递查询助手',   '支持主流快递单号物流轨迹查询。',                         '/vite.svg',         'stopped', NULL, NULL),
(10, '飞常准航班服务', '提供航班动态、时刻与相关信息查询。',                     '/vite.svg',         'stopped', NULL, NULL),
(11, '新闻查询服务',   '聚合科技新闻与资讯，支持关键词检索。',                   '/vite.svg',         'stopped', NULL, NULL),
(12, '番茄小说全能助手','提供番茄小说检索、目录与章节内容能力。',                 '/vite.svg',         'stopped', NULL, NULL)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `description` = VALUES(`description`),
  `image_url` = VALUES(`image_url`),
  `status` = VALUES(`status`),
  `url` = VALUES(`url`),
  `config` = VALUES(`config`);

SET FOREIGN_KEY_CHECKS = 1;
