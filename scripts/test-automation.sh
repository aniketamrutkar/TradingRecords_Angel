#!/bin/bash

# Test the automated trade report system
# =====================================

echo "🧪 Testing Angel Broking Automation System"
echo "==========================================="
echo ""

# Check if config.json exists
if [ ! -f "data/config.json" ]; then
    echo "❌ Error: data/config.json not found"
    echo "📝 Please run 'node js/setup-totp.js' first"
    exit 1
fi

# Check if TOTP secrets are configured
if grep -q "YOUR_.*_TOTP_SECRET_HERE" data/config.json; then
    echo "❌ Error: TOTP secrets not configured"
    echo "📝 Please run 'node js/setup-totp.js' first"
    exit 1
fi

echo "✅ Configuration validated"
echo "🔄 Running test fetch..."
echo ""

# Run the automated fetch
node js/automated-fetch.js

# Check if successful
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Test completed successfully!"
    echo "📁 Check the ./bkp/ folder for the generated report"
    echo "📊 Response files updated: response-jpw.json, response-pew.json"
else
    echo ""
    echo "❌ Test failed. Please check the error messages above."
    exit 1
fi
