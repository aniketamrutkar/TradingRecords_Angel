const { totp } = require('otplib');
const fs = require('fs');

// Load configuration
const config = JSON.parse(fs.readFileSync('./data/config.json', 'utf-8'));

console.log('🔍 TOTP Debug Information');
console.log('========================');
console.log('');

// Check current time
console.log('⏰ Current Time:', new Date().toISOString());
console.log('⏰ Unix Timestamp:', Math.floor(Date.now() / 1000));
console.log('');

// Test both accounts
const accounts = ['mummy', 'papa'];

accounts.forEach(accountType => {
  const account = config.accounts[accountType];
  const secret = account.totpSecret;
  
  console.log(`🔐 ${accountType.toUpperCase()} Account (${account.clientcode}):`);
  console.log(`   Secret: ${secret}`);
  
  try {
    // Generate current TOTP
    const currentTOTP = totp.generate(secret);
    console.log(`   Current TOTP: ${currentTOTP}`);
    
    // Generate TOTP for previous and next 30-second windows
    const now = Math.floor(Date.now() / 1000);
    const prevTOTP = totp.generate(secret, now - 30);
    const nextTOTP = totp.generate(secret, now + 30);
    
    console.log(`   Previous TOTP (30s ago): ${prevTOTP}`);
    console.log(`   Next TOTP (30s future): ${nextTOTP}`);
    
    // Check TOTP validity
    const isValid = totp.check(currentTOTP, secret);
    console.log(`   ✅ TOTP Valid: ${isValid}`);
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
});

// TOTP configuration info
console.log('⚙️  TOTP Configuration:');
console.log(`   Algorithm: ${totp.options.algorithm}`);
console.log(`   Digits: ${totp.options.digits}`);
console.log(`   Period: ${totp.options.step} seconds`);
console.log(`   Window: ${totp.options.window}`);
console.log('');

console.log('💡 Troubleshooting Tips:');
console.log('1. Verify the TOTP codes match your authenticator app');
console.log('2. Check if your system time is synchronized');
console.log('3. Try using the previous/next TOTP if timing is off');
console.log('4. Ensure the secrets are exactly as provided by Angel Broking');
console.log('');

// Test with different configurations
console.log('🧪 Testing with different TOTP configurations:');
console.log('');

const testConfigs = [
  { digits: 6, step: 30, algorithm: 'sha1' },
  { digits: 6, step: 30, algorithm: 'sha256' },
  { digits: 8, step: 30, algorithm: 'sha1' },
];

testConfigs.forEach((testConfig, index) => {
  console.log(`Test ${index + 1}: ${JSON.stringify(testConfig)}`);
  
  accounts.forEach(accountType => {
    const account = config.accounts[accountType];
    try {
      // Configure TOTP with test settings
      totp.options = { ...totp.options, ...testConfig };
      const testTOTP = totp.generate(account.totpSecret);
      console.log(`   ${accountType}: ${testTOTP}`);
    } catch (error) {
      console.log(`   ${accountType}: Error - ${error.message}`);
    }
  });
  
  console.log('');
  
  // Reset to defaults
  totp.resetOptions();
});

console.log('🔄 Compare these codes with your authenticator app to identify the correct configuration.');
