# Email Service Setup Guide - EcoFlow

**Date:** January 25, 2026  
**Status:** ✅ Implemented  
**Feature:** Password Reset Email Notifications

---

## 📋 Overview

This guide explains how to configure the email service for sending password reset emails in the EcoFlow authentication system. The system uses **Nodemailer** and supports multiple email providers (Gmail, Outlook, custom SMTP).

---

## 🎯 Features

- **Password Reset Emails**: Sends professional HTML emails with reset tokens
- **Dual Mode**: Automatically switches between MVP (token display) and Production (email sending)
- **Multiple Providers**: Works with Gmail, Outlook, Office 365, and custom SMTP servers
- **Beautiful Templates**: Professional HTML email templates with fallback text version
- **Security**: Includes token in both clickable link and manual entry format
- **Error Handling**: Graceful fallback to MVP mode if email is not configured

---

## 🔧 Configuration

### Step 1: Update Environment Variables

Edit your `/backend/.env` file and add the following email configuration:

```env
# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
EMAIL_FROM_NAME=EcoFlow

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000
```

### Step 2: Configure Email Provider

Choose your email provider and follow the setup instructions:

---

## 📧 Provider-Specific Setup

### Option 1: Gmail (Recommended for Development)

**Requirements:**
- Gmail account
- 2-Factor Authentication enabled
- App Password generated

**Steps:**

1. **Enable 2-Factor Authentication**
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "EcoFlow Backend"
   - Copy the 16-character password

3. **Update .env file**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop  # Your app password (remove spaces)
   EMAIL_FROM_NAME=EcoFlow
   FRONTEND_URL=http://localhost:3000
   ```

**Example:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=ecoflow.notifications@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM_NAME=EcoFlow
FRONTEND_URL=http://localhost:3000
```

---

### Option 2: Outlook / Office 365

**Steps:**

1. **Update .env file**
   ```env
   EMAIL_HOST=smtp-mail.outlook.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@outlook.com
   EMAIL_PASSWORD=your-password-here
   EMAIL_FROM_NAME=EcoFlow
   FRONTEND_URL=http://localhost:3000
   ```

**For Office 365:**
```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@yourcompany.com
EMAIL_PASSWORD=your-password
EMAIL_FROM_NAME=EcoFlow
FRONTEND_URL=http://localhost:3000
```

---

### Option 3: SendGrid (Recommended for Production)

**Steps:**

1. **Create SendGrid Account**
   - Sign up at https://sendgrid.com
   - Verify your sender email address
   - Generate API key

2. **Update .env file**
   ```env
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey
   EMAIL_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxx  # Your SendGrid API key
   EMAIL_FROM_NAME=EcoFlow
   FRONTEND_URL=https://yourapp.com
   ```

---

### Option 4: Custom SMTP Server

**Steps:**

1. **Get SMTP details from your provider**
   - SMTP host address
   - Port (usually 587 or 465)
   - Username
   - Password

2. **Update .env file**
   ```env
   EMAIL_HOST=smtp.yourprovider.com
   EMAIL_PORT=587
   EMAIL_SECURE=false  # true for port 465, false for 587
   EMAIL_USER=your-username
   EMAIL_PASSWORD=your-password
   EMAIL_FROM_NAME=EcoFlow
   FRONTEND_URL=https://yourapp.com
   ```

---

## 🚀 Usage

### Automatic Initialization

The email service initializes automatically when the server starts:

```
🚀 Server is running on http://localhost:5001
📧 Initializing email service...
✅ Email service initialized successfully
```

Or if not configured:

```
📧 Initializing email service...
⚠️  Email service not configured. Emails will not be sent.
Please configure EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD in .env file
```

---

## 🎨 Email Template

### What Users Receive

When a user requests a password reset, they receive a professional HTML email containing:

1. **Header**: Beautiful gradient header with lock icon
2. **Greeting**: Personalized with user's name
3. **Reset Button**: Large, clickable "Reset Password" button
4. **Direct Link**: Copyable URL for manual access
5. **Manual Token**: Alternative token for manual entry
6. **Security Notice**: 1-hour expiration warning
7. **Footer**: Professional branding

**Email Preview:**

```
Subject: Password Reset Request - EcoFlow

Hello John Doe,

We received a request to reset your password for your EcoFlow account. 
Click the button below to reset your password:

[Reset Password Button]

Or copy and paste this link into your browser:
http://localhost:3000/reset-password?token=abc123...&email=user@example.com

Alternative: Use Reset Token
If the link doesn't work, you can manually enter this reset token:
abc123def456ghi789...

⚠️ Important: This link will expire in 1 hour and can only be used once.

If you didn't request this password reset, please ignore this email.

Best regards,
The EcoFlow Team
```

---

## 🔄 Dual Mode Operation

The system automatically detects email configuration:

### Production Mode (Email Configured)

**Backend Response:**
```json
{
  "success": true,
  "message": "Password reset instructions have been sent to your email"
}
```

**Frontend Display:**
```
✅ Check Your Email
We've sent a password reset link and token to user@example.com.
Please check your inbox and spam folder.
```

### MVP Mode (Email Not Configured)

**Backend Response:**
```json
{
  "success": true,
  "message": "If email exists, reset instructions have been sent",
  "resetToken": "abc123...",  // Only in MVP mode
  "email": "user@example.com"  // Only in MVP mode
}
```

**Frontend Display:**
```
⚠️ Development Mode
Email service is not configured. In production, this token will be sent to your email.

Your Reset Token:
abc123def456...

[Copy to Clipboard]
```

---

## 🧪 Testing

### Test Email Configuration

You can test your email configuration manually:

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Look for initialization message:**
   ```
   ✅ Email service initialized successfully
   ```

