import { randomUUID } from 'node:crypto';
import { query } from '../../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, options } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const existing = await query('select id from auth_users where lower(email) = lower($1)', [email]);
  if (existing.rows.length) {
    return res.status(400).json({ error: 'User already registered' });
  }

  const userId = randomUUID();
  const metadata = options?.data || {};
  await query(
    `insert into auth_users (id, email, password, user_metadata)
     values ($1, $2, $3, $4)`,
    [userId, email, password, metadata],
  );

  return res.status(200).json({
    data: {
      user: {
        id: userId,
        email,
        user_metadata: metadata,
      },
      session: null,
    },
  });
}
