const AWS = require('aws-sdk');

// Health check handler
exports.handler = async (event, context) => {
  const timestamp = new Date().toISOString();
  
  try {
    // Basic health checks
    const checks = {
      timestamp: timestamp,
      environment: process.env.STAGE || 'unknown',
      region: process.env.AWS_REGION || 'unknown',
      functionName: context.functionName,
      functionVersion: context.functionVersion,
      memoryLimit: context.memoryLimitInMB,
      remainingTime: context.getRemainingTimeInMillis()
    };

    // Check SSM parameters instead of environment variables
    let ssmParameterStatus = {};
    try {
      const ssm = new AWS.SSM();
      const parameterNames = [
        '/trading-records/jpw/password',
        '/trading-records/jpw/totp-secret',
        '/trading-records/pew/password',
        '/trading-records/pew/totp-secret',
        '/trading-records/email/from-address',
        '/trading-records/email/to-addresses'
      ];

      const result = await ssm.getParameters({
        Names: parameterNames,
        WithDecryption: true
      }).promise();

      parameterNames.forEach(name => {
        const found = result.Parameters.find(p => p.Name === name);
        const key = name.split('/').pop();
        ssmParameterStatus[key] = found ? 'configured' : 'missing';
      });
    } catch (error) {
      ssmParameterStatus = { error: error.message };
    }

    // Check SES (email) configuration
    let sesStatus = 'unknown';
    try {
      const ses = new AWS.SES();
      const fromEmail = process.env.FROM_EMAIL;
      const toEmails = process.env.TO_EMAILS;
      
      if (fromEmail && toEmails) {
        // Try to get sending quota to verify SES access
        await ses.getSendQuota().promise();
        sesStatus = 'configured';
      } else {
        sesStatus = 'email_addresses_missing';
      }
    } catch (error) {
      sesStatus = `error: ${error.message}`;
    }

    // Check dependencies
    const dependencies = {
      'speakeasy': checkDependency('speakeasy'),
      'moment': checkDependency('moment'),
      'underscore': checkDependency('underscore'),
      'aws-sdk': checkDependency('aws-sdk')
    };

    const healthStatus = {
      status: 'healthy',
      ...checks,
      ssm_parameters: ssmParameterStatus,
      ses_access: sesStatus,
      dependencies: dependencies,
      nodejs_version: process.version,
      platform: process.platform,
      architecture: process.arch
    };

    // Determine overall health
    const hasRequiredParams = !ssmParameterStatus.error && 
      Object.values(ssmParameterStatus).every(status => status === 'configured');
    const hasAllDependencies = Object.values(dependencies).every(status => status === 'available');
    const sesAccessible = sesStatus === 'configured';

    if (!hasRequiredParams || !hasAllDependencies || !sesAccessible) {
      healthStatus.status = 'unhealthy';
      healthStatus.issues = [];
      
      if (!hasRequiredParams) {
        healthStatus.issues.push('Missing required SSM parameters');
      }
      if (!hasAllDependencies) {
        healthStatus.issues.push('Missing required dependencies');
      }
      if (!sesAccessible) {
        healthStatus.issues.push('SES email service not accessible');
      }
    }

    return {
      statusCode: healthStatus.status === 'healthy' ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(healthStatus, null, 2)
    };

  } catch (error) {
    console.error('Health check error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        status: 'error',
        timestamp: timestamp,
        error: error.message,
        functionName: context.functionName
      }, null, 2)
    };
  }
};

// Helper function to check if a dependency is available
function checkDependency(packageName) {
  try {
    require(packageName);
    return 'available';
  } catch (error) {
    return 'missing';
  }
}
