# 🚀 AWS Lambda Deployment Guide

This guide will help you deploy your Angel Broking trading automation system to AWS Lambda for serverless, scheduled execution.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Setup](#quick-setup)
4. [Manual Setup](#manual-setup)
5. [Deployment](#deployment)
6. [Configuration](#configuration)
7. [Testing](#testing)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)
10. [Cost Optimization](#cost-optimization)

## 🎯 Overview

The AWS Lambda version provides:
- ✅ **Serverless Architecture**: No servers to manage
- ✅ **Scheduled Execution**: Runs daily at 6:00 PM IST automatically
- ✅ **Email Delivery**: Reports sent directly to your email
- ✅ **Secure Configuration**: Sensitive data in AWS Systems Manager
- ✅ **Monitoring**: CloudWatch logs and alarms
- ✅ **Cost Effective**: Pay only for execution time
- ✅ **Scalable**: Handles load automatically

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudWatch    │───▶│   AWS Lambda     │───▶│   Amazon SES    │
│   Events        │    │   (Handler)      │    │ (Email Service) │
│   (Scheduler)   │    └──────────────────┘    └─────────────────┘
└─────────────────┘             │                        │
                                 │                        │
                                 ▼                        ▼
                    ┌──────────────────┐    ┌─────────────────┐
                    │  Angel Broking   │    │   Your Email    │
                    │      API         │    │    Inbox        │
                    └──────────────────┘    └─────────────────┘
```

## 📚 Prerequisites

### Required Tools
- **Node.js** (v18 or later)
- **AWS CLI** (configured with your credentials)
- **AWS Account** with appropriate permissions

### Required AWS Permissions
Your AWS user/role needs:
- Lambda: Full access
- SES: Send email permissions
- Systems Manager: Parameter Store access
- CloudWatch: Logs and Events
- IAM: Create execution roles

## ⚡ Quick Setup

### 1. Run Automated Setup
```bash
# Run the interactive setup script
npm run setup:aws
```

This will:
- ✅ Check prerequisites
- ✅ Install dependencies
- ✅ Set up AWS parameters (including email configuration)
- ✅ Create environment files
- ✅ Update .gitignore

### 2. Deploy to AWS
```bash
# Deploy to development environment
npm run lambda:deploy:dev

# Or deploy to production
npm run lambda:deploy:prod
```

### 3. Test the Deployment
```bash
# Invoke the function manually
npm run lambda:invoke

# Check logs
npm run lambda:logs
```

That's it! Your system is now running on AWS Lambda.

## 🔧 Manual Setup

If you prefer manual setup or need more control:

### Step 1: Install Dependencies

```bash
# Install AWS SDK and Serverless Framework
npm install aws-sdk serverless serverless-offline

# Or install globally
npm install -g serverless
```

### Step 2: Configure AWS CLI

```bash
# Configure AWS credentials
aws configure

# Verify configuration
aws sts get-caller-identity
```

### Step 3: Set Up Sensitive Parameters

Store your sensitive configuration in AWS Systems Manager Parameter Store:

```bash
# Mummy account credentials
aws ssm put-parameter \
  --name "/trading-records/mummy/password" \
  --value "YOUR_MUMMY_PASSWORD" \
  --type "SecureString" \
  --description "Password for Mummy account (J77302)"

aws ssm put-parameter \
  --name "/trading-records/mummy/totp-secret" \
  --value "YOUR_MUMMY_TOTP_SECRET" \
  --type "SecureString" \
  --description "TOTP secret for Mummy account"

# Papa account credentials  
aws ssm put-parameter \
  --name "/trading-records/papa/password" \
  --value "YOUR_PAPA_PASSWORD" \
  --type "SecureString" \
  --description "Password for Papa account (W1573)"

aws ssm put-parameter \
  --name "/trading-records/papa/totp-secret" \
  --value "YOUR_PAPA_TOTP_SECRET" \
  --type "SecureString" \
  --description "TOTP secret for Papa account"

# Email configuration
aws ssm put-parameter \
  --name "/trading-records/email/from-address" \
  --value "your-verified-email@yourdomain.com" \
  --type "String" \
  --description "Email address to send reports from"

aws ssm put-parameter \
  --name "/trading-records/email/to-addresses" \
  --value "recipient1@example.com,recipient2@example.com" \
  --type "String" \
  --description "Comma-separated list of recipient emails"
```

### Step 4: Verify Email Address in SES

**IMPORTANT**: You must verify your sender email address in Amazon SES:

```bash
# Verify your FROM email address
aws ses verify-email-identity --email-address your-verified-email@yourdomain.com

# Check verification status
aws ses get-identity-verification-attributes --identities your-verified-email@yourdomain.com
```

## 🚀 Deployment

### Development Deployment
```bash
# Deploy to dev stage
serverless deploy --stage dev

# Or use npm script
npm run lambda:deploy:dev
```

### Production Deployment
```bash
# Deploy to production stage
serverless deploy --stage prod

# Or use npm script
npm run lambda:deploy:prod
```

### Custom Region Deployment
```bash
# Deploy to specific region
serverless deploy --stage prod --region ap-south-1
```

## ⚙️ Configuration

### Environment Variables

The Lambda function uses these environment variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MUMMY_PASSWORD` | Mummy account password | - | ✅ |
| `MUMMY_TOTP_SECRET` | Mummy TOTP secret | - | ✅ |
| `PAPA_PASSWORD` | Papa account password | - | ✅ |
| `PAPA_TOTP_SECRET` | Papa TOTP secret | - | ✅ |
| `FROM_EMAIL` | Verified sender email address | - | ✅ |
| `TO_EMAILS` | Comma-separated recipient emails | - | ✅ |
| `MUMMY_CLIENT_CODE` | Mummy client code | J77302 | ❌ |
| `PAPA_CLIENT_CODE` | Papa client code | W1573 | ❌ |
| `MUMMY_PRIVATE_KEY` | Mummy private key | TUOTya6a | ❌ |
| `PAPA_PRIVATE_KEY` | Papa private key | VqJ4o4G6 | ❌ |

### Schedule Configuration

The function runs daily at **6:00 PM IST** (12:30 PM UTC). To change this:

1. Edit `serverless.yml`
2. Update the `rate` in the `schedule` event:
   ```yaml
   events:
     - schedule:
         rate: cron(30 12 * * ? *)  # 6:00 PM IST daily
   ```
3. Redeploy: `npm run lambda:deploy`

### Email Delivery

Your reports are delivered via email with:

**Email Structure:**
- **Subject**: `📈 Angel Broking Trade Report - DD-MMM-YYYY`
- **Format**: Both HTML (formatted) and plain text versions
- **Content**: 
  - Summary statistics (order counts, transaction counts)
  - Detailed trade report (same format as local version)
  - Timestamp and execution information

**Email Features:**
- 📊 Professional HTML formatting with tables and styling
- 📱 Mobile-friendly responsive design  
- 📈 Color-coded buy/sell sections
- ⏰ Automatic timestamp and execution metadata

## 🧪 Testing

### Local Testing
```bash
# Start serverless offline for local testing
npm run lambda:offline

# Test the health endpoint
curl http://localhost:3000/health

# Test the main function
curl -X POST http://localhost:3000/fetch
```

### Remote Testing
```bash
# Invoke the deployed function
npm run lambda:invoke

# Invoke with custom payload
serverless invoke --function fetchTradeData --data '{"test": true}'

# Test health check
curl https://your-api-gateway-url/dev/health
```

### View Logs
```bash
# Tail logs in real-time
npm run lambda:logs

# View specific time range
serverless logs --function fetchTradeData --startTime 1h
```

## 📊 Monitoring

### CloudWatch Dashboard

AWS automatically creates monitoring for:
- **Invocations**: Number of function executions
- **Duration**: Execution time
- **Errors**: Failed executions
- **Throttles**: Rate limiting events

### Alarms

The deployment creates a CloudWatch alarm that triggers when:
- Function execution fails
- Error rate exceeds threshold

### Custom Monitoring

Add custom metrics in your Lambda function:
```javascript
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

// Put custom metric
await cloudwatch.putMetricData({
  Namespace: 'TradingRecords',
  MetricData: [{
    MetricName: 'TradeCount',
    Value: tradeCount,
    Unit: 'Count'
  }]
}).promise();
```

## 🔍 Troubleshooting

### Common Issues

#### 1. **"Missing environment variables"**
```bash
# Check if parameters exist
aws ssm get-parameters --names "/trading-records/mummy/password" "/trading-records/mummy/totp-secret"

# Re-create missing parameters
npm run setup:aws
```

#### 2. **"SES email sending failed"**
```bash
# Check if email address is verified
aws ses get-identity-verification-attributes --identities your-email@domain.com

# Verify an email address
aws ses verify-email-identity --email-address your-email@domain.com

# Check SES sending limits
aws ses get-send-quota
```

#### 3. **"TOTP authentication failed"**
- Verify TOTP secrets are correct
- Check system time synchronization
- Ensure secrets are base32 encoded

#### 4. **"Function timeout"**
- Increase timeout in `serverless.yml`:
  ```yaml
  functions:
    fetchTradeData:
      timeout: 600  # 10 minutes
  ```

#### 5. **"Email not delivered"**
- Check spam/junk folders
- Verify TO_EMAILS are correct
- Check SES sending statistics:
  ```bash
  aws ses get-send-statistics
  ```

### Debug Mode

Enable debug logging:
```bash
# Set debug environment variable
serverless deploy --stage dev --param="debug=true"
```

### Log Analysis

```bash
# Search logs for errors
aws logs filter-log-events \
  --log-group-name "/aws/lambda/trading-records-angel-dev-fetch-trade-data" \
  --filter-pattern "ERROR"

# Get recent logs
aws logs describe-log-streams \
  --log-group-name "/aws/lambda/trading-records-angel-dev-fetch-trade-data" \
  --order-by LastEventTime \
  --descending
```

## 💰 Cost Optimization

### Lambda Costs
- **Free Tier**: 1M requests + 400,000 GB-seconds per month
- **Typical Cost**: ~$0.50-2.00 per month for daily execution
- **Memory**: 512MB is sufficient (can reduce to 256MB)
- **Duration**: ~30-60 seconds per execution

### SES Costs
- **Free Tier**: 200 emails per day when called from Lambda
- **Additional**: $0.10 per 1,000 emails (negligible for daily reports)
- **No Storage Costs**: Unlike S3, email delivery has no ongoing storage costs

### Optimization Tips

1. **Reduce Memory**: If function uses <256MB, reduce allocation
2. **Monitor Usage**: Use AWS Cost Explorer
3. **Reserved Capacity**: For predictable workloads (usually not needed for daily execution)
4. **Email Efficiency**: SES charges are minimal for daily reports

### Cost Monitoring

```bash
# Check current month costs
aws ce get-cost-and-usage \
  --time-period Start=2025-01-01,End=2025-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

## 🔧 Advanced Configuration

### Custom Domain

Add a custom domain for your API:

1. **Create Certificate**:
   ```bash
   aws acm request-certificate --domain-name api.yourdomain.com
   ```

2. **Update serverless.yml**:
   ```yaml
   custom:
     customDomain:
       domainName: api.yourdomain.com
       certificateName: api.yourdomain.com
   ```

### VPC Configuration

If you need VPC access:
```yaml
provider:
  vpc:
    securityGroupIds:
      - sg-12345678
    subnetIds:
      - subnet-12345678
      - subnet-87654321
```

### Dead Letter Queue

Add error handling:
```yaml
functions:
  fetchTradeData:
    deadLetter:
      sqs: arn:aws:sqs:region:account:dlq
```

## 📞 Support

### Getting Help

1. **Check Logs**: `npm run lambda:logs`
2. **Health Check**: `curl https://your-api/health`
3. **AWS Console**: Lambda → Functions → Your Function
4. **CloudWatch**: Monitor metrics and alarms

### Useful Commands

```bash
# Package without deploying
npm run lambda:package

# Remove deployment
npm run lambda:remove

# Update function code only
serverless deploy function --function fetchTradeData

# Set environment variable
serverless deploy --param="stage=prod" --param="debug=false"
```

---

## 🎉 Congratulations!

Your Angel Broking trading system is now running serverlessly on AWS Lambda! 

The system will:
- ✅ Run automatically every day at 6:00 PM IST
- ✅ Fetch trade data from both accounts
- ✅ Generate and store reports in S3
- ✅ Send alerts if anything fails
- ✅ Scale automatically based on demand
- ✅ Cost you only a few dollars per month

**Next Steps:**
1. Monitor the first few executions
2. Set up additional CloudWatch alarms if needed
3. Consider adding notification integrations (SNS, Slack, etc.)
4. Explore AWS Cost Explorer to track spending

Happy automated trading! 🚀📈
