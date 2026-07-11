// Vercel serverless function: sends contact-form messages via Resend.
// Lives outside src/ so Create React App ignores it; Vercel builds it as a
// serverless function available at /api/contact.
//
// Required env vars (set in the Vercel project, not committed):
//   RESEND_API_KEY     - from https://resend.com/api-keys
//   CONTACT_TO_EMAIL   - where messages are delivered (defaults below)
//   CONTACT_FROM_EMAIL - verified sender, e.g. "Paul Botchwey <hello@paulbotchwey.com>"

interface ContactRequest {
    name?: string;
    email?: string;
    company?: string;
    message?: string;
}

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, company, message } = (req.body ||
        {}) as ContactRequest;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        // Not configured yet. The client falls back to a mailto link.
        return res.status(503).json({ error: 'Email service not configured' });
    }

    const to = process.env.CONTACT_TO_EMAIL || 'botchweypaul0001@gmail.com';
    const from =
        process.env.CONTACT_FROM_EMAIL || 'Portfolio <onboarding@resend.dev>';

    try {
        const resend = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from,
                to,
                reply_to: email,
                subject: `Portfolio contact from ${name}${
                    company ? ` (${company})` : ''
                }`,
                text: `${message}\n\nFrom: ${name}\nEmail: ${email}${
                    company ? `\nCompany: ${company}` : ''
                }`,
            }),
        });

        if (!resend.ok) {
            const detail = await resend.text();
            return res
                .status(502)
                .json({ error: 'Failed to send email', detail });
        }

        return res.status(200).json({ ok: true });
    } catch (err: any) {
        return res
            .status(500)
            .json({ error: 'Unexpected error', detail: String(err) });
    }
}
