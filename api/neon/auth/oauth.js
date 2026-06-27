import { randomUUID } from 'node:crypto';
import { query } from '../../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { provider } = req.body || {};
  const email = `${provider || 'oauth'}@simba.local`;
  const metadata = { full_name: 'Google User', name: 'Google User', role: 'customer' };

  const userResult = await query(
    `insert into auth_users (id, email, password, user_metadata)
     values ($1, $2, null, $3)
     on conflict (email) do update set user_metadata = excluded.user_metadata
     returning *`,
    [randomUUID(), email, metadata],
  );
  const user = userResult.rows[0];

  const accessToken = randomUUID();
  await query('delete from auth_sessions where user_id = $1', [user.id]);
  await query(
    `insert into auth_sessions (id, user_id, access_token)
     values ($1, (select id from auth_users where email = $2), $3)`,
    [randomUUID(), email, accessToken],
  );

  return res.status(200).json({
    data: {
      session: {
        access_token: accessToken,
        user: { id: user.id, email, user_metadata: user.user_metadata || metadata },
      },
    },
  });
}
