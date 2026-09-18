const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
    },
});

const NOTIFY_TO = process.env.ORDER_NOTIFY_EMAIL || 'mnagy2449@gmail.com';

async function sendNewOrderNotification(order) {
    if(!process.env.SMTP_USER){
        console.log('[mailer] SMTP nincs beállítva, email kihagyva. Rendelés: ', order.customerName);
        return;
    }
    try{
        await transporter.sendMail({
            from: `"Awi Hegesztés weboldal" <${process.env.SMTP_USER}>`,
            to: NOTIFY_TO,
            subject: `Új rendelés érkezett: ${order.customerName}`,
            text: [
                `Ügyfél: ${order.customerName}`,
                `Telefon: ${order.phone || '-'}`,
                `E-mail: ${order.email || '-'}`,
                `Leírás: ${order.description || '-'}`,
            ].join('\n'),
        });
    }catch(err){
        console.error('[mailer] Nem sikerült e-mailt küldeni:', err.message);
    }
}

module.exports = { sendNewOrderNotification };