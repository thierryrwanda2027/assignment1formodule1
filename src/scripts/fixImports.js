const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../routes/v1');

const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'index.ts');

files.forEach(file => {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');
  content = content.replace(/from \"\.\.\//g, 'from "../../');
  content = content.replace(/from \'\.\.\//g, "from '../../");
  fs.writeFileSync(p, content);
});

console.log("Imports fixed");
