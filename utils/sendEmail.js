import nodemailer from 'nodemailer';

// Gmail via OAuth2 (not a plain app-password login).
//
// WHY: Google's SMTP frequently blocks/times out plain username +
// app-password logins coming from cloud/datacenter IPs (like
// Render's) as a security measure -- that's what caused the
// ETIMEDOUT/ENETUNREACH errors before. OAuth2 token-based login is
// trusted from any IP, which is why this approach works reliably
// from Render.
//
// SETUP (already done for this project):
//   In Render -> backend service -> Environment tab:
//     GMAIL_USER=connect.tensorixai@gmail.com
//     GMAIL_CLIENT_ID=(from Google Cloud Credentials page)
//     GMAIL_CLIENT_SECRET=(from Google Cloud Credentials page)
//     GMAIL_REFRESH_TOKEN=(from OAuth Playground)
//
//   Remember: go to Google Cloud Console -> OAuth consent screen ->
//   "Publish App" so the refresh token doesn't expire after 7 days
//   (the default limit while an OAuth app is in "Testing" mode).

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
