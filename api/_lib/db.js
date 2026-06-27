import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');
const SEED_PATH = path.join(ROOT, 'simba_products (2).json');
const BRANCH_NAMES = [
  'Main Branch',
  'Simba Centenary',
  'Simba Gishushu',
  'Simba Kimironko',
  'Simba Kicukiro',
  'Simba Kigali Height',
  'Simba UTC',
  'Simba Gacuriro',
  'Simba Gikondo',
  'Simba sonatube',
  'Simba Kisimenti',
  'Simba Rebero',
];

let pool;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is missing');
    }
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

async function ensureSchema(client) {
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
}

function branchIdFromName(name) {
  return `branch-${String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

export async function initializeDatabase() {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    await ensureSchema(client);

    const branchesResult = await client.query('select count(*)::int as count from branches');
    if (branchesResult.rows[0].count === 0) {
      const branchRows = BRANCH_NAMES.map((name) => [branchIdFromName(name), name]);
      for (const [id, name] of branchRows) {
        await client.query('insert into branches (id, name) values ($1, $2) on conflict (id) do nothing', [id, name]);
      }
    }

    const productCount = await client.query('select count(*)::int as count from products');
    if (productCount.rows[0].count === 0 && existsSync(SEED_PATH)) {
      const seed = JSON.parse(await readFile(SEED_PATH, 'utf8'));
      for (const product of seed.products || []) {
        await client.query(
          `insert into products (id, name, price, category, subcategory_id, unit, image_url, is_active)
           values ($1, $2, $3, $4, $5, $6, $7, true)
           on conflict (id) do update set
             name = excluded.name,
             price = excluded.price,
             category = excluded.category,
             subcategory_id = excluded.subcategory_id,
             unit = excluded.unit,
             image_url = excluded.image_url,
             updated_at = now()`,
          [product.id, product.name, product.price, product.category, product.subcategoryId ?? null, product.unit || 'Pcs', product.image || product.image_url || null],
        );
      }
    }

    const inventoryCount = await client.query('select count(*)::int as count from inventory');
    if (inventoryCount.rows[0].count === 0) {
      const products = await client.query('select id from products');
      const branches = await client.query('select id from branches');
      for (const branch of branches.rows) {
        for (const product of products.rows) {
          const stock = ((String(branch.id).length + String(product.id).length) * 13) % 91 + 10;
          await client.query(
            `insert into inventory (id, branch_id, product_id, stock_quantity)
             values ($1, $2, $3, $4)
             on conflict (branch_id, product_id) do nothing`,
            [`inv-${branch.id}-${product.id}`, branch.id, product.id, stock],
          );
        }
      }
    }

    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function query(text, params = []) {
  const client = await getPool().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
