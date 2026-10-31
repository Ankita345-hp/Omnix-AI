import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL is not set in environment or .env file');
    process.exit(1);
  }

  console.log(`Connecting to PostgreSQL at ${connectionString}...`);
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL.');

    const migrationFile = path.join(__dirname, '..', 'migrations', '001_init.sql');
    const sql = fs.readFileSync(migrationFile, 'utf-8');

    console.log('Executing migration script 001_init.sql...');
    await client.query(sql);
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();

