import nodemailer from 'nodemailer';

// Gmail via OAuth2 (not a plain app-password login).
//
// WHY: Google's SMTP frequently blocks/times out plain username +
// app-password logins coming from cloud/datacenter IPs (like
// Render's) as a security measure -- that's what caused the
// ETIMEDOUT error before. OAuth2 token-based login is trusted from
// any IP, which is why the other Render project using this same
// approach (GMAIL_REFRESH_TOKEN + GMAIL_USER) works fine.
//
// SETUP:
//   If you already have a Google Cloud OAuth app set up for the
//   other project (jova-backend), you can reuse the exact same
//   GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN /
//   GMAIL_USER values here -- copy them from that project's Render
//   Environment tab into this project's Environment tab. No need to
//   generate new ones unless you want a different sending account.
//
//   In Render -> this backend service -> Environment tab, add:
//     GMAIL_USER=the gmail address that sends the mail
//     GMAIL_CLIENT_ID=(from the Google Cloud OAuth app)
//     GMAIL_CLIENT_SECRET=(from the Google Cloud OAuth app)
//     GMAIL_REFRESH_TOKEN=(the long-lived refresh token)

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.GMAIL_USER,
            clientId: process.env.GMAIL_CLIENT_ID,
            clientSecret: process.env.GMAIL_CLIENT_SECRET,
            refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        },
    });

    console.log(`[EmailUtils] Initializing Gmail OAuth2 transport for: ${process.env.GMAIL_USER}`);

    const mailOptions = {
        from: `"TensorixAI Notifications" <${process.env.GMAIL_USER}>`,
        to: options.email,
        replyTo: options.replyTo,
        subject: options.subject,
        text: options.message,
        html: options.html || options.message.replace(/\n/g, '<br>'),
    };

    console.log(`[EmailUtils] Dispatching email to: ${options.email}`);

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailUtils] Email sent! messageId: ${info.messageId}`);
    return info;
};

export default sendEmail;
