import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

async function main() {
  try {
    console.log('Running database migrations...');
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migrations completed successfully!');
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    await sql.end();
    process.exit(1);
  }
}

main();
