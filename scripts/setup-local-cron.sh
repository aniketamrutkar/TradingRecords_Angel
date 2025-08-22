#!/bin/bash

# Setup local cron job for Angel Broking automation with email delivery
# This runs daily at 6:00 PM IST

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CRON_COMMAND="0 18 * * * cd $PROJECT_DIR && npm run fetch-and-email >> $PROJECT_DIR/logs/cron-\$(date +\%Y-\%m-\%d).log 2>&1"

echo "🚀 Setting up local cron job for Angel Broking automation..."
echo "📁 Project directory: $PROJECT_DIR"
echo "⏰ Schedule: Daily at 6:00 PM IST"
echo "📧 Email delivery: Enabled"

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "fetch-and-email"; then
    echo "⚠️  Cron job already exists. Updating..."
    # Remove existing cron job
    crontab -l 2>/dev/null | grep -v "fetch-and-email" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -

echo "✅ Cron job added successfully!"
echo ""
echo "📋 Current cron jobs:"
crontab -l | grep -E "(fetch-and-email|trading)"

echo ""
echo "🔧 Manual commands:"
echo "  Test now:           npm run fetch-and-email"
echo "  View cron jobs:     crontab -l"
echo "  Remove cron job:    crontab -e (then delete the line)"
echo "  View logs:          tail -f logs/cron-\$(date +%Y-%m-%d).log"
echo ""
echo "📧 Email will be sent to: aniketamrutkar@gmail.com"
echo "✅ Local automation with email delivery is now active!"
