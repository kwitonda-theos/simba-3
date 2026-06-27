import { query } from '../../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const session = await query('select a.* from auth_sessions s join auth_users a on a.id = s.user_id order by s.created_at desc limit 1');
  if (!session.rows.length) {
    return res.status(400).json({ error: 'No active session' });
  }

  await query('update auth_users set password = $1 where id = $2', [password, session.rows[0].id]);
  return res.status(200).json({ data: { user: { id: session.rows[0].id } } });
}
