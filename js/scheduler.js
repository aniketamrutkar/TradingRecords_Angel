const schedule = require('node-schedule');
const fs = require('fs');
const { fetchTradeData } = require('./automated-fetch');

// Load configuration
let config;
try {
  config = JSON.parse(fs.readFileSync('./data/config.json', 'utf-8'));
} catch (error) {
  console.error('❌ Failed to load data/config.json:', error.message);
  process.exit(1);
}

// Create logs directory if it doesn't exist
const logsDir = './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Function to write logs
function writeLog(message, isError = false) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  // Write to console
  if (isError) {
    console.error(logMessage.trim());
  } else {
    console.log(logMessage.trim());
  }
  
  // Write to log file
  const logFile = `${logsDir}/scheduler-${new Date().toISOString().split('T')[0]}.log`;
  fs.appendFileSync(logFile, logMessage);
}

// Scheduled job function
async function runScheduledJob() {
  writeLog('🕕 Scheduled job triggered - Starting trade data fetch');
  
  try {
    const result = await fetchTradeData();
    
    if (result.success) {
      writeLog('✅ Scheduled job completed successfully');
    } else {
      writeLog(`❌ Scheduled job failed: ${result.error}`, true);
    }
  } catch (error) {
    writeLog(`❌ Scheduled job error: ${error.message}`, true);
  }
}

// Schedule the job
console.log('🚀 Starting Angel Broking Trade Report Scheduler');
console.log(`📅 Schedule: ${config.schedule.description} (${config.schedule.time})`);
console.log('📝 Logs will be written to ./logs/ directory');
console.log('⏰ Scheduler is now running... Press Ctrl+C to stop');

const job = schedule.scheduleJob(config.schedule.time, runScheduledJob);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Scheduler shutting down gracefully...');
  if (job) {
    job.cancel();
  }
  writeLog('🛑 Scheduler stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Scheduler received SIGTERM, shutting down...');
  if (job) {
    job.cancel();
  }
  writeLog('🛑 Scheduler stopped via SIGTERM');
  process.exit(0);
});

// Log scheduler start
writeLog('🚀 Scheduler started successfully');
