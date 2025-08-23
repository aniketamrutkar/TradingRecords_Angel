const https = require('https');
const { totp } = require('otplib');
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

async function testLogin() {
  console.log('🧪 Angel Broking Login Test');
  console.log('============================');
  console.log('');
  
  try {
    // Test both accounts
    for (const accountType of ['jpw', 'pew']) {
      const account = config.accounts[accountType];
      
      console.log(`🔐 Testing ${accountType} account (${account.clientcode}):`);
      
      // Generate TOTP
      const generatedTOTP = totp.generate(account.totpSecret);
      console.log(`   Generated TOTP: ${generatedTOTP}`);
      
      // Ask user to verify with their app
      const appTOTP = await question(`   What does your authenticator app show for ${accountType}? `);
      
      if (generatedTOTP === appTOTP.trim()) {
        console.log('   ✅ TOTP codes match!');
      } else {
        console.log('   ❌ TOTP codes don\'t match');
        console.log('   💡 This might be the issue. Let\'s try the app code...');
      }
      
      // Test login with both codes
      const testCodes = [generatedTOTP, appTOTP.trim()];
      
      for (const testCode of testCodes) {
        if (!testCode) continue;
        
        console.log(`   🔄 Testing login with TOTP: ${testCode}`);
        
        const loginData = {
          clientcode: account.clientcode,
          password: account.password,
          totp: testCode
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
            console.log(`   ✅ Login successful with TOTP: ${testCode}`);
            console.log(`   🎫 JWT Token received (length: ${response.data.jwtToken.length})`);
            
            if (testCode !== generatedTOTP) {
              console.log('   ⚠️  Note: App TOTP worked, generated TOTP didn\'t');
              console.log('   🔧 You may need to adjust TOTP configuration');
            }
            break;
          } else {
            console.log(`   ❌ Login failed with TOTP ${testCode}: ${response.message || 'Unknown error'}`);
          }
        } catch (error) {
          console.log(`   ❌ Login error with TOTP ${testCode}: ${error.message}`);
        }
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    rl.close();
  }
}

testLogin();
