#!/bin/bash

# Angel Broking Trade Report Generator
# ===================================

echo "🔔 Angel Broking Trade Report Generator"
echo "======================================="
echo ""

# Check if TOTP codes are provided
if [ $# -ne 2 ]; then
    echo "❌ Error: Please provide TOTP codes for both accounts"
    echo ""
    echo "Usage: $0 <jpw_totp> <pew_totp>"
    echo ""
    echo "Example: $0 123456 789012"
    echo ""
    echo "📱 Get current TOTP codes from your authenticator app:"
    echo "   - JPW (J77302): Get TOTP from Angel app"
    echo "   - PEW (W1573): Get TOTP from Angel app"
    echo ""
    exit 1
fi

JPW_TOTP=$1
PEW_TOTP=$2

echo "🔢 Using TOTP codes:"
echo "   JPW (J77302): $JPW_TOTP"
echo "   PEW (W1573): $PEW_TOTP"
echo ""

# Run the fetch script
echo "🚀 Starting automated trade data fetch and report generation..."
echo ""

node js/fetch-trade-data.js "$JPW_TOTP" "$PEW_TOTP"

# Check if successful
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Trade report generated successfully!"
    echo "📁 Check the ./bkp/ folder for the generated report file."
else
    echo ""
    echo "❌ Trade report generation failed. Please check the error messages above."
    exit 1
fi
