import { randomUUID } from 'node:crypto';
import { query } from '../../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const result = await query('select * from auth_users where lower(email) = lower($1) limit 1', [email]);
  let user = result.rows[0];

  if (!user) {
    const userId = randomUUID();
    await query(
      `insert into auth_users (id, email, password, user_metadata)
       values ($1, $2, $3, $4)`,
      [userId, email, password, { full_name: email.split('@')[0], role: 'customer' }],
    );
    user = {
      id: userId,
      email,
      user_metadata: { full_name: email.split('@')[0], role: 'customer' },
    };
  } else if (user.password !== password) {
    return res.status(400).json({ error: 'Invalid login credentials' });
  }

  const accessToken = randomUUID();
  await query('delete from auth_sessions where user_id = $1', [user.id]);
  await query(
    `insert into auth_sessions (id, user_id, access_token)
     values ($1, $2, $3)`,
    [randomUUID(), user.id, accessToken],
  );

  return res.status(200).json({
    data: {
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
      },
      session: {
        access_token: accessToken,
        user: {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
        },
      },
    },
  });
}
