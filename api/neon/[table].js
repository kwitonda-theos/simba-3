import { initializeDatabase, query } from '../_lib/db.js';
import { randomUUID } from 'node:crypto';

function encodeLike(value) {
  return `%${String(value).replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
}

function makeWhereClause(searchParams, values) {
  const clauses = [];
  for (const [key, value] of searchParams.entries()) {
    if (!key.startsWith('f_')) continue;
    const [, type, field] = key.match(/^f_([^_]+)_(.+)$/) || [];
    if (!type || !field) continue;

    if (type === 'eq') {
      values.push(value);
      clauses.push(`${field} = $${values.length}`);
    } else if (type === 'in') {
      const parts = String(value).split('|').filter(Boolean);
      values.push(parts);
      clauses.push(`${field} = ANY($${values.length})`);
    } else if (type === 'ilike') {
      values.push(encodeLike(value));
      clauses.push(`${field} ilike $${values.length}`);
    }
  }
  return clauses.length ? `where ${clauses.join(' and ')}` : '';
}

function withBranchesRows(rows) {
  return rows;
}

function mapProduct(row) {
  return {
    ...row,
    image: row.image_url,
    stock: row.stock ?? row.stock_quantity ?? undefined,
  };
}

async function getTableRows(table, searchParams) {
  const values = [];
  const where = makeWhereClause(searchParams, values);
  const sortField = searchParams.get('sortField');
  const sortAscending = searchParams.get('sortAscending') !== '0';
  const limit = searchParams.get('limit');
  let sql = `select * from ${table} ${where}`;

  if (sortField) {
    sql += ` order by ${sortField} ${sortAscending ? 'asc' : 'desc'}`;
  }
  if (limit) {
    values.push(Number(limit));
    sql += ` limit $${values.length}`;
  }

  const result = await query(sql, values);
  return result.rows;
}

async function handleRead(table, searchParams) {
  if (table === 'orders') {
    const rows = await query(
      `select o.*, b.name as branch_name
       from orders o
       left join branches b on b.id = o.branch_id
       order by o.created_at desc`,
    );
    return rows.rows.map((row) => ({
      ...row,
      branches: row.branch_name ? { id: row.branch_id, name: row.branch_name } : null,
    }));
  }

  if (table === 'inventory') {
    const rows = await query(
      `select i.*, p.*
       from inventory i
       left join products p on p.id = i.product_id
       order by i.created_at desc`,
    );
    return rows.rows.map((row) => ({
      ...row,
      products: row.product_id ? mapProduct(row) : null,
    }));
  }

  if (table === 'products') {
    const rows = await getTableRows(table, searchParams);
    return rows.map(mapProduct);
  }

  return withBranchesRows(await getTableRows(table, searchParams));
}

function buildSingleResponse(rows, singleMode) {
  if (singleMode === 'single' && rows.length !== 1) {
    throw new Error(rows.length ? 'Multiple rows returned' : 'No rows returned');
  }
  if (singleMode === 'maybeSingle') {
    return rows[0] || null;
  }
  return rows;
}

export default async function handler(req, res) {
  try {
    await initializeDatabase();
    const { table } = req.query;
    const searchParams = new URL(req.url, 'http://localhost').searchParams;
    const singleMode = searchParams.get('singleMode');

    if (!table) {
      return res.status(400).json({ error: 'Table is required' });
    }

    if (req.method === 'GET') {
      const rows = await handleRead(table, searchParams);
      return res.status(200).json({ data: buildSingleResponse(rows, singleMode) });
    }

    if (req.method === 'POST') {
      const body = req.body;
      if (Array.isArray(body)) {
        const inserted = [];
        for (const item of body) {
          inserted.push(await insertRow(table, item));
        }
        return res.status(200).json({ data: inserted });
      }
      const row = await insertRow(table, body);
      return res.status(200).json({ data: row });
    }

    if (req.method === 'PATCH') {
      const row = await updateRows(table, searchParams, req.body || {});
      return res.status(200).json({ data: row });
    }

    if (req.method === 'DELETE') {
      const deleted = await deleteRows(table, searchParams);
      return res.status(200).json({ data: deleted });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function insertRow(table, item) {
  if (table === 'branches') {
    const id = item.id || `branch-${String(item.name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const result = await query(
      `insert into branches (id, name)
       values ($1, $2)
       on conflict (id) do update set name = excluded.name
       returning *`,
      [id, item.name],
    );
    return result.rows[0];
  }

  if (table === 'products') {
    const result = await query(
      `insert into products (id, name, price, category, subcategory_id, unit, image_url, is_active)
       values ($1, $2, $3, $4, $5, $6, $7, coalesce($8, true))
       on conflict (id) do update set
         name = excluded.name,
         price = excluded.price,
         category = excluded.category,
         subcategory_id = excluded.subcategory_id,
         unit = excluded.unit,
         image_url = excluded.image_url,
         is_active = excluded.is_active,
         updated_at = now()
       returning *`,
      [item.id, item.name, item.price, item.category, item.subcategoryId ?? item.subcategory_id ?? null, item.unit || 'Pcs', item.image_url || item.image || null, item.is_active],
    );
    return result.rows[0];
  }

  if (table === 'profiles') {
    const result = await query(
      `insert into profiles (id, full_name, role, primary_branch_id, no_show_flags)
       values ($1, $2, $3, $4, coalesce($5, 0))
       on conflict (id) do update set
         full_name = excluded.full_name,
         role = excluded.role,
         primary_branch_id = excluded.primary_branch_id,
         no_show_flags = excluded.no_show_flags,
         updated_at = now()
       returning *`,
      [item.id, item.full_name, item.role || 'customer', item.primary_branch_id || null, item.no_show_flags],
    );
    return result.rows[0];
  }

  if (table === 'inventory') {
    const result = await query(
      `insert into inventory (id, branch_id, product_id, stock_quantity)
       values ($1, $2, $3, $4)
       on conflict (branch_id, product_id) do update set
         stock_quantity = excluded.stock_quantity,
         updated_at = now()
       returning *`,
      [item.id || randomUUID(), item.branch_id, item.product_id, Number(item.stock_quantity || 0)],
    );
    return result.rows[0];
  }

  if (table === 'orders') {
    const result = await query(
      `insert into orders (id, order_number, customer_id, branch_id, total_amount, deposit_amount, pickup_time, status, contact_phone, delivery_address, delivery_notes, payment_method, assigned_to)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       returning *`,
      [
        item.id || randomUUID(),
        item.order_number,
        item.customer_id,
        item.branch_id,
        item.total_amount,
        item.deposit_amount,
        item.pickup_time || null,
        item.status || 'pending',
        item.contact_phone || null,
        item.delivery_address || null,
        item.delivery_notes || null,
        item.payment_method || null,
        item.assigned_to || null,
      ],
    );
    if (Array.isArray(item.order_items)) {
      for (const orderItem of item.order_items) {
        await insertRow('order_items', { ...orderItem, order_id: result.rows[0].id });
      }
    }
    return result.rows[0];
  }

  if (table === 'order_items') {
    const result = await query(
      `insert into order_items (id, order_id, product_id, quantity, price_at_purchase)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [item.id || randomUUID(), item.order_id, item.product_id, item.quantity, item.price_at_purchase],
    );
    return result.rows[0];
  }

  if (table === 'branch_reviews') {
    const result = await query(
      `insert into branch_reviews (id, order_id, branch_id, customer_id, rating, comment)
       values ($1, $2, $3, $4, $5, $6)
       returning *`,
      [item.id || randomUUID(), item.order_id, item.branch_id, item.customer_id, item.rating, item.comment || null],
    );
    return result.rows[0];
  }

  const result = await query(`insert into ${table} default values returning *`);
  return result.rows[0];
}

async function updateRows(table, searchParams, body) {
  const values = [];
  const where = makeWhereClause(searchParams, values);

  if (table === 'orders') {
    const result = await query(
      `update orders set
         status = coalesce($1, status),
         assigned_to = coalesce($2, assigned_to),
         pickup_time = coalesce($3, pickup_time),
         updated_at = now()
       ${where}
       returning *`,
      [body.status || null, body.assigned_to || null, body.pickup_time || null, ...values],
    );
    return result.rows;
  }

  if (table === 'inventory') {
    const result = await query(
      `update inventory set
         stock_quantity = coalesce($1, stock_quantity),
         updated_at = now()
       ${where}
       returning *`,
      [body.stock_quantity ?? null, ...values],
    );
    return result.rows;
  }

  if (table === 'profiles') {
    const result = await query(
      `update profiles set
         full_name = coalesce($1, full_name),
         role = coalesce($2, role),
         primary_branch_id = coalesce($3, primary_branch_id),
         no_show_flags = coalesce($4, no_show_flags),
         updated_at = now()
       ${where}
       returning *`,
      [body.full_name || null, body.role || null, body.primary_branch_id || null, body.no_show_flags ?? null, ...values],
    );
    return result.rows;
  }

  if (table === 'products') {
    const result = await query(
      `update products set
         name = coalesce($1, name),
         price = coalesce($2, price),
         category = coalesce($3, category),
         unit = coalesce($4, unit),
         image_url = coalesce($5, image_url),
         updated_at = now()
       ${where}
       returning *`,
      [body.name || null, body.price ?? null, body.category || null, body.unit || null, body.image_url || null, ...values],
    );
    return result.rows;
  }

  return [];
}

async function deleteRows(table, searchParams) {
  const values = [];
  const where = makeWhereClause(searchParams, values);
  const result = await query(`delete from ${table} ${where} returning *`, values);
  return result.rows;
}
