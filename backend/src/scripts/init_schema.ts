import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

async function main() {
  const sqlFilePath = path.resolve(__dirname, '../../mcp_service.sql');
  const sql = fs.readFileSync(sqlFilePath, 'utf8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'mcpdb',
    multipleStatements: true,
  });

  try {
    await connection.query(sql);
    console.log('Schema initialization completed from mcp_service.sql.');
    console.log('Seeded initial admin: admin@facaiai.cn / 123456');
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('Schema initialization failed:', err);
  process.exit(1);
});
