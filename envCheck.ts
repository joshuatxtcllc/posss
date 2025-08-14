
// Environment check for deployment
const requiredEnvVars = [
  'DATABASE_URL',
  'NODE_ENV'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn('Warning: Missing environment variables:', missingVars.join(', '));
}

export const envCheck = () => ({
  hasRequired: missingVars.length === 0,
  missing: missingVars
});
