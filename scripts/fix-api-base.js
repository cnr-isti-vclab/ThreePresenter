import { readdir, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiDir = join(__dirname, '../docs/api');

async function processHtmlFiles(dir) {
  let count = 0;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      count += await processHtmlFiles(fullPath);
    } else if (entry.name.endsWith('.html')) {
      const content = await readFile(fullPath, 'utf-8');
      if (!content.includes('<base href')) {
        const updated = content.replace(/<head>/, '<head><base href="./">');
        await writeFile(fullPath, updated, 'utf-8');
        count++;
      }
    }
  }
  return count;
}

console.log('Adding base tags to TypeDoc HTML files...');
const modified = await processHtmlFiles(apiDir);
console.log(`✓ Modified ${modified} files`);
