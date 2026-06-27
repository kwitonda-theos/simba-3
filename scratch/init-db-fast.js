import dotenv from 'dotenv';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import fs from 'node:fs';

const { Pool } = pg;

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SEED_PATH = path.join(ROOT, 'simba_products (2).json');

const BRANCH_NAMES = [
  'Main Branch', 'Simba Centenary', 'Simba Gishushu', 'Simba Kimironko',
  'Simba Kicukiro', 'Simba Kigali Height', 'Simba UTC', 'Simba Gacuriro',
  'Simba Gikondo', 'Simba sonatube', 'Simba Kisimenti', 'Simba Rebero'
];

function branchIdFromName(name) {
  return `branch-${String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is missing');
  }

  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();

  try {
    console.log('Beginning fast database initialization...');
    await client.query('begin');

    // 1. Ensure Schema
    console.log('Creating schema if not exists...');
    await client.query(`
      create table if not exists branches (
        id text primary key,
        name text not null unique,
        created_at timestamptz not null default now()
      );
      create table if not exists products (
        id bigint primary key,
        name text not null,
        price numeric not null,
        category text not null,
        subcategory_id integer,
        unit text not null default 'Pcs',
        image_url text,
        is_active boolean not null default true,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
      create table if not exists profiles (
        id text primary key,
        full_name text not null,
        role text not null default 'customer',
        primary_branch_id text references branches(id) on delete set null,
        no_show_flags integer not null default 0,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
      create table if not exists orders (
        id text primary key,
        order_number text not null unique,
        customer_id text not null references profiles(id) on delete cascade,
        branch_id text not null references branches(id) on delete restrict,
        total_amount numeric not null,
        deposit_amount numeric not null,
        pickup_time timestamptz,
        status text not null,
        contact_phone text,
        delivery_address text,
        delivery_notes text,
        payment_method text,
        assigned_to text references profiles(id) on delete set null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
      create table if not exists order_items (
        id text primary key,
        order_id text not null references orders(id) on delete cascade,
        product_id bigint not null references products(id) on delete restrict,
        quantity integer not null,
        price_at_purchase numeric not null,
        created_at timestamptz not null default now()
      );
      create table if not exists branch_reviews (
        id text primary key,
        order_id text not null references orders(id) on delete cascade,
        branch_id text not null references branches(id) on delete cascade,
        customer_id text not null references profiles(id) on delete cascade,
        rating integer not null,
        comment text,
        created_at timestamptz not null default now()
      );
      create table if not exists inventory (
        id text primary key,
        branch_id text not null references branches(id) on delete cascade,
        product_id bigint not null references products(id) on delete cascade,
        stock_quantity integer not null default 0,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        unique (branch_id, product_id)
      );
      create table if not exists auth_users (
        id text primary key,
        email text not null unique,
        password text,
        user_metadata jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now()
      );
      create table if not exists auth_sessions (
        id text primary key,
        user_id text not null references auth_users(id) on delete cascade,
        access_token text not null,
        created_at timestamptz not null default now()
      );
    `);

    // 2. Branches
    const branchesResult = await client.query('select count(*)::int as count from branches');
    if (branchesResult.rows[0].count === 0) {
      console.log('Inserting branches...');
      const branchRows = BRANCH_NAMES.map((name) => [branchIdFromName(name), name]);
      for (const [id, name] of branchRows) {
        await client.query('insert into branches (id, name) values ($1, $2) on conflict (id) do nothing', [id, name]);
      }
    }

    // 3. Products
    const productCount = await client.query('select count(*)::int as count from products');
    if (productCount.rows[0].count === 0 && existsSync(SEED_PATH)) {
      console.log('Bulk inserting products...');
      const seed = JSON.parse(await readFile(SEED_PATH, 'utf8'));
      const products = seed.products || [];
      
      const values = [];
      const flatParams = [];
      let paramIdx = 1;
      
      for (const product of products) {
        const id = product.id;
        const name = product.name;
        const price = product.price;
        const category = product.category;
        const subcategoryId = product.subcategoryId ?? null;
        const unit = product.unit || 'Pcs';
        const imageUrl = product.image || product.image_url || null;
        
        values.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, true)`);
        flatParams.push(id, name, price, category, subcategoryId, unit, imageUrl);
      }
      
      if (values.length > 0) {
        // chunking inserts to avoid exceeding param limits (65535)
        const chunkSize = 1000;
        for (let i = 0; i < values.length; i += chunkSize) {
          const chunkValues = values.slice(i, i + chunkSize);
          const chunkParams = flatParams.slice(i * 7, (i + chunkSize) * 7);
          
          // Re-index params for chunk
          let localIdx = 1;
          const chunkValuesStr = chunkValues.map(v => v.replace(/\$\d+/g, () => `$${localIdx++}`)).join(',\n');
          
          await client.query(
            `insert into products (id, name, price, category, subcategory_id, unit, image_url, is_active)
             values ${chunkValuesStr}
             on conflict (id) do nothing`,
            chunkParams
          );
        }
      }
    }

    // 4. Inventory
    const inventoryCount = await client.query('select count(*)::int as count from inventory');
    if (inventoryCount.rows[0].count === 0) {
      console.log('Bulk inserting inventory...');
      const products = await client.query('select id from products');
      const branches = await client.query('select id from branches');
      
      const invValues = [];
      const invParams = [];
      let pIdx = 1;

      for (const branch of branches.rows) {
        for (const product of products.rows) {
          const stock = ((String(branch.id).length + String(product.id).length) * 13) % 91 + 10;
          const invId = `inv-${branch.id}-${product.id}`;
          invValues.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
          invParams.push(invId, branch.id, product.id, stock);
        }
      }

      if (invValues.length > 0) {
        // Param limit is 65535, we have 4 params per row. 65535 / 4 = 16383 rows max per chunk
        // We do 5000 rows per chunk
        const chunkSize = 5000;
        for (let i = 0; i < invValues.length; i += chunkSize) {
          const chunkValues = invValues.slice(i, i + chunkSize);
          const chunkParams = invParams.slice(i * 4, (i + chunkSize) * 4);
          
          let localIdx = 1;
          const chunkValuesStr = chunkValues.map(v => v.replace(/\$\d+/g, () => `$${localIdx++}`)).join(',\n');
          
          await client.query(
            `insert into inventory (id, branch_id, product_id, stock_quantity)
             values ${chunkValuesStr}
             on conflict (branch_id, product_id) do nothing`,
            chunkParams
          );
        }
      }
    }

    await client.query('commit');
    console.log('Fast initialization completed successfully.');
    process.exit(0);
  } catch (error) {
    await client.query('rollback');
    console.error('Error in fast init:', error);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

run();
