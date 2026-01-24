import nodemailer from "nodemailer";

const getTransport = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  // Fallback for development: JSON transport (no real emails sent)
  return nodemailer.createTransport({ jsonTransport: true });
};

const transporter = getTransport();

export const sendEmail = async (to, subject, html) => {
  const from = process.env.EMAIL_FROM || "no-reply@example.com";
  const info = await transporter.sendMail({ from, to, subject, html });
  if (process.env.NODE_ENV !== "production") {
    // Log email content in dev to help testing
    try {
      const preview = typeof info.message === 'string' ? info.message : JSON.stringify(info);
      console.log("[Mailer] Sent mail:", preview);
    } catch {}
  }
  return info;
};
