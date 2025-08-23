const fs = require('fs');
const readline = require('readline');
const speakeasy = require('speakeasy');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupTOTPSecrets() {
  console.log('🔐 TOTP Secret Setup for Angel Broking Automation');
  console.log('==================================================');
  console.log('');
  console.log('To automate TOTP generation, you need to provide the secret keys');
  console.log('from your authenticator app setup.');
  console.log('');
  console.log('📱 How to find your TOTP secret:');
  console.log('1. When setting up 2FA in Angel Broking, you get a QR code');
  console.log('2. Instead of scanning, look for "Can\'t scan?" or "Manual entry" option');
  console.log('3. This will show you a secret key (usually 16-32 characters)');
  console.log('4. This is your TOTP secret - save it securely!');
  console.log('');
  console.log('⚠️  SECURITY NOTE: These secrets are equivalent to your 2FA device.');
  console.log('   Store them securely and never share them.');
  console.log('');

  try {
    // Load existing config
    let config;
    try {
      config = JSON.parse(fs.readFileSync('./data/config.json', 'utf-8'));
    } catch (error) {
      console.log('❌ Could not load data/config.json. Please ensure it exists.');
      process.exit(1);
    }

    console.log('🔧 Current configuration:');
    console.log(`   JPW Account: ${config.accounts.jpw.clientcode}`);
    console.log(`   PEW Account: ${config.accounts.pew.clientcode}`);
    console.log('');
        //PEW - KHSU3FP4ESPGGX7JCJ6SYTUDZU
    //JPW - CZNAVEKWXYEAXOZISJI7IMBF7E

    // Get JPW TOTP secret
    console.log('👩 Setting up JPW account TOTP secret:');
    const jpwSecret = await question('Enter TOTP secret for JPW (J77302): ');

    if (jpwSecret && jpwSecret.trim() !== '') {
      // Test the secret
      try {
        const testToken = speakeasy.totp({
          secret: jpwSecret.trim(),
          encoding: 'base32',
          time: Math.floor(Date.now() / 1000),
          step: 30,
          digits: 6,
          algorithm: 'sha1'
        });
        console.log(`✅ JPW TOTP secret valid. Test token: ${testToken}`);
        config.accounts.jpw.totpSecret = jpwSecret.trim();
      } catch (error) {
        console.log('❌ Invalid TOTP secret for JPW account');
        process.exit(1);
      }
    } else {
      console.log('❌ TOTP secret cannot be empty');
      process.exit(1);
    }

    console.log('');

        // Get PEW TOTP secret
    console.log('👨 Setting up PEW account TOTP secret:');
    const pewSecret = await question('Enter TOTP secret for PEW (W1573): ');

    if (pewSecret && pewSecret.trim() !== '') {
      // Test the secret
      try {
        const testToken = speakeasy.totp({
          secret: pewSecret.trim(),
          encoding: 'base32',
          time: Math.floor(Date.now() / 1000),
          step: 30,
          digits: 6,
          algorithm: 'sha1'
        });
        console.log(`✅ PEW TOTP secret valid. Test token: ${testToken}`);
        config.accounts.pew.totpSecret = pewSecret.trim();
      } catch (error) {
        console.log('❌ Invalid TOTP secret for PEW account');
        process.exit(1);
      }
    } else {
      console.log('❌ TOTP secret cannot be empty');
      process.exit(1);
    }

    // Save updated config
    fs.writeFileSync('./data/config.json', JSON.stringify(config, null, 2));
    console.log('');
    console.log('✅ TOTP secrets configured successfully!');
    console.log('💾 Configuration saved to data/config.json');
    console.log('');
    console.log('🚀 You can now run:');
    console.log('   npm run fetch-now          # Run once manually');
    console.log('   npm run start-scheduler    # Start daily scheduler');
    console.log('');
    console.log('📋 Or use direct paths:');
    console.log('   node js/automated-fetch.js    # Run once manually');
    console.log('   node js/scheduler.js          # Start daily scheduler');
    console.log('   ./scripts/start-scheduler.sh  # Start with shell script');
    console.log('');
    console.log('🔒 Keep your data/config.json file secure and never commit it to version control!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Show help if requested
if (process.argv[2] === '--help' || process.argv[2] === '-h') {
  console.log(`
TOTP Secret Setup Helper
========================

This script helps you configure TOTP secrets for automated Angel Broking login.

Usage: node js/setup-totp.js
   Or: npm run setup

What you'll need:
- TOTP secret keys from your Angel Broking 2FA setup
- Access to your authenticator app for verification

The script will:
1. Prompt for TOTP secrets for both accounts
2. Validate the secrets by generating test tokens
3. Save the configuration to config.json

Security:
- Secrets are stored locally in data/config.json
- Never share these secrets or commit them to version control
- These secrets are equivalent to your physical 2FA device
  `);
  process.exit(0);
}

setupTOTPSecrets();
