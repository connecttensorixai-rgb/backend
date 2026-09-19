import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // Determine context (use Ethereal for testing if proper SMTP isn't provided)
    let transporter;

    if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
        console.log(`[EmailUtils] Initializing SMTP: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT} with User: ${process.env.EMAIL_USER}`);
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: process.env.EMAIL_PORT == 465, // Port 465 uses direct SSL
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false // Helps in certain development environments
            },
            // Force IPv4: some hosts (e.g. Render) don't have an outbound route
            // to Gmail's IPv6 address and fail with ENETUNREACH otherwise.
            family: 4
        });
    } else {
        // Fallback to testing account so the code doesn't crash during development
        console.warn('[EmailUtils] SMTP credentials not found in .env, falling back to Ethereal Email for testing.');
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    }

    const message = {
        from: `"Tensorix AI Notifications" <${process.env.EMAIL_USER}>`,
        to: options.email,
        replyTo: options.replyTo, // Important: Allows admin to reply direct to patient
        subject: options.subject,
        text: options.message,
        html: options.html || options.message.replace(/\n/g, '<br>') // Support HTML for better deliverability
    };

    console.log(`[EmailUtils] Dispatching email to: ${options.email}`);
    const info = await transporter.sendMail(message);

    console.log(`[EmailUtils] Message accepted by server! MessageId: ${info.messageId}`);

    // Preview URL will only be available if using Ethereal Test Account
    if (!process.env.EMAIL_HOST) {
        console.log('[EmailUtils] Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    return info;
};

export default sendEmail;
