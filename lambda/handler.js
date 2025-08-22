const https = require('https');
const speakeasy = require('speakeasy');
const moment = require('moment');
const _ = require('underscore');

// AWS SDK for SES and SSM operations
const AWS = require('aws-sdk');
const ses = new AWS.SES();
const ssm = new AWS.SSM();

// Function to get parameters from SSM
async function getSSMParameters() {
  const parameterNames = [
    '/trading-records/mummy/password',
    '/trading-records/mummy/totp-secret',
    '/trading-records/papa/password',
    '/trading-records/papa/totp-secret',
    '/trading-records/email/from-address',
    '/trading-records/email/to-addresses'
  ];

  try {
    const result = await ssm.getParameters({
      Names: parameterNames,
      WithDecryption: true
    }).promise();

    const params = {};
    result.Parameters.forEach(param => {
      const key = param.Name.split('/').pop();
      const section = param.Name.split('/')[2];
      if (!params[section]) params[section] = {};
      params[section][key] = param.Value;
    });

    return params;
  } catch (error) {
    console.error('Failed to retrieve SSM parameters:', error);
    throw error;
  }
}

// Base configuration
const getConfig = async () => {
  const ssmParams = await getSSMParameters();
  
  return {
    accounts: {
      mummy: {
        clientcode: process.env.MUMMY_CLIENT_CODE || 'J77302',
        password: ssmParams.mummy?.password || process.env.MUMMY_PASSWORD,
        privateKey: process.env.MUMMY_PRIVATE_KEY || 'TUOTya6a',
        totpSecret: ssmParams.mummy?.['totp-secret'] || process.env.MUMMY_TOTP_SECRET
      },
      papa: {
        clientcode: process.env.PAPA_CLIENT_CODE || 'W1573',
        password: ssmParams.papa?.password || process.env.PAPA_PASSWORD,
        privateKey: process.env.PAPA_PRIVATE_KEY || 'VqJ4o4G6',
        totpSecret: ssmParams.papa?.['totp-secret'] || process.env.PAPA_TOTP_SECRET
      }
    },
    api: {
      baseUrl: 'apiconnect.angelbroking.com',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP || '192.168.1.1',
        'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP || '1.1.1.1',
        'X-MACAddress': process.env.MAC_ADDRESS || 'aa:bb:cc:dd:ee:ff'
      }
    },
    email: {
      fromEmail: ssmParams.email?.['from-address'] || process.env.FROM_EMAIL || 'noreply@yourdomain.com',
      toEmails: (ssmParams.email?.['to-addresses'] || process.env.TO_EMAILS || 'your-email@example.com').split(',').map(email => email.trim()),
      region: process.env.AWS_REGION || 'us-east-1'
    }
  };
};

