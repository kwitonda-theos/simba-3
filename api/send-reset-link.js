import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, resetLink } = req.body;

  try {
    const data = await resend.emails.send({
      from: 'Simba Supermarket <onboarding@resend.dev>',
      to: [email],
      subject: 'Reset your password - Simba Supermarket',
      html: `
        <h1>Reset Your Password</h1>
        <p>You requested a password reset for your Simba Supermarket account.</p>
        <p>Click the link below to set a new password:</p>
        <a href="${resetLink}" style="display:inline-block;background:#FF6B00;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">
          Reset Password
        </a>
        <p>If you did not request this, please ignore this email.</p>
        <hr />
        <p style="font-size:12px;color:#666;">Simba Supermarket - Rwanda's #1 Online Supermarket</p>
      `,
    });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json(error);
  }
}
