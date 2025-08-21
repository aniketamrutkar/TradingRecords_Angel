const { totp } = require('otplib');
const fs = require('fs');

// Load configuration
const config = JSON.parse(fs.readFileSync('./data/config.json', 'utf-8'));

console.log('🇮🇳 IST Timezone TOTP Test');
console.log('==========================');
console.log('');

// Show current times
const systemTime = new Date();
const istTime = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
const istTimestamp = Math.floor(new Date(istTime).getTime() / 1000);
const systemTimestamp = Math.floor(Date.now() / 1000);

console.log('🕐 Time Information:');
console.log(`   System Time: ${systemTime.toISOString()}`);
console.log(`   IST Time: ${istTime}`);
console.log(`   System Unix: ${systemTimestamp}`);
console.log(`   IST Unix: ${istTimestamp}`);
console.log(`   Difference: ${systemTimestamp - istTimestamp} seconds`);
console.log('');

// Test both accounts
const accounts = ['mummy', 'papa'];

accounts.forEach(accountType => {
  const account = config.accounts[accountType];
  const secret = account.totpSecret;
  
  console.log(`🔐 ${accountType.toUpperCase()} Account (${account.clientcode}):`);
  
  try {
    // Generate TOTP with different timestamps
    const systemTOTP = totp.generate(secret, systemTimestamp);
    const istTOTP = totp.generate(secret, istTimestamp);
    const prevTOTP = totp.generate(secret, istTimestamp - 30);
    const nextTOTP = totp.generate(secret, istTimestamp + 30);
    
    console.log(`   System Time TOTP: ${systemTOTP}`);
    console.log(`   IST Time TOTP: ${istTOTP}`);
    console.log(`   IST Previous (-30s): ${prevTOTP}`);
    console.log(`   IST Next (+30s): ${nextTOTP}`);
    
    // Show unique codes
    const uniqueCodes = [systemTOTP, istTOTP, prevTOTP, nextTOTP].filter((code, index, arr) => arr.indexOf(code) === index);
    console.log(`   Unique codes: [${uniqueCodes.join(', ')}]`);
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
});

console.log('📱 Please compare these codes with your authenticator app.');
console.log('💡 The correct code should match one of the generated codes above.');
