# 🤖 Complete Automation Setup Guide

This guide will help you set up fully automated daily trade reports at 6 PM without manual TOTP entry.

## 🎯 What This Automation Does

- **🔐 Auto-generates TOTP codes** from stored secrets (like your authenticator app)
- **📅 Runs daily at 6:00 PM** automatically
- **📊 Fetches latest trade data** from both accounts
- **📈 Generates formatted reports** 
- **💾 Saves everything** to organized files
- **📝 Logs all activities** for monitoring

## 🚀 Quick Setup (3 Steps)

### Step 1: Configure TOTP Secrets
```bash
npm run setup
# or
node setup-totp.js
```

This will ask for your TOTP secret keys (explained below).

### Step 2: Test the System
```bash
npm run test-automation
# or  
./test-automation.sh
```

### Step 3: Start Daily Scheduler
```bash
npm run start-scheduler
# or
./start-scheduler.sh
```

## 🔐 Getting Your TOTP Secret Keys

**Important**: You need the secret keys that were used to set up your authenticator app.

### Method 1: From Angel Broking 2FA Setup
1. Go to Angel Broking settings → Security → 2FA
2. When setting up, look for "Can't scan QR code?" or "Manual entry"
3. Copy the secret key (usually 16-32 characters)
4. This is your TOTP secret

### Method 2: From Existing Authenticator App
- **Google Authenticator**: Export accounts → Look for secret in backup
- **Authy**: Settings → Accounts → [Account] → View secret
- **Microsoft Authenticator**: Account settings → View recovery info

### Method 3: Reset 2FA (If Needed)
1. Disable 2FA in Angel Broking
2. Re-enable it and save the secret key this time
3. Set up your authenticator app with the same secret

## 📁 File Structure After Setup

```
TradeRecords/
├── config.json              # Your TOTP secrets (keep secure!)
├── automated-fetch.js        # Main automation script
├── scheduler.js             # Daily scheduler
├── setup-totp.js            # Setup helper
├── logs/                    # Daily log files
├── bkp/[Month]/[Date].txt   # Generated reports
├── response-jpw.json        # Latest Mummy data
└── response-pew.json        # Latest Papa data
```

## 🎛️ Available Commands

| Command | Purpose |
|---------|---------|
| `npm run setup` | Configure TOTP secrets |
| `npm run test-automation` | Test the system once |
| `npm run start-scheduler` | Start daily automation |
| `npm run fetch-now` | Fetch data manually |
| `npm run generate-report` | Process existing data |

## ⏰ Scheduling Details

**Default Schedule**: Every day at 6:00 PM
**Cron Expression**: `0 18 * * *`

To change the schedule, edit `config.json`:
```json
{
  "schedule": {
    "time": "0 18 * * *",
    "description": "Daily at 6:00 PM"
  }
}
```

### Common Cron Patterns
- `0 18 * * *` - Daily at 6:00 PM
- `0 9,18 * * *` - Daily at 9:00 AM and 6:00 PM  
- `0 18 * * 1-5` - Weekdays only at 6:00 PM
- `0 18 * * 0` - Sundays only at 6:00 PM

## 📊 Monitoring & Logs

### Log Files
- Location: `./logs/scheduler-YYYY-MM-DD.log`
- Contains: Timestamps, success/failure, error details
- Rotation: New file each day

### Console Output
When running, you'll see:
```
🚀 Starting automated Angel Broking data fetch...
🔑 Generated TOTP for mummy: 123456
🔐 Logging in to mummy account (J77302)...
✅ mummy login successful
📊 Fetching OrderBook for mummy account...
✅ Complete automated process finished successfully!
```

## 🔒 Security Best Practices

### Protecting Your Secrets
1. **Never commit** `config.json` to version control
2. **Set proper file permissions**: `chmod 600 config.json`
3. **Backup securely**: Store secrets in a password manager
4. **Limit access**: Only you should have access to the server

### Adding to .gitignore
```bash
echo "config.json" >> .gitignore
echo "logs/" >> .gitignore
```

## 🚨 Troubleshooting

### Common Issues

**❌ "TOTP secret not configured"**
```bash
# Run setup again
npm run setup
```

**❌ "Login failed"**
- Check TOTP secrets are correct
- Verify network connectivity
- Ensure Angel Broking APIs are accessible

**❌ "Invalid TOTP secret"**
- Double-check the secret key
- Try resetting 2FA and getting a new secret

**❌ Scheduler not running**
```bash
# Check if process is running
ps aux | grep scheduler

# Check logs
tail -f logs/scheduler-$(date +%Y-%m-%d).log
```

### Debug Mode
Run with detailed output:
```bash
DEBUG=* node automated-fetch.js
```

## 🔄 Running as a System Service

### Using PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start scheduler as service
pm2 start scheduler.js --name "angel-scheduler"

# Save PM2 config
pm2 save

# Auto-start on boot
pm2 startup
```

### Using systemd (Linux)
Create `/etc/systemd/system/angel-trader.service`:
```ini
[Unit]
Description=Angel Broking Trade Report Scheduler
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/TradeRecords
ExecStart=/usr/bin/node scheduler.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable angel-trader
sudo systemctl start angel-trader
```

## 📱 Notifications (Optional)

### Email Notifications
Add to `automated-fetch.js`:
```javascript
const nodemailer = require('nodemailer');

// Configure email after successful report generation
```

### Slack/Discord Webhooks
```javascript
// Add webhook notifications for success/failure
```

## 🆘 Support

If you encounter issues:
1. Check the logs in `./logs/`
2. Verify your TOTP secrets with `npm run setup`
3. Test manually with `npm run test-automation`
4. Check network connectivity to Angel Broking APIs

## 🎉 Success!

Once set up, your system will:
- ✅ Run automatically every day at 6 PM
- ✅ Generate fresh TOTP codes
- ✅ Fetch latest trade data  
- ✅ Create formatted reports
- ✅ Log all activities
- ✅ Handle errors gracefully

**No more manual TOTP entry needed!** 🚀
