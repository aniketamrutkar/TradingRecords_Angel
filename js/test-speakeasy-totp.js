const speakeasy = require('speakeasy');
const { totp } = require('otplib');
const fs = require('fs');

// Load configuration
const config = JSON.parse(fs.readFileSync('./data/config.json', 'utf-8'));

console.log('🔄 TOTP Library Comparison Test');
console.log('===============================');
console.log('');

// Show current time
const now = new Date();
console.log('🕐 Current Time:', now.toISOString());
console.log('🇮🇳 IST Time:', now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
console.log('');

// Test both accounts with both libraries
const accounts = ['jpw', 'pew'];

accounts.forEach(accountType => {
  const account = config.accounts[accountType];
  const secret = account.totpSecret;
  
  console.log(`🔐 ${accountType.toUpperCase()} Account (${account.clientcode}):`);
  console.log(`   Secret: ${secret}`);
  
  try {
    // Generate TOTP with otplib (current library)
    const otplibCode = totp.generate(secret);
    
    // Generate TOTP with speakeasy (new library)
    const speakeasyCode = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      time: Math.floor(Date.now() / 1000),
      step: 30,
      digits: 6,
      algorithm: 'sha1'
    });
    
    // Generate with different configurations
    const speakeasyCodeSha256 = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      time: Math.floor(Date.now() / 1000),
      step: 30,
      digits: 6,
      algorithm: 'sha256'
    });
    
    const speakeasyCode8Digits = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      time: Math.floor(Date.now() / 1000),
      step: 30,
      digits: 8,
      algorithm: 'sha1'
    });
    
    console.log(`   📱 otplib (current):     ${otplibCode}`);
    console.log(`   🆕 speakeasy (sha1):     ${speakeasyCode}`);
    console.log(`   🔧 speakeasy (sha256):   ${speakeasyCodeSha256}`);
    console.log(`   🔢 speakeasy (8 digits): ${speakeasyCode8Digits}`);
    
    // Highlight if codes match
    if (otplibCode === speakeasyCode) {
      console.log('   ✅ otplib and speakeasy (sha1) match!');
    } else {
      console.log('   ⚠️  otplib and speakeasy codes differ');
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
});

console.log('📱 Please compare these codes with your authenticator app:');
console.log('');
console.log('1. Check which library generates codes that match your app');
console.log('2. Note the algorithm (sha1/sha256) and digits (6/8) that work');
console.log('3. We\'ll update the automation to use the correct configuration');
console.log('');

// Test with time offset (for timing issues)
console.log('⏰ Testing with time offsets (for timing sync issues):');
console.log('');

accounts.forEach(accountType => {
  const account = config.accounts[accountType];
  const secret = account.totpSecret;
  
  console.log(`${accountType.toUpperCase()}:`);
  
  // Test with different time offsets
  const offsets = [-60, -30, 0, 30, 60]; // seconds
  offsets.forEach(offset => {
    const adjustedTime = Math.floor(Date.now() / 1000) + offset;
    const code = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      time: adjustedTime,
      step: 30,
      digits: 6,
      algorithm: 'sha1'
    });
    
    const label = offset === 0 ? 'current' : offset > 0 ? `+${offset}s` : `${offset}s`;
    console.log(`   ${label.padEnd(8)}: ${code}`);
  });
  
  console.log('');
});
