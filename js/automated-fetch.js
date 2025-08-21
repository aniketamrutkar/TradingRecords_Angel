const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');
const speakeasy = require('speakeasy');

// Load configuration
let config;
try {
  config = JSON.parse(fs.readFileSync('./data/config.json', 'utf-8'));
} catch (error) {
  console.error('❌ Failed to load data/config.json:', error.message);
  console.log('📝 Please ensure data/config.json exists and contains your TOTP secrets.');
  process.exit(1);
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
          reject(new Error(`Failed to parse JSON: ${error.message}`));
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
async function login(accountType) {
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
    for (const totpCode of totpData.codes) {
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
async function getOrderBook(accountType, jwtToken) {
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

// Save data to file
function saveToFile(filename, data) {
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`💾 Data saved to ${filename}`);
  } catch (error) {
    console.error(`❌ Failed to save ${filename}:`, error.message);
    throw error;
  }
}

// Log with timestamp
function logWithTimestamp(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Main execution function
async function fetchTradeData() {
  logWithTimestamp('🚀 Starting automated Angel Broking data fetch...');
  
  try {
    // Login to both accounts
    logWithTimestamp('=== LOGIN PHASE ===');
    const [mummyToken, papaToken] = await Promise.all([
      login('mummy'),
      login('papa')
    ]);
    
    logWithTimestamp('=== DATA FETCH PHASE ===');
    // Fetch OrderBook from both accounts
    const [mummyOrderBook, papaOrderBook] = await Promise.all([
      getOrderBook('mummy', mummyToken),
      getOrderBook('papa', papaToken)
    ]);
    
    logWithTimestamp('=== SAVE DATA PHASE ===');
    // Save the responses
    saveToFile('./data/response-jpw.json', mummyOrderBook); // Mummy (J77302) -> response-jpw.json
    saveToFile('./data/response-pew.json', papaOrderBook);  // Papa (W1573) -> response-pew.json
    
    logWithTimestamp('=== PROCESSING PHASE ===');
    // Run the index.js script
    console.log('🔄 Running trade report generation...');
    const output = execSync('node js/index.js', { encoding: 'utf-8' });
    console.log('📈 Trade report generated successfully!');
    
    logWithTimestamp('=== REPORT OUTPUT ===');
    console.log(output);
    
    logWithTimestamp('✅ Complete automated process finished successfully!');
    return { success: true, message: 'Trade data fetched and processed successfully' };
    
  } catch (error) {
    logWithTimestamp(`❌ Automated process failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Export for use in scheduler
module.exports = { fetchTradeData };

// Run immediately if called directly
if (require.main === module) {
  fetchTradeData().then(result => {
    if (!result.success) {
      process.exit(1);
    }
  });
}
