import { AppDataSource, initializeDB } from '../db';

async function main() {
  await initializeDB();
  console.log('Schema initialization completed (synchronize=true).');
  await AppDataSource.destroy();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('Schema initialization failed:', err);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
