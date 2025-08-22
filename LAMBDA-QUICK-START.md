# ⚡ AWS Lambda Quick Start

Get your trading automation running on AWS Lambda in 5 minutes!

## 🚀 Super Quick Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up AWS (interactive)
npm run setup:aws

# 3. Deploy to AWS
npm run lambda:deploy:dev

# 4. Test it works
npm run lambda:invoke
```

## 📋 What You Need

- ✅ AWS Account
- ✅ AWS CLI configured (`aws configure`)
- ✅ Your Angel Broking credentials and TOTP secrets
- ✅ A verified email address in Amazon SES

## 🔧 Key Commands

| Command | Description |
|---------|-------------|
| `npm run setup:aws` | Interactive AWS setup |
| `npm run lambda:deploy:dev` | Deploy to development |
| `npm run lambda:deploy:prod` | Deploy to production |
| `npm run lambda:invoke` | Test the function |
| `npm run lambda:logs` | View logs |
| `npm run lambda:remove` | Remove deployment |

## 📊 What Happens

1. **Scheduled Execution**: Runs daily at 6:00 PM IST
2. **Data Fetch**: Logs into both Angel Broking accounts
3. **Processing**: Generates trade reports
4. **Email Delivery**: Sends formatted report to your email
5. **Monitoring**: Sends alerts if anything fails

## 🏗️ Architecture

```
CloudWatch Events → Lambda → Angel Broking API
                      ↓
                   📧 Email Report (Your Inbox)
```

## 💰 Cost

- **Typical**: $0.50-2.00 per month
- **Free Tier**: Covers most usage
- **Pay only**: For actual execution time

## 🆘 Need Help?

- **Full Guide**: [AWS-LAMBDA-GUIDE.md](AWS-LAMBDA-GUIDE.md)
- **Health Check**: `curl https://your-api/health`
- **Logs**: `npm run lambda:logs`

## 🎯 Benefits vs Local

| Feature | Local | AWS Lambda |
|---------|-------|------------|
| **Always On** | ❌ Need computer running | ✅ Serverless |
| **Scheduling** | ❌ Manual cron setup | ✅ Built-in CloudWatch |
| **Reports** | ❌ Local files only | ✅ Email delivery |
| **Monitoring** | ❌ Limited | ✅ CloudWatch dashboards |
| **Cost** | ❌ Server/electricity | ✅ Pay-per-use |
| **Scaling** | ❌ Manual | ✅ Automatic |

Ready to go serverless? Run `npm run setup:aws` to start! 🚀
