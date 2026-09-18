// Uses Brevo's HTTP API (https://www.brevo.com) instead of raw SMTP.
//
// WHY: Render's free web service tier blocks outbound SMTP socket
// connections (ports 587/465) -- that's the exact cause of the
// "ETIMEDOUT / command: CONN" error you were seeing. It works locally
// because your home network allows those ports out; Render's free
// tier doesn't. An HTTP API call (plain HTTPS on port 443) is not
// blocked, so this works identically in both places -- and you stay
// on Render, no need to move hosting.
//
// SETUP:
//   1. Sign up free at https://www.brevo.com (no card required)
//   2. Dashboard -> Settings (gear icon) -> SMTP & API -> API Keys ->
//      Generate a new API key -> copy it
//   3. In Render -> your backend service -> Environment tab, add:
//        BREVO_API_KEY=xkeysib-your-key-here
//   4. SENDER_EMAIL below must be an email address you've verified as
//      a "Sender" in Brevo (Settings -> Senders & IP -> Senders ->
//      Add a Sender). Until you verify one, use the email address you
//      signed up to Brevo with -- that one is auto-verified.

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER_EMAIL = process.env.SENDER_EMAIL; // must be a verified sender in Brevo
const SENDER_NAME = process.env.SENDER_NAME || 'TensorixAI Notifications';

const sendEmail = async (options) => {
    if (!process.env.BREVO_API_KEY) {
        console.error('[EmailUtils] BREVO_API_KEY is missing from .env -- cannot send email.');
        throw new Error('Email service is not configured (missing BREVO_API_KEY).');
    }
    if (!SENDER_EMAIL) {
        console.error('[EmailUtils] SENDER_EMAIL is missing from .env -- cannot send email.');
        throw new Error('Email service is not configured (missing SENDER_EMAIL).');
    }

    const payload = {
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: options.email }],
        replyTo: options.replyTo ? { email: options.replyTo } : undefined,
        subject: options.subject,
        textContent: options.message,
        htmlContent: options.html || options.message.replace(/\n/g, '<br>'),
    };

    console.log(`[EmailUtils] Dispatching email via Brevo to: ${options.email}`);

    const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('[EmailUtils] Brevo API error:', data);
        throw new Error(data.message || 'Failed to send email via Brevo.');
    }

    console.log(`[EmailUtils] Email accepted by Brevo! messageId: ${data.messageId}`);
    return data;
};

export default sendEmail;
