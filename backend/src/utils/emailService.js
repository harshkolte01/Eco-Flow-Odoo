import nodemailer from 'nodemailer';

/**
 * Email Service using Nodemailer
 * Supports multiple email providers (Gmail, Outlook, Custom SMTP, etc.)
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Initialize email transporter with configuration from environment variables
   */
  async initialize() {
    if (this.initialized) return;

    const emailConfig = {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    };

    // Check if email is configured
    if (!emailConfig.host || !emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn('⚠️  Email service not configured. Emails will not be sent.');
      console.warn('Please configure EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD in .env file');
      return;
    }

    this.transporter = nodemailer.createTransport(emailConfig);

    // Verify connection
    try {
      await this.transporter.verify();
      console.log('✅ Email service initialized successfully');
      this.initialized = true;
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      this.transporter = null;
    }
  }

  /**
   * Check if email service is available
   */
  isAvailable() {
    return this.initialized && this.transporter !== null;
  }

  /**
   * Send password reset email with token
   * @param {string} to - Recipient email address
   * @param {string} resetToken - Password reset token
   * @param {string} userName - User's name (optional)
   */
  async sendPasswordResetEmail(to, resetToken, userName = 'User') {
    if (!this.isAvailable()) {
      console.error('Email service is not available. Cannot send password reset email.');
      return false;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(to)}`;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'EcoFlow'}" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Password Reset Request - EcoFlow',
      html: this.getPasswordResetTemplate(userName, resetLink, resetToken),
      text: this.getPasswordResetTextVersion(userName, resetLink, resetToken),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error.message);
      return false;
    }
  }

  /**
   * HTML email template for password reset
   */
  getPasswordResetTemplate(userName, resetLink, resetToken) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🔐 Password Reset</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hello <strong>${userName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your EcoFlow account. Click the button below to reset your password:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; padding: 16px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 8px; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; word-break: break-all; font-family: 'Courier New', monospace; font-size: 12px; color: #374151;">
                ${resetLink}
              </div>
              
              <p style="margin: 30px 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>Alternative: Use Reset Token</strong>
              </p>
              
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If the link doesn't work, you can manually enter this reset token:
              </p>
              
              <div style="background-color: #dbeafe; border: 2px solid #3b82f6; border-radius: 6px; padding: 16px; text-align: center; word-break: break-all; font-family: 'Courier New', monospace; font-size: 14px; color: #1e40af; font-weight: bold;">
                ${resetToken}
              </div>
              
              <!-- Security Notice -->
              <div style="margin-top: 40px; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  ⚠️ <strong>Important:</strong> This link will expire in <strong>1 hour</strong> and can only be used once.
                </p>
              </div>
              
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you didn't request this password reset, please ignore this email or contact support if you have concerns.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                Best regards,<br>
                <strong style="color: #10b981;">The EcoFlow Team</strong>
              </p>
              <p style="margin: 10px 0 0; color: #9ca3af; font-size: 12px;">
                This is an automated email. Please do not reply to this message.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Plain text version for email clients that don't support HTML
   */
  getPasswordResetTextVersion(userName, resetLink, resetToken) {
    return `
Hello ${userName},

We received a request to reset your password for your EcoFlow account.

Reset your password by clicking this link:
${resetLink}

Or use this reset token manually:
${resetToken}

IMPORTANT: This link will expire in 1 hour and can only be used once.

If you didn't request this password reset, please ignore this email or contact support if you have concerns.

Best regards,
The EcoFlow Team

---
This is an automated email. Please do not reply to this message.
    `.trim();
  }

  /**
   * Send a test email to verify configuration
   */
  async sendTestEmail(to) {
    if (!this.isAvailable()) {
      console.error('Email service is not available. Cannot send test email.');
      return false;
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'EcoFlow'}" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Test Email - EcoFlow Email Service',
      html: '<h1>✅ Email Service Working!</h1><p>Your email configuration is working correctly.</p>',
      text: 'Email Service Working! Your email configuration is working correctly.',
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Test email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send test email:', error.message);
      return false;
    }
  }
}

// Export singleton instance
const emailService = new EmailService();
export default emailService;
