
export function validateRequiredEnvVars() {
  const required = [
    'DATABASE_URL',
    'SUPABASE_URL', 
    'SUPABASE_ANON_KEY'
  ];
  
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    return false;
  }
  
  return true;
}

export function validateOptionalEnvVars() {
  const optional = [
    'SENDGRID_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'OPENAI_API_KEY'
  ];
  
  const missing = optional.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.warn('Optional environment variables not set:', missing);
  }
}
