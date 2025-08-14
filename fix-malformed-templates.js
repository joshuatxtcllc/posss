import fs from 'fs';

const content = fs.readFileSync('./server/storage.ts', 'utf8');

// Fix the specific malformed template literals
let fixed = content
  .replace(/Order #\$\{order\.id\}/g, "Order #' + order.id + '")
  .replace(/Your order is now \$\{status\.split\('_'\)\.join\(' '\)\}/g, "Your order is now ' + status.split('_').join(' ') + '")
  .replace(/Status update email \$\{emailSent \? 'sent' : 'failed'\} for Order #\$\{order\.id\} to \$\{customer\.email\}/g, "Status update email ' + (emailSent ? 'sent' : 'failed') + ' for Order #' + order.id + ' to ' + customer.email")
  .replace(/\$\{([^}]+)\}/g, "' + $1 + '")
  .replace(/' \+ '' \+ /g, " + ")
  .replace(/'' \+ /g, "")
  .replace(/ \+ ''/g, "");

fs.writeFileSync('./server/storage.ts', fixed, 'utf8');
console.log('Fixed malformed template literals');