import fs from 'fs';

let content = fs.readFileSync('./server/storage.ts', 'utf8');

// Step 1: Fix any remaining malformed template literals that start with quotes
content = content.replace(/'([^']*)\$\{([^}]+)\}([^']*?)'/g, "'$1' + $2 + '$3'");

// Step 2: Fix SQL template literals - ensure they use backticks
content = content.replace(/sql'([^']*?)'/g, 'sql`$1`');

// Step 3: Clean up any double concatenations
content = content.replace(/' \+ '' \+ /g, ' + ');
content = content.replace(/'' \+ /g, '');
content = content.replace(/ \+ ''/g, '');

// Step 4: Fix any orphaned ${ patterns
content = content.replace(/\$\{([^}]+)\}/g, "' + $1 + '");

// Step 5: Clean up multiple consecutive + operators
content = content.replace(/ \+ \+ /g, ' + ');

console.log('Applied comprehensive fixes');
fs.writeFileSync('./server/storage.ts', content, 'utf8');