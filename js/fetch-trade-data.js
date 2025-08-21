const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

// Configuration
const config = {
  mummy: {
    clientcode: "J77302",
    password: "3816",
    totp: "155429", // You'll need to update this with current TOTP
    privateKey: "TUOTya6a"
  },
  papa: {
    clientcode: "W1573", 
    password: "3816",
    totp: "093864", // You'll need to update this with current TOTP
    privateKey: "VqJ4o4G6"
  },
  baseUrl: "apiconnect.angelbroking.com",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-UserType": "USER",
    "X-SourceID": "WEB",
    "X-ClientLocalIP": "CLIENT_LOCAL_IP",
    "X-ClientPublicIP": "CLIENT_PUBLIC_IP",
    "X-MACAddress": "MAC_ADDRESS"
  }
};

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

// Login function
async function login(accountType) {
  const account = config[accountType];
  
  const loginData = {
    clientcode: account.clientcode,
    password: account.password,
    totp: account.totp
  };

  const options = {
    hostname: config.baseUrl,
    port: 443,
    path: '/rest/auth/angelbroking/user/v1/loginByPassword',
    method: 'POST',
    headers: {
      ...config.headers,
      'X-PrivateKey': account.privateKey
    }
  };

  try {
    console.log(`🔐 Logging in to ${accountType} account (${account.clientcode})...`);
    const response = await makeRequest(options, JSON.stringify(loginData));
    
    if (response.status && response.data && response.data.jwtToken) {
      console.log(`✅ ${accountType} login successful`);
      return response.data.jwtToken;
    } else {
      throw new Error(`Login failed: ${response.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error(`❌ ${accountType} login failed:`, error.message);
    throw error;
  }
}

// Get OrderBook function
async function getOrderBook(accountType, jwtToken) {
  const account = config[accountType];
  
  const options = {
    hostname: config.baseUrl,
    port: 443,
    path: '/rest/secure/angelbroking/order/v1/getOrderBook',
    method: 'GET',
    headers: {
      ...config.headers,
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

// Main execution function
async function main() {
  console.log('🚀 Starting Angel Broking data fetch...\n');
  
  try {
    // Login to both accounts
    console.log('=== LOGIN PHASE ===');
    const [mummyToken, papaToken] = await Promise.all([
      login('mummy'),
      login('papa')
    ]);
    
    console.log('\n=== DATA FETCH PHASE ===');
    // Fetch OrderBook from both accounts
    const [mummyOrderBook, papaOrderBook] = await Promise.all([
      getOrderBook('mummy', mummyToken),
      getOrderBook('papa', papaToken)
    ]);
    
    console.log('\n=== SAVE DATA PHASE ===');
    // Save the responses
    saveToFile('./data/response-jpw.json', mummyOrderBook); // Mummy (J77302) -> response-jpw.json
    saveToFile('./data/response-pew.json', papaOrderBook);  // Papa (W1573) -> response-pew.json
    
    console.log('\n=== PROCESSING PHASE ===');
    // Run the index.js script
    console.log('🔄 Running trade report generation...');
    const output = execSync('node js/index.js', { encoding: 'utf-8' });
    console.log('📈 Trade report generated successfully!');
    console.log('\n=== REPORT OUTPUT ===');
    console.log(output);
    
    console.log('\n✅ Complete process finished successfully!');
    
  } catch (error) {
    console.error('\n❌ Process failed:', error.message);
    process.exit(1);
  }
}

// Handle TOTP update requirement
if (process.argv[2] === '--help' || process.argv[2] === '-h') {
  console.log(`
Angel Broking Trade Data Fetcher
===============================

Usage: node js/fetch-trade-data.js [mummy_totp] [papa_totp]
   Or: npm run manual-fetch -- [mummy_totp] [papa_totp]

Arguments:
  mummy_totp    Current TOTP for Mummy account (J77302)
  papa_totp     Current TOTP for Papa account (W1573)

Examples:
  node js/fetch-trade-data.js 123456 789012
  npm run manual-fetch -- 123456 789012

Note: TOTP codes change every 30 seconds. Get fresh codes from your authenticator app.
  `);
  process.exit(0);
}

// Update TOTP if provided as command line arguments
if (process.argv[2]) {
  config.mummy.totp = process.argv[2];
  console.log(`📱 Updated Mummy TOTP: ${config.mummy.totp}`);
}
if (process.argv[3]) {
  config.papa.totp = process.argv[3];
  console.log(`📱 Updated Papa TOTP: ${config.papa.totp}`);
}

// Run the main function
main();
