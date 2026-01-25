
import nodemailer from 'nodemailer';
import 'dotenv/config';

async function testEmail() {
    console.log("Testing email connection...");

    // Explicitly read from process.env or hardcode from what was provided to verify
    // But .env should be loaded.
    const config = {
        host: process.env.EMAIL_HOST || 'smtp.qiye.aliyun.com',
        port: parseInt(process.env.EMAIL_PORT || '465'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        logger: true,
        debug: true
    };

    console.log("Config:", { ...config, auth: { user: config.auth.user, pass: '***' } });

    const transporter = nodemailer.createTransport(config);

    try {
        await transporter.verify();
        console.log("Connection verified!");

        console.log("Attempting to send test email to self...");
        const info = await transporter.sendMail({
            from: `"Test" <${config.auth.user}>`,
            to: config.auth.user, // Send to self
            subject: "Test Email from MCP Backend",
            text: "It works!"
        });
        console.log("Message sent: %s", info.messageId);
    } catch (error: any) {
        console.error("Error:", error);
    }
}

testEmail();