// Helper function to add delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to make HTTPS requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          console.log(`❌ Raw response body (first 500 chars): ${data.substring(0, 500)}`);
          console.log(`❌ Response status: ${res.statusCode}`);
          console.log(`❌ Response headers:`, res.headers);
          reject(new Error(`Failed to parse JSON: ${error.message}. Raw response: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Generate TOTP code with speakeasy library and multiple timing windows
function generateTOTP(secret) {
  try {
    if (!secret || secret === 'YOUR_MUMMY_TOTP_SECRET_HERE' || secret === 'YOUR_PAPA_TOTP_SECRET_HERE') {
      throw new Error('TOTP secret not configured');
    }
    
    // Get current time in IST timezone
    const istTime = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
    const istTimestamp = Math.floor(new Date(istTime).getTime() / 1000);
    
    console.log(`🕐 IST Time: ${istTime} (Unix: ${istTimestamp})`);
    
    // Generate TOTP codes using speakeasy (sha1, 6 digits, 30-second step)
    const currentTOTP = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      time: istTimestamp,
      step: 30,
      digits: 6,
      algorithm: 'sha1'
    });
    
    const prevTOTP = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      time: istTimestamp - 30,
      step: 30,
      digits: 6,
      algorithm: 'sha1'
    });
    
    const nextTOTP = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      time: istTimestamp + 30,
      step: 30,
      digits: 6,
      algorithm: 'sha1'
    });
    
    // Also try with system time as fallback
    const systemTime = Math.floor(Date.now() / 1000);
    const systemTOTP = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      time: systemTime,
      step: 30,
      digits: 6,
      algorithm: 'sha1'
    });
    
    return {
      current: currentTOTP,
      previous: prevTOTP,
      next: nextTOTP,
      system: systemTOTP,
      codes: [currentTOTP, prevTOTP, nextTOTP, systemTOTP].filter((code, index, arr) => arr.indexOf(code) === index) // Remove duplicates
    };
  } catch (error) {
    throw new Error(`TOTP generation failed: ${error.message}`);
  }
}

// Login function with automatic TOTP and retry logic
async function login(accountType, config) {
  const account = config.accounts[accountType];
  
  try {
    // Generate TOTP codes (current and previous for timing tolerance)
    const totpData = generateTOTP(account.totpSecret);
    console.log(`🔑 Generated TOTP codes for ${accountType}:`);
    console.log(`   Current: ${totpData.current}`);
    console.log(`   Previous: ${totpData.previous}`);
    console.log(`   Next: ${totpData.next}`);
    console.log(`   System: ${totpData.system}`);
    console.log(`   Will try: [${totpData.codes.join(', ')}]`);
    
    console.log(`🔐 Logging in to ${accountType} account (${account.clientcode})...`);
    
    // Try login with current TOTP first, then previous if needed
    for (let i = 0; i < totpData.codes.length; i++) {
      const totpCode = totpData.codes[i];
      
      // Add delay between attempts (except for the first one)
      if (i > 0) {
        console.log(`⏳ Waiting 2 seconds before next attempt...`);
        await delay(2000);
      }
      
      const loginData = {
        clientcode: account.clientcode,
        password: account.password,
        totp: totpCode
      };

      const options = {
        hostname: config.api.baseUrl,
        port: 443,
        path: '/rest/auth/angelbroking/user/v1/loginByPassword',
        method: 'POST',
        headers: {
          ...config.api.headers,
          'X-PrivateKey': account.privateKey
        }
      };

      try {
        const response = await makeRequest(options, JSON.stringify(loginData));
        
        if (response.status && response.data && response.data.jwtToken) {
          console.log(`✅ ${accountType} login successful with TOTP: ${totpCode}`);
          if (totpCode !== totpData.current) {
            console.log(`ℹ️  Note: Used backup TOTP due to timing`);
          }
          return response.data.jwtToken;
        } else {
          console.log(`⚠️  Login attempt failed with TOTP ${totpCode}: ${response.message || 'Unknown error'}`);
          // Continue to try next TOTP code
        }
      } catch (requestError) {
        console.log(`⚠️  Login request failed with TOTP ${totpCode}: ${requestError.message}`);
        // Continue to try next TOTP code
      }
    }
    
    // If we get here, all TOTP codes failed
    throw new Error(`Login failed with all TOTP codes. Check secret configuration.`);
    
  } catch (error) {
    console.error(`❌ ${accountType} login failed:`, error.message);
    throw error;
  }
}

// Get OrderBook function
async function getOrderBook(accountType, jwtToken, config) {
  const account = config.accounts[accountType];
  
  const options = {
    hostname: config.api.baseUrl,
    port: 443,
    path: '/rest/secure/angelbroking/order/v1/getOrderBook',
    method: 'GET',
    headers: {
      ...config.api.headers,
      'X-PrivateKey': account.privateKey,
      'Authorization': `Bearer ${jwtToken}`
    }
  };

  try {
    console.log(`📊 Fetching OrderBook for ${accountType} account...`);
    const response = await makeRequest(options);
    
    if (response.status && response.data) {
      console.log(`✅ ${accountType} OrderBook fetched successfully (${response.data.length} orders)`);
      return response;
    } else {
      throw new Error(`OrderBook fetch failed: ${response.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error(`❌ ${accountType} OrderBook fetch failed:`, error.message);
    throw error;
  }
}

// Send email with trade report
async function sendEmailReport(subject, textBody, htmlBody = null, config, attachments = []) {
  try {
    const params = {
      Source: config.email.fromEmail,
      Destination: {
        ToAddresses: config.email.toEmails
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          Text: {
            Data: textBody,
            Charset: 'UTF-8'
          }
        }
      }
    };

    // Add HTML body if provided
    if (htmlBody) {
      params.Message.Body.Html = {
        Data: htmlBody,
        Charset: 'UTF-8'
      };
    }

    await ses.sendEmail(params).promise();
    console.log(`📧 Email sent successfully to: ${config.email.toEmails.join(', ')}`);
  } catch (error) {
    console.error(`❌ Failed to send email:`, error.message);
    throw error;
  }
}

