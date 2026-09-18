import nodemailer from 'nodemailer';

// Plain SMTP via nodemailer.
//
// NOTE: Render's web services block outbound SMTP connections
// (ports 587/465) on ALL plans, free and paid -- this is a platform-
// level restriction, not something an upgrade removes. This will
// work when run locally (npm run dev) but will very likely fail with
// an ETIMEDOUT / "command: CONN" error once deployed on Render,
// exactly like before. If that happens again, the fix is either an
// HTTP-API email provider (Brevo/SendGrid/Mailgun/Resend) or hosting
// this backend somewhere that allows outbound SMTP (a VPS, Railway,
// Fly.io, etc).

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: Number(process.env.EMAIL_PORT) === 465, // true for 465, false for other ports (STARTTLS)
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    console.log(`[EmailUtils] Initializing SMTP: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT} with User: ${process.env.EMAIL_USER}`);

    const mailOptions = {
        from: `"TensorixAI Notifications" <${process.env.EMAIL_USER}>`,
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
