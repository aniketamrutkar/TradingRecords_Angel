# Angel Broking Trade Report Generator

This project automatically fetches trade data from Angel Broking APIs and generates comprehensive trading reports. Now available in both **local** and **AWS Lambda serverless** versions!

## 🚨 **SECURITY WARNING**
**NEVER commit `data/config.json` to public repositories!** This file contains TOTP secrets equivalent to your 2FA device. See [SECURITY.md](docs/SECURITY.md) for details.

## ✨ Choose Your Deployment

### 🏠 Local Execution (Traditional)
Run on your computer with scheduled tasks
- ✅ Full control over environment
- ✅ Local file storage
- ❌ Requires computer always on
- ❌ Manual server management

### ☁️ AWS Lambda (Serverless) - **RECOMMENDED**
Run automatically in the cloud
- ✅ **Always available** - no computer needed
- ✅ **Automatic scaling** and high availability  
- ✅ **Email delivery** - reports sent directly to your inbox
- ✅ **CloudWatch monitoring** with alerts
- ✅ **Cost effective** - pay only for execution (~$1-2/month)
- ✅ **Scheduled execution** via CloudWatch Events

**🚀 [Quick Start with AWS Lambda](LAMBDA-QUICK-START.md)**

## Features

- 🔐 **Automated Login**: Logs into both JPW (J77302) and PEW (W1573) accounts
- 📊 **Data Fetching**: Retrieves OrderBook data from Angel Broking APIs
- 📈 **Report Generation**: Processes and formats trading data
- 💾 **Smart Delivery**: Local files or email delivery
- 🚀 **One-Command Execution**: Complete automation
- ☁️ **Serverless Ready**: Deploy to AWS Lambda
- 📱 **Health Monitoring**: Built-in health checks and alerts

## Files Overview

| File | Purpose |
|------|---------|
| `fetch-trade-data.js` | Main automation script for API calls |
| `index.js` | Trade data processing and report generation |
| `run-trade-report.sh` | Shell script for easy execution |
| `response-jpw.json` | OrderBook data for JPW account (J77302) |
| `response-pew.json` | OrderBook data for PEW account (W1573) |
| `bkp/[Month]/[Date].txt` | Generated trade reports |

## Quick Start

### ☁️ AWS Lambda (Recommended)

```bash
# 1. One-time setup
npm run setup:aws

# 2. Deploy to AWS  
npm run lambda:deploy:dev

# 3. Test it works
npm run lambda:invoke
```

**That's it!** Your system now runs automatically in the cloud on weekdays at 5:00 PM IST.

📖 **[Complete AWS Lambda Guide](AWS-LAMBDA-GUIDE.md)**

### 🏠 Local Execution

#### 1. Get TOTP Codes
Before running, get current TOTP codes from your Angel Broking authenticator app:
- **JPW Account ()**: 6-digit TOTP code
- **PEW Account ()**: 6-digit TOTP code

#### 2. Run the Complete Process
```bash
# Using shell script (recommended)
./run-trade-report.sh [jpw_totp] [pew_totp]

# Example
./run-trade-report.sh 123456 789012
```

#### 3. Alternative: Manual Node.js Execution
```bash
# Fetch data and generate report
node fetch-trade-data.js [jpw_totp] [pew_totp]

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
- `response-jpw.json` - Raw API data for JPW account
- `response-pew.json` - Raw API data for PEW account  
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
| JPW | J77302 | TUOTya6a | Primary trading account |
| PEW | W1573 | VqJ4o4G6 | Secondary trading account |

## Data Processing

The system:
1. **Filters** only completed transactions (status = "complete")
2. **Removes** "-EQ" suffix from trading symbols
3. **Uses** correct price amounts (no division by 100)
4. **Groups** data by transaction type (BUY/SELL)
5. **Calculates** totals for each account and transaction type

## Report Sections

- **PEW**: PEW account data with quantities divided by 2
- **JPW**: JPW account data with original quantities  
- **Actual PEW**: PEW account data with original quantities

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

## 📚 Documentation

For detailed guides and troubleshooting, see the [`docs/`](docs/) folder:

- **[AWS Lambda Guide](docs/AWS-LAMBDA-GUIDE.md)** - Complete serverless deployment guide
- **[Lambda Quick Start](docs/LAMBDA-QUICK-START.md)** - Fast AWS Lambda setup
- **[Automation Guide](docs/AUTOMATION-GUIDE.md)** - Local automation setup
- **[Project Structure](docs/PROJECT-STRUCTURE.md)** - Detailed file organization
- **[Security Guide](docs/SECURITY.md)** - Security best practices
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
