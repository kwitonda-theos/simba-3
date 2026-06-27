import dotenv from 'dotenv';
import { initializeDatabase } from '../api/_lib/db.js';

dotenv.config({ path: '.env.local' });
dotenv.config();

console.log('Initializing Neon database...');
initializeDatabase()
  .then(() => {
    console.log('Database initialized and tables created successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error initializing database:', err);
    process.exit(1);
  });
