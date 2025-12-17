import nodemailer from "nodemailer";
import dotenv from "dotenv";
import ejs from "ejs";
import path from "path";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  service: process.env.SMTP_SERVICE,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Render EJS email templrate
const renderEmailTemplate = async (templateName: string, data: Record<string, any>): Promise<string> => {
  const templatePath = path.join(process.cwd(), "auth-service", "src", "utils", "email-templates", `${templateName}.ejs`);

  return ejs.renderFile(templatePath, data);
};

// Send email using nodemailer
export const sendEmail = async (to: string, subject: string, temeplateName: string, data: Record<string, any>) => {
  try {
    const html = await renderEmailTemplate(temeplateName, data);

    await transporter.sendMail({
      from: `${process.env.SMTP_USER}`,
      to,
      subject,
      html,
    });

    return true;
  } catch (err) {
    console.log("Error sending email", err);
    return false;
  }
};
