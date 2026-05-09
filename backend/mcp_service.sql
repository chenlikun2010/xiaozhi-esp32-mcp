/*
 Navicat Premium Data Transfer

 Source Server         : 123.57.30.106_ali_mysql
 Source Server Type    : MySQL
 Source Server Version : 80045
 Source Host           : 123.57.30.106:3306
 Source Schema         : mcplist

 Target Server Type    : MySQL
 Target Server Version : 80045
 File Encoding         : 65001

 Date: 09/05/2026 12:01:31
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for mcp_service
-- ----------------------------
DROP TABLE IF EXISTS `mcp_service`;
CREATE TABLE `mcp_service`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'stopped',
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `config` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 17 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of mcp_service
-- ----------------------------
INSERT INTO `mcp_service` VALUES (1, '联网搜索', '使用阿里云 Qwen Search 进行实时联网搜索。', 'https://img.alice.com/search_icon.png', 'stopped', NULL, NULL);
INSERT INTO `mcp_service` VALUES (4, '菜谱查询', '不知道吃什么？让 AI 帮你推荐！', 'https://github.com/Anduin2017/HowToCook/raw/master/README.md', 'stopped', NULL, NULL);
INSERT INTO `mcp_service` VALUES (5, 'MBTI 性格测试', '基于开源项目的 MBTI 性格测试服务。通过对话完成测试，了解你的性格类型（E/I, S/N, T/F, J/P）。', 'https://upload.wikimedia.org/wikipedia/commons/1/1f/MyersBriggsTypes.png', 'stopped', NULL, NULL);
INSERT INTO `mcp_service` VALUES (6, '股票分析助手', '基于 Yahoo Finance 的实时股票行情与历史数据查询服务。支持美股 (AAPL)、港股 (0700.HK) 等全球市场。', 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Jamstec_stock_graph.gif', 'stopped', NULL, NULL);
INSERT INTO `mcp_service` VALUES (7, '汇率查询助手', '基于 Frankfurter API 的实时汇率查询与货币转换服务。支持 USD, CNY, EUR, JPY 等全球主流货币，完全免费。', 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Globe_and_currency_symbols.jpg', 'stopped', NULL, NULL);
INSERT INTO `mcp_service` VALUES (8, '12306 火车票助手', '基于官方数据的实时火车票余票查询服务。支持查询全国主要城市的车次、时刻与票务状态。', 'https://upload.wikimedia.org/wikipedia/commons/e/e0/China_Railways.svg', 'stopped', NULL, NULL);
INSERT INTO `mcp_service` VALUES (10, '黄金价格查询', '基于实时市场数据的黄金价格查询助手。支持查询国际金价 (XAU/USD)。', 'https://upload.wikimedia.org/wikipedia/commons/6/64/Gold_Bullion_Coins.jpg', 'stopped', NULL, NULL);
INSERT INTO `mcp_service` VALUES (11, '行业报告专家', '专业的行业报告分析助手。内置 2026 年最新行业趋势报告库，支持语义检索、深度问答与总结。如果本地库缺失，会自动联网检索最新报告并加入分析。', '/report_expert.png', 'stopped', NULL, NULL);
INSERT INTO `mcp_service` VALUES (13, '快递查询助手', '支持顺丰、圆通、中通、申通、韵达等全网快递物流轨迹实时查询。', 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', 'stopped', NULL, NULL);
INSERT INTO `mcp_service` VALUES (14, '飞常准航班服务', '提供全面的航班信息查询服务，支持按航班号、起降地查询航班状态、时刻表及行程信息，同时提供机场天气查询功能。', NULL, 'stopped', NULL, NULL);
INSERT INTO `mcp_service` VALUES (15, '新闻查询服务', '获取 The Verge 的最新科技新闻，支持查询今日新闻、最近一周新闻摘要以及按关键词搜索历史新闻。', NULL, 'stopped', NULL, NULL);

SET FOREIGN_KEY_CHECKS = 1;
