# Angel Broking Trade Report Generator

This project automatically fetches trade data from Angel Broking APIs and generates comprehensive trading reports.

## 🚨 **SECURITY WARNING**
**NEVER commit `data/config.json` to public repositories!** This file contains TOTP secrets equivalent to your 2FA device. See [SECURITY.md](SECURITY.md) for details.

## Features

- 🔐 **Automated Login**: Logs into both Mummy (J77302) and Papa (W1573) accounts
- 📊 **Data Fetching**: Retrieves OrderBook data from Angel Broking APIs
- 📈 **Report Generation**: Processes and formats trading data
- 💾 **File Management**: Automatically saves data and generates reports
- 🚀 **One-Command Execution**: Complete automation with a single command

## Files Overview

| File | Purpose |
|------|---------|
| `fetch-trade-data.js` | Main automation script for API calls |
| `index.js` | Trade data processing and report generation |
| `run-trade-report.sh` | Shell script for easy execution |
| `response-jpw.json` | OrderBook data for Mummy account (J77302) |
| `response-pew.json` | OrderBook data for Papa account (W1573) |
| `bkp/[Month]/[Date].txt` | Generated trade reports |

## Quick Start

### 1. Get TOTP Codes
Before running, get current TOTP codes from your Angel Broking authenticator app:
- **Mummy Account ()**: 6-digit TOTP code
- **Papa Account ()**: 6-digit TOTP code

### 2. Run the Complete Process
```bash
# Using shell script (recommended)
./run-trade-report.sh [mummy_totp] [papa_totp]

# Example
./run-trade-report.sh 123456 789012
```

### 3. Alternative: Manual Node.js Execution
```bash
# Fetch data and generate report
node fetch-trade-data.js [mummy_totp] [papa_totp]

# Or just process existing data
node index.js
```

## Output

The system generates:

### Console Output
- Login status for both accounts
- Data fetch progress
- Trade report with buy/sell data
- Total calculations

### Generated Files
- `response-jpw.json` - Raw API data for Mummy account
- `response-pew.json` - Raw API data for Papa account  
- `bkp/[Month]/[Date].txt` - Formatted trade report

### Sample Report Format
```
=============PEW=============
Buy Data ===========
21-Aug-2025,GICRE,383,50
21-Aug-2025,NTPC,338.85,13.5
======TOTAL BUY======
103787.2

Sell Data ===========
21-Aug-2025,DRREDDY,1277,7.5
======TOTAL SELL======
88431
```

## API Configuration

The script uses Angel Broking APIs with the following endpoints:

### Login
- **URL**: `https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword`
- **Method**: POST
- **Purpose**: Authenticate and get JWT tokens

### OrderBook
- **URL**: `https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/getOrderBook`
- **Method**: GET
- **Purpose**: Fetch trading data

## Account Details

| Account | Client Code | Private Key | Description |
|---------|-------------|-------------|-------------|
| Mummy | J77302 | TUOTya6a | Primary trading account |
| Papa | W1573 | VqJ4o4G6 | Secondary trading account |

## Data Processing

The system:
1. **Filters** only completed transactions (status = "complete")
2. **Removes** "-EQ" suffix from trading symbols
3. **Uses** correct price amounts (no division by 100)
4. **Groups** data by transaction type (BUY/SELL)
5. **Calculates** totals for each account and transaction type

## Report Sections

- **PEW**: Papa account data with quantities divided by 2
- **JPW**: Mummy account data with original quantities  
- **Actual PEW**: Papa account data with original quantities

## Troubleshooting

### Common Issues

1. **TOTP Expired**: TOTP codes change every 30 seconds
   - Get fresh codes from authenticator app
   
2. **Login Failed**: Check credentials and network connection
   - Verify account details in `fetch-trade-data.js`
   
3. **API Rate Limits**: Too many requests
   - Wait a few minutes between attempts

### Help Command
```bash
node fetch-trade-data.js --help
```

## Security Notes

- TOTP codes are not stored permanently
- Credentials are in the script for automation
- JWT tokens are temporary and expire after use
