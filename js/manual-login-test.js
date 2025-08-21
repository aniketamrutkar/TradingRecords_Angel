const https = require('https');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Load configuration
const config = JSON.parse(fs.readFileSync('./data/config.json', 'utf-8'));

// Helper function to make HTTPS requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`Response status: ${res.statusCode}`);
        console.log(`Response headers:`, res.headers);
        console.log(`Response body:`, data);
        
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          resolve({ rawResponse: data, parseError: error.message });
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

async function manualLoginTest() {
  console.log('🧪 Manual Login Test with Your Authenticator App');
  console.log('=================================================');
  console.log('');
  
  try {
    for (const accountType of ['mummy', 'papa']) {
      const account = config.accounts[accountType];
      
      console.log(`🔐 Testing ${accountType} account (${account.clientcode}):`);
      console.log(`   Client Code: ${account.clientcode}`);
      console.log(`   Private Key: ${account.privateKey}`);
      console.log('');
      
      const manualTOTP = await question(`📱 Enter TOTP from your authenticator app for ${accountType}: `);
      
      if (!manualTOTP || manualTOTP.trim().length !== 6) {
        console.log('   ❌ Invalid TOTP format. Should be 6 digits.');
        continue;
      }
      
      const loginData = {
        clientcode: account.clientcode,
        password: account.password,
        totp: manualTOTP.trim()
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

      console.log(`🔄 Testing login with manual TOTP: ${manualTOTP.trim()}`);
      console.log(`📤 Request URL: https://${config.api.baseUrl}${options.path}`);
      console.log(`📤 Request body:`, JSON.stringify(loginData, null, 2));
      console.log('');
      
      try {
        const response = await makeRequest(options, JSON.stringify(loginData));
        
        if (response.status && response.data && response.data.jwtToken) {
          console.log(`✅ ${accountType} login successful!`);
          console.log(`🎫 JWT Token: ${response.data.jwtToken.substring(0, 50)}...`);
        } else {
          console.log(`❌ ${accountType} login failed:`);
          console.log(`   Response:`, JSON.stringify(response, null, 2));
        }
      } catch (error) {
        console.log(`❌ ${accountType} login error:`, error.message);
      }
      
      console.log('');
      console.log('─'.repeat(50));
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    rl.close();
  }
}

console.log('This script will test login using TOTP codes from your authenticator app.');
console.log('This helps verify if the issue is with TOTP generation or the login process.');
console.log('');

manualLoginTest();