// Create HTML formatted report
function createHtmlReport(reportData, summary) {
  const { report, date, month } = reportData;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .data-table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .data-table th { background-color: #f2f2f2; }
        .buy-section { background-color: #e8f5e8; padding: 10px; border-radius: 5px; }
        .sell-section { background-color: #ffe8e8; padding: 10px; border-radius: 5px; }
        .total { font-weight: bold; font-size: 1.1em; }
        .pre-formatted { background-color: #f8f8f8; padding: 15px; border-radius: 5px; font-family: monospace; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📈 Angel Broking Trade Report</h1>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Accounts:</strong> Mummy (J77302) & Papa (W1573)</p>
    </div>
    
    <div class="section">
        <h2>📊 Summary</h2>
        <ul>
            <li><strong>Mummy Orders:</strong> ${summary.mummyOrders}</li>
            <li><strong>Papa Orders:</strong> ${summary.papaOrders}</li>
            <li><strong>Buy Transactions:</strong> ${summary.buyTransactions}</li>
            <li><strong>Sell Transactions:</strong> ${summary.sellTransactions}</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>📋 Detailed Report</h2>
        <div class="pre-formatted">${report.replace(/\n/g, '<br>')}</div>
    </div>
    
    <div class="section">
        <p><em>This report was automatically generated by the Angel Broking Trade Automation System running on AWS Lambda.</em></p>
    </div>
</body>
</html>`;
}

// Trade data processing function (from index.js)
function processTradeData(data_pew, data_jpw) {
  const date = moment().format('DD-MMM-YYYY');
  const month = moment().format('MMM-YYYY');
  
  let newBuyData = [];
  let newSellData = [];
  
  const getData = function(data, divideByTwo, date) {
    let buyData = [], sellData = [];
    const client_code = divideByTwo == true ? "W1573" : "J77302";
    
    // Filter only completed transactions
    const completedData = data.filter(function(trade) {
      return trade.status === "complete" && parseInt(trade.filledshares) > 0;
    });
    
    const groupByTransanction = _.groupBy(completedData, 'transactiontype');
    
    Object.keys(groupByTransanction).forEach(function(eachSaleType) {
      const groupByOrder = _.groupBy(groupByTransanction[eachSaleType], "orderid");
      
      Object.keys(groupByOrder).forEach(function(eachOrder) {
        let totalqty = 0;
        let smbl = "";
        let exchange = "";
        let price = 0;
        let nestordernumber = "";
        let trade_time = "";
        let trade_type = "";
        
        groupByOrder[eachOrder].forEach(function(trade) {
          totalqty += parseInt(trade.filledshares);
          smbl = trade.tradingsymbol.trim().replace("-EQ", "");
          exchange = trade.exchange === "NSE" ? "N" : "B";
          price = trade.averageprice;
          nestordernumber = trade.orderid;
          trade_time = moment(trade.exchtime, "DD-MMM-YYYY HH:mm:ss").format("YYYY-MM-DD");
          trade_type = trade.producttype;
        });
        
        totalqty = divideByTwo == true ? totalqty / 2 : totalqty;
        
        if (eachSaleType === "BUY") {
          buyData.push([date, smbl, price, totalqty]);
          newBuyData.push({
            "clientId": client_code,
            "transactionType": eachSaleType,
            "securityId": smbl,
            "quantity": totalqty,
            "price": price,
            "exchange": exchange,
            "refId": nestordernumber,
            "tradeTime": trade_time.split(" ")[0],
            "tradeType": trade_type,
            "isActive": true
          });
        } else {
          sellData.push([date, smbl, price, totalqty]);
          newSellData.push({
            "clientCode": client_code,
            "transactionType": eachSaleType,
            "securityId": smbl,
            "quantity": totalqty,
            "price": price,
            "exchange": exchange,
            "refId": nestordernumber,
            "tradeTime": trade_time.split(" ")[0],
            "tradeType": trade_type,
            "isActive": true
          });
        }
      });
    });
    
    let data_output = "";
    data_output += "Buy Data ===========\n";
    data_output += buyData.sort(sortFunction).join("\n");
    data_output += ("\n======TOTAL BUY======\n");
    data_output += getSum(buyData, divideByTwo);
    data_output += "\nSell Data ===========\n";
    data_output += sellData.sort(sortFunction).join("\n");
    data_output += ("\n======TOTAL SELL======\n");
    data_output += getSum(sellData, divideByTwo);
    
    return data_output;
  };
  
  function sortFunction(a, b) {
    if (a[1] === b[1]) {
      return 0;
    } else {
      return (a[1] < b[1]) ? -1 : 1;
    }
  }
  
  function getSum(array, divideByTwo) {
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
      sum += array[i][2] * array[i][3];
    }
    return divideByTwo == true ? sum * 2 : sum;
  }
  
  let fileData = "";
  fileData += ("=============PEW=============\n");
  fileData += getData(data_pew, true, date);
  fileData += ("\n=============JPW=============\n");
  fileData += getData(data_jpw, false, date);
  fileData += "\n";
  fileData += ("=============Actual PEW=============\n");
  fileData += getData(data_pew, false, date);
  
  return {
    report: fileData,
    buyData: newBuyData,
    sellData: newSellData,
    date: date,
    month: month
  };
}

// Log with timestamp
function logWithTimestamp(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Main Lambda handler function
exports.handler = async (event, context) => {
  logWithTimestamp('🚀 Starting AWS Lambda Angel Broking data fetch...');
  
  try {
    // Get configuration from SSM
    const config = await getConfig();
    
    // Validate that we have the required configuration
    if (!config.accounts.mummy.password || !config.accounts.mummy.totpSecret ||
        !config.accounts.papa.password || !config.accounts.papa.totpSecret ||
        !config.email.fromEmail) {
      throw new Error('Missing required configuration parameters');
    }
    
    logWithTimestamp('=== LOGIN PHASE ===');
    // Login to both accounts
    const [mummyToken, papaToken] = await Promise.all([
      login('mummy', config),
      login('papa', config)
    ]);
    
    logWithTimestamp('=== DATA FETCH PHASE ===');
    // Fetch OrderBook from both accounts
    const [mummyOrderBook, papaOrderBook] = await Promise.all([
      getOrderBook('mummy', mummyToken, config),
      getOrderBook('papa', papaToken, config)
    ]);
    
    logWithTimestamp('=== PROCESSING PHASE ===');
    // Process the trade data
    const processedData = processTradeData(papaOrderBook.data, mummyOrderBook.data);
    
    logWithTimestamp('=== EMAIL REPORT PHASE ===');
    // Create summary for email
    const summary = {
      mummyOrders: mummyOrderBook.data.length,
      papaOrders: papaOrderBook.data.length,
      buyTransactions: processedData.buyData.length,
      sellTransactions: processedData.sellData.length
    };
    
    // Prepare email content
    const emailSubject = `📈 Angel Broking Trade Report - ${processedData.date}`;
    const textBody = `Angel Broking Trade Report for ${processedData.date}

Summary:
- Mummy Orders: ${summary.mummyOrders}
- Papa Orders: ${summary.papaOrders} 
- Buy Transactions: ${summary.buyTransactions}
- Sell Transactions: ${summary.sellTransactions}

Detailed Report:
${processedData.report}

---
Generated automatically by Angel Broking Trade Automation System
Execution Time: ${new Date().toISOString()}`;
    
    const htmlBody = createHtmlReport(processedData, summary);
    
    // Send email report
    await sendEmailReport(emailSubject, textBody, htmlBody, config);
    
    logWithTimestamp('=== REPORT OUTPUT ===');
    console.log(processedData.report);
    
    logWithTimestamp('✅ Complete automated process finished successfully!');
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Trade data fetched and email report sent successfully',
        emailSentTo: config.email.toEmails,
        executionTime: new Date().toISOString(),
        summary: summary
      })
    };
    
  } catch (error) {
    logWithTimestamp(`❌ Lambda execution failed: ${error.message}`);
    console.error('Full error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        executionTime: new Date().toISOString()
      })
    };
  }
};

// Export individual functions for testing
module.exports = {
  handler: exports.handler,
  login,
  getOrderBook,
  generateTOTP,
  processTradeData
};
