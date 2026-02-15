/* eslint-env node */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Function to load .env file manually since dotenv might not be installed
function loadEnv() {
  try {
  const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      console.error('Error: .env file not found at', envPath);
      process.exit(1);
    }
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const env = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
        env[key] = value;
      }
    });
    return env;
  } catch (error) {
    console.error('Error loading .env file:', error);
    process.exit(1);
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function sendResetEmail() {
  const email = process.argv[2];
  if (!email) {
    console.error('Please provide an email address.');
    console.error('Usage: node scripts/trigger-reset-email.js <email>');
    process.exit(1);
  }

  console.log(`Attempting to send password reset email to: ${email}`);
  console.log(`Using Supabase URL: ${supabaseUrl}`);

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'http://localhost:5173/update-password',
  });

  if (error) {
    console.error('Error sending reset email:', error.message);
    console.error('Full Error:', error);
  } else {
    console.log('Success! Password reset email request sent to Supabase.');
    console.log('Check your email inbox (and spam folder).');
    console.log('If you are using a local Supabase instance, check InBucket at http://localhost:54324');
  }
}

sendResetEmail();
