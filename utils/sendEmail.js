import { google } from 'googleapis';

// Sends mail via the official googleapis client, calling the Gmail REST API
// over HTTPS (port 443) instead of raw SMTP (port 465/587).
//
// WHY: nodemailer's `service: 'gmail'` OAuth2 transport still opens a raw
// SMTP connection under the hood -- OAuth2 only changes how you
// authenticate once connected, not the transport protocol. Render (like
// many hosts) blocks outbound SMTP ports entirely, so that connection
// always times out no matter which auth method is used. The Gmail API
// sends mail as a normal HTTPS request instead, which is never blocked.
// This mirrors the approach already proven working on the same host for
// another project (jova-backend), using the official client library
// instead of hand-rolled token refresh/HTTP calls.

// Must match the redirect URI used when the refresh token was generated
// via OAuth Playground.
const OAUTH_PLAYGROUND_REDIRECT = 'https://developers.google.com/oauthplayground';

const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    OAUTH_PLAYGROUND_REDIRECT
);
oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// Gmail's API expects a base64url-encoded raw RFC 2822 message, not a
// { to, from, subject, html } object -- this builds that message by hand.
function buildRawMessage({ from, to, replyTo, subject, text, html }) {
    const boundary = `boundary_${Date.now()}`;
    const headers = [
        `From: ${from}`,
        `To: ${to}`,
        replyTo ? `Reply-To: ${replyTo}` : null,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ].filter(Boolean).join('\r\n');

    const body = [
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        '',
        text,
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        '',
        html,
        `--${boundary}--`,
    ].join('\r\n');

    const message = `${headers}\r\n\r\n${body}`;

    return Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

const sendEmail = async (options) => {
    console.log(`[EmailUtils] Initializing Gmail API transport for: ${process.env.GMAIL_USER}`);

    const raw = buildRawMessage({
        from: `"TensorixAI Notifications" <${process.env.GMAIL_USER}>`,
        to: options.email,
        replyTo: options.replyTo,
        subject: options.subject,
        text: options.message,
        html: options.html || options.message.replace(/\n/g, '<br>'),
    });

    console.log(`[EmailUtils] Dispatching email to: ${options.email}`);

    const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
    });

    console.log(`[EmailUtils] Email sent! messageId: ${res.data.id}`);
    return res.data;
};

export default sendEmail;
