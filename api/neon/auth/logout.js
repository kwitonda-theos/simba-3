import { query } from '../../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await query('delete from auth_sessions');
  return res.status(200).json({ data: { success: true } });
}
