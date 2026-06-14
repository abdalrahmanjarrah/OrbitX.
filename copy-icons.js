import fs from 'fs';
import path from 'path';

const srcFile = path.resolve('favicon.png.jpg');
const publicDir = path.resolve('public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

if (fs.existsSync(srcFile)) {
  fs.copyFileSync(srcFile, path.join(publicDir, 'favicon.png'));
  fs.copyFileSync(srcFile, path.join(publicDir, 'pwa-192x192.png'));
  fs.copyFileSync(srcFile, path.join(publicDir, 'pwa-512x512.png'));
  console.log('[CopyIcons] Successfully copied favicon.png.jpg to public assets.');
} else {
  console.warn('[CopyIcons] Source favicon.png.jpg not found at root.');
}
