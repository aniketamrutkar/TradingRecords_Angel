#!/bin/bash

# Angel Broking Automated Trade Report Scheduler
# ===============================================

echo "🚀 Angel Broking Automated Trade Report Scheduler"
echo "================================================="
echo ""

# Check if config.json exists
if [ ! -f "data/config.json" ]; then
    echo "❌ Error: data/config.json not found"
    echo "📝 Please run 'node js/setup-totp.js' first to configure TOTP secrets"
    echo ""
    exit 1
fi

# Check if TOTP secrets are configured
if grep -q "YOUR_.*_TOTP_SECRET_HERE" data/config.json; then
    echo "❌ Error: TOTP secrets not configured"
    echo "📝 Please run 'node js/setup-totp.js' to configure your TOTP secrets"
    echo ""
    exit 1
fi

echo "✅ Configuration found"
echo "📅 Starting scheduler for daily execution at 6:00 PM"
echo "📝 Logs will be saved to ./logs/ directory"
echo "🛑 Press Ctrl+C to stop the scheduler"
echo ""

# Create logs directory if it doesn't exist
mkdir -p logs

# Start the scheduler
node js/scheduler.js
