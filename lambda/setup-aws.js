#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function executeCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    console.log(`✅ ${description} completed`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

function checkAWSCLI() {
  try {
    execSync('aws --version', { stdio: 'pipe' });
    console.log('✅ AWS CLI is installed');
    return true;
  } catch (error) {
    console.log('❌ AWS CLI is not installed');
    return false;
  }
}

function checkServerless() {
  try {
    execSync('serverless --version', { stdio: 'pipe' });
    console.log('✅ Serverless Framework is installed');
    return true;
  } catch (error) {
    console.log('❌ Serverless Framework is not installed');
    return false;
  }
}

async function setupAWSParameters() {
  console.log('\n📝 Setting up AWS Systems Manager Parameters for sensitive data...\n');
  
  const parameters = [
    {
      name: '/trading-records/jpw/password',
      description: 'Password for JPW account (J77302)',
      type: 'SecureString'
    },
    {
      name: '/trading-records/jpw/totp-secret',
      description: 'TOTP secret for JPW account (J77302)',
      type: 'SecureString'
    },
    {
      name: '/trading-records/pew/password',
      description: 'Password for PEW account (W1573)',
      type: 'SecureString'
    },
    {
      name: '/trading-records/pew/totp-secret',
      description: 'TOTP secret for PEW account (W1573)',
      type: 'SecureString'
    },
    {
      name: '/trading-records/email/from-address',
      description: 'Email address to send reports from (must be verified in SES)',
      type: 'String'
    },
    {
      name: '/trading-records/email/to-addresses',
      description: 'Comma-separated list of email addresses to send reports to',
      type: 'String'
    }
  ];

  for (const param of parameters) {
    console.log(`\n🔐 Setting up parameter: ${param.name}`);
    console.log(`Description: ${param.description}`);
    
    const value = await askQuestion(`Enter value for ${param.name}: `);
    
    if (!value) {
      console.log('⚠️  Skipping empty value');
      continue;
    }

    try {
      const command = `aws ssm put-parameter --name "${param.name}" --value "${value}" --type "${param.type}" --description "${param.description}" --overwrite`;
      executeCommand(command, `Setting parameter ${param.name}`);
    } catch (error) {
      console.error(`❌ Failed to set parameter ${param.name}:`, error.message);
    }
  }
}

async function createEnvFile() {
  console.log('\n📄 Creating local environment file for testing...\n');
  
  const envContent = `# Local environment variables for Lambda testing
# DO NOT commit this file to version control!

# AWS Configuration
AWS_REGION=us-east-1
STAGE=dev

# Angel Broking Account Details (non-sensitive)
JPW_CLIENT_CODE=J77302
PEW_CLIENT_CODE=W1573
JPW_PRIVATE_KEY=TUOTya6a
PEW_PRIVATE_KEY=VqJ4o4G6

# Network Configuration
CLIENT_LOCAL_IP=192.168.1.1
CLIENT_PUBLIC_IP=1.1.1.1
MAC_ADDRESS=aa:bb:cc:dd:ee:ff

# Email Configuration
FROM_EMAIL=your-verified-email@yourdomain.com
TO_EMAILS=recipient1@example.com,recipient2@example.com

# Sensitive Configuration (for local testing only - use AWS SSM in production)
# Uncomment and fill these for local testing:
# JPW_PASSWORD=your_jpw_password_here
# JPW_TOTP_SECRET=your_jpw_totp_secret_here
# PEW_PASSWORD=your_pew_password_here
# PEW_TOTP_SECRET=your_pew_totp_secret_here
`;

  fs.writeFileSync('.env', envContent);
  console.log('✅ Created .env file for local testing');
  console.log('⚠️  Remember to add .env to your .gitignore file!');
}

async function updateGitignore() {
  const gitignoreContent = `
# AWS Lambda Environment
.env
.env.local
.env.*.local

# Serverless Framework
.serverless/
.serverless_plugins/

# AWS
.aws/

# Logs
logs/
*.log

# Sensitive configuration
data/config.json

# Build artifacts
dist/
build/
`;

  try {
    let existingGitignore = '';
    if (fs.existsSync('.gitignore')) {
      existingGitignore = fs.readFileSync('.gitignore', 'utf-8');
    }

    if (!existingGitignore.includes('.env')) {
      fs.appendFileSync('.gitignore', gitignoreContent);
      console.log('✅ Updated .gitignore with Lambda-specific entries');
    } else {
      console.log('✅ .gitignore already contains necessary entries');
    }
  } catch (error) {
    console.error('⚠️  Could not update .gitignore:', error.message);
  }
}

async function main() {
  console.log('🚀 AWS Lambda Setup for Trading Records Angel\n');
  
  try {
    // Check prerequisites
    console.log('📋 Checking prerequisites...\n');
    
    const hasAWSCLI = checkAWSCLI();
    const hasServerless = checkServerless();
    
    if (!hasAWSCLI) {
      console.log('\n📦 Please install AWS CLI first:');
      console.log('   macOS: brew install awscli');
      console.log('   Windows: https://aws.amazon.com/cli/');
      console.log('   Linux: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html');
      process.exit(1);
    }
    
    if (!hasServerless) {
      console.log('\n📦 Installing Serverless Framework...');
      try {
        executeCommand('npm install -g serverless', 'Installing Serverless Framework globally');
      } catch (error) {
        console.log('⚠️  Could not install Serverless Framework globally. Install it manually:');
        console.log('   npm install -g serverless');
        process.exit(1);
      }
    }

    // Check AWS credentials
    try {
      executeCommand('aws sts get-caller-identity', 'Checking AWS credentials');
    } catch (error) {
      console.log('\n🔑 AWS credentials not configured. Please run:');
      console.log('   aws configure');
      console.log('   Or set up AWS credentials using environment variables or IAM roles');
      process.exit(1);
    }

    // Install dependencies
    console.log('\n📦 Installing project dependencies...');
    executeCommand('npm install', 'Installing Node.js dependencies');

    // Setup AWS parameters
    const setupParams = await askQuestion('\n🔐 Do you want to set up AWS Systems Manager parameters for sensitive data? (y/n): ');
    if (setupParams.toLowerCase() === 'y' || setupParams.toLowerCase() === 'yes') {
      await setupAWSParameters();
    }

    // Create environment file
    const createEnv = await askQuestion('\n📄 Do you want to create a local .env file for testing? (y/n): ');
    if (createEnv.toLowerCase() === 'y' || createEnv.toLowerCase() === 'yes') {
      await createEnvFile();
    }

    // Update .gitignore
    await updateGitignore();

    console.log('\n✅ AWS Lambda setup completed successfully!\n');
    console.log('📋 Next steps:');
    console.log('   1. Configure your sensitive parameters in AWS Systems Manager');
    console.log('   2. Verify your FROM_EMAIL address in Amazon SES:');
    console.log('      aws ses verify-email-identity --email-address your-email@domain.com');
    console.log('   3. Test locally: npm run lambda:offline');
    console.log('   4. Deploy to AWS: npm run lambda:deploy:dev');
    console.log('   5. Check logs: npm run lambda:logs');
    console.log('   6. Test the deployed function: npm run lambda:invoke\n');
    console.log('⚠️  IMPORTANT: You must verify your FROM_EMAIL address in Amazon SES before sending emails!');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the setup if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