3. **Test password reset flow:**
   ```bash
   curl -X POST http://localhost:5001/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

4. **Check email inbox** (if user exists)

---

## 🐛 Troubleshooting

### Issue: "Email service initialization failed"

**Possible Causes:**
1. Invalid credentials
2. Wrong SMTP host/port
3. 2FA not enabled (Gmail)
4. App password not generated (Gmail)
5. Firewall blocking port 587

**Solutions:**
- Double-check credentials
- Verify SMTP settings
- Enable 2FA and generate app password (Gmail)
- Try port 465 with `EMAIL_SECURE=true`
- Check firewall/antivirus settings

---

### Issue: "Username and Password not accepted" (Gmail)

**Solution:**
1. Enable 2-Factor Authentication
2. Generate App Password (not regular password)
3. Use app password in EMAIL_PASSWORD
4. Remove spaces from app password

---

### Issue: Emails going to spam

**Solutions:**
1. **SendGrid/Professional Provider**: Use for production
2. **SPF/DKIM**: Configure DNS records
3. **Verified Sender**: Verify email address with provider
4. **Content**: Ensure professional email content (already done)

---

### Issue: System still in MVP mode

**Verification:**
```bash
# Check .env configuration
cd backend
cat .env | grep EMAIL

# Should show:
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Solution:**
1. Restart backend server after .env changes
2. Check server logs for email initialization
3. Verify no typos in environment variables

---

## 📊 File Structure

```
backend/
├── src/
│   ├── utils/
│   │   └── emailService.js         # ✅ Email service implementation
│   ├── modules/
│   │   └── auth/
│   │       └── auth.service.js     # ✅ Updated with email integration
│   └── index.js                     # ✅ Email service initialization
├── .env                             # ✅ Email configuration
└── .env.example                     # ✅ Template with email vars

frontend/
└── app/
    └── forgot-password/
        └── page.tsx                 # ✅ Dual mode UI
```

---

## 🔒 Security Features

1. **App Passwords**: Use app-specific passwords, not account passwords
2. **TLS Encryption**: All emails sent over encrypted connections
3. **Token Hashing**: Reset tokens hashed in database
4. **Expiration**: Tokens expire after 1 hour
5. **One-Time Use**: Tokens can only be used once
6. **No Email Disclosure**: Doesn't reveal if email exists
7. **Environment Variables**: Credentials stored securely in .env

---

## 📈 Production Checklist

Before deploying to production:

- [ ] Configure professional email provider (SendGrid, AWS SES)
- [ ] Use company email address (no-reply@yourcompany.com)
- [ ] Update FRONTEND_URL to production domain
- [ ] Configure SPF and DKIM DNS records
- [ ] Test email delivery
- [ ] Check spam folder placement
- [ ] Verify email template renders correctly
- [ ] Test token expiration
- [ ] Test one-time use enforcement
- [ ] Monitor email delivery rates
- [ ] Set up email sending limits/quotas

---

## 💡 Best Practices

### For Development
- ✅ Use Gmail with app password
- ✅ Use personal email for testing
- ✅ MVP mode fallback is acceptable

### For Production
- ✅ Use SendGrid, AWS SES, or professional provider
- ✅ Use no-reply@company.com address
- ✅ Configure DNS records (SPF, DKIM, DMARC)
- ✅ Monitor delivery rates
- ✅ Implement rate limiting
- ✅ Set up email webhooks for bounce handling

---

## 🎯 Example Configurations

### Development (Gmail)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=dev.ecoflow@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM_NAME=EcoFlow Dev
FRONTEND_URL=http://localhost:3000
```

### Staging (SendGrid)
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.abc123xyz789
EMAIL_FROM_NAME=EcoFlow Staging
FRONTEND_URL=https://staging.ecoflow.com
```

### Production (SendGrid)
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.production-key
EMAIL_FROM_NAME=EcoFlow
FRONTEND_URL=https://ecoflow.com
```

---

## 📚 API Reference

### Email Service Methods

**`initialize()`**
- Initializes email transporter
- Verifies connection
- Called automatically on server start

**`isAvailable()`**
- Returns: `boolean`
- Checks if email service is configured and ready

**`sendPasswordResetEmail(to, resetToken, userName)`**
- `to`: Recipient email address
- `resetToken`: Password reset token (plain text)
- `userName`: User's name (optional, defaults to "User")
- Returns: `Promise<boolean>` - true if sent successfully

**`sendTestEmail(to)`**
- `to`: Recipient email address
- Returns: `Promise<boolean>` - true if sent successfully
- Use for testing configuration

---

## 🔗 Related Documentation

- **Implementation Summary**: `/docs/password-reset-change-implementation-complete.md`
- **Planning Document**: `/docs/PASSWORD_RESET_CHANGE_IMPLEMENTATION_PLAN.md`
- **Nodemailer Docs**: https://nodemailer.com/
- **Gmail App Passwords**: https://support.google.com/accounts/answer/185833
- **SendGrid Docs**: https://docs.sendgrid.com/

---

## ✅ Summary

The email service is fully implemented and supports:

- ✅ Multiple email providers (Gmail, Outlook, SendGrid, custom SMTP)
- ✅ Professional HTML email templates
- ✅ Automatic fallback to MVP mode if not configured
- ✅ Secure credential management via environment variables
- ✅ TLS/SSL encryption
- ✅ Error handling and logging
- ✅ Production-ready implementation

**Next Steps:**
1. Configure your email provider credentials in `.env`
2. Restart the backend server
3. Test password reset flow
4. Check your email inbox for the reset link

**For Help:**
- Check server logs for email initialization messages
- Review troubleshooting section above
- Verify .env configuration
- Test with known working email address

---

**Status:** ✅ Ready for Use  
**Last Updated:** January 25, 2026
