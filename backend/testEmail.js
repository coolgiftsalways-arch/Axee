import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: true,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function testEmail() {
  try {
    console.log("🔄 Checking SMTP login...");

    await transporter.verify();

    console.log("✅ SMTP LOGIN SUCCESS");

    const info = await transporter.sendMail({
      from: `"UNBOUND Clothing" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_ORDER_EMAIL,
      subject: "UNBOUND EMAIL TEST ✅",

      html: `
        <div style="font-family:Arial;padding:30px;">
          <h1>UNBOUND</h1>

          <h2>Email system is working ✅</h2>

          <p>
            If you received this email,
            your SMTP setup is working correctly.
          </p>
        </div>
      `,
    });

    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log("Message ID:", info.messageId);
    console.log("Accepted:", info.accepted);
    console.log("Rejected:", info.rejected);
  } catch (error) {
    console.error("❌ EMAIL TEST FAILED");
    console.error(error);
  }
}

testEmail();
