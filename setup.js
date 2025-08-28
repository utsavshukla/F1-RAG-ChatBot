#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🏎️  Setting up F1 RAG Chatbot...');
console.log('================================\n');

// First things first - let's make sure we have the right Node version
const currentNodeVersion = process.version;
const minimumNodeVersion = '18.0.0';

if (compareVersions(currentNodeVersion, minimumNodeVersion) < 0) {
  console.error(`Oops! You need Node.js ${minimumNodeVersion} or higher.`);
  console.error(`You're currently running ${currentNodeVersion}`);
  console.error('Please update Node.js and try again.');
  process.exit(1);
}

console.log(`Great! Node.js ${currentNodeVersion} is compatible.`);

// Let's set up the environment file
const envFilePath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envFilePath)) {
  console.log('\nSetting up your environment configuration...');
  
  try {
    const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envFilePath, exampleContent);
    console.log('Environment file created successfully!');
    console.log('\n⚠️  Important: You\'ll need to add your HuggingFace API key to the .env file');
    console.log('   Visit https://huggingface.co/settings/tokens to get one (it\'s free!)');
  } catch (error) {
    console.error('Failed to create .env file:', error.message);
    process.exit(1);
  }
} else {
  console.log('Environment file already exists - skipping creation.');
}

// Now let's handle the dependencies
const backendDepsPath = path.join(__dirname, 'node_modules');
const frontendDepsPath = path.join(__dirname, 'client', 'node_modules');

if (!fs.existsSync(backendDepsPath)) {
  console.log('\nInstalling backend dependencies (this might take a minute)...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('Backend dependencies installed successfully!');
  } catch (error) {
    console.error('Something went wrong installing backend dependencies:', error.message);
    console.error('Try running "npm install" manually');
    process.exit(1);
  }
} else {
  console.log('Backend dependencies are already installed.');
}

if (!fs.existsSync(frontendDepsPath)) {
  console.log('\nInstalling frontend dependencies...');
  try {
    const clientPath = path.join(__dirname, 'client');
    execSync('npm install', { cwd: clientPath, stdio: 'inherit' });
    console.log('Frontend dependencies installed successfully!');
  } catch (error) {
    console.error('Failed to install frontend dependencies:', error.message);
    console.error('You might need to run "cd client && npm install" manually');
    process.exit(1);
  }
} else {
  console.log('Frontend dependencies are already installed.');
}

// Quick check to see if they still need to configure their API key
try {
  const envContent = fs.readFileSync(envFilePath, 'utf8');
  if (envContent.includes('your_huggingface_api_key_here')) {
    console.log('\n🔑 Don\'t forget to set up your HuggingFace API key!');
    console.log('   1. Visit https://huggingface.co/settings/tokens');
    console.log('   2. Create a new access token (it\'s free)');
    console.log('   3. Replace "your_huggingface_api_key_here" in your .env file');
    console.log('   4. Save the file');
  }
} catch (error) {
  // If we can't read the env file, that's okay - they'll figure it out
}

console.log('\n🎉 All set! Your F1 RAG Chatbot is ready to go.');
console.log('\n🚀 To start the application, run:');
console.log('   npm run dev');
console.log('\n📚 Check out the README.md for more details and usage tips.');

// Helper function to compare version numbers
function compareVersions(current, required) {
  // Remove the 'v' prefix if it exists and split into numbers
  const parseVersion = version => version.replace(/^v/, '').split('.').map(Number);
  
  const currentParts = parseVersion(current);
  const requiredParts = parseVersion(required);
  
  // Compare each part of the version number
  const maxLength = Math.max(currentParts.length, requiredParts.length);
  
  for (let i = 0; i < maxLength; i++) {
    const currentPart = currentParts[i] || 0;
    const requiredPart = requiredParts[i] || 0;
    
    if (currentPart < requiredPart) return -1;
    if (currentPart > requiredPart) return 1;
  }
  
  return 0; // Versions are equal
}
