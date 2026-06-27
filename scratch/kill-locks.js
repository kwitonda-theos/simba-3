import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT pg_terminate_backend(pid) 
    FROM pg_stat_activity 
    WHERE pid != pg_backend_pid() 
      AND (state = 'idle in transaction' OR query ILIKE '%insert%')
  `);
  console.log('Terminated lingering connections:', res.rowCount);
  await client.end();
}
run().catch(console.error);
