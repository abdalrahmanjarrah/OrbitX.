import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const srcFile = path.resolve('favicon.png.jpg');
const publicDir = path.resolve('public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

if (!fs.existsSync(srcFile)) {
  console.warn('[CopyIcons] Source favicon.png.jpg not found at root.');
  process.exit(0);
}

const resize = (out, size) => {
  const py = `from PIL import Image; s=Image.open('${srcFile}').convert('RGBA'); s.resize((${size},${size}), Image.LANCZOS).save('${path.join(publicDir, out)}','PNG')`;
  execFileSync('python3', ['-c', py]);
};

fs.copyFileSync(srcFile, path.join(publicDir, 'favicon.png'));
resize('pwa-192x192.png', 192);
resize('pwa-512x512.png', 512);
console.log('[CopyIcons] Resized real PNG icons generated.');
