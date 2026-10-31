import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '../dist');
const zipPath = path.join(__dirname, '../../pcs-meet-manager-extension.zip');

console.log('Packaging extension from client/dist into pcs-meet-manager-extension.zip...');

if (!fs.existsSync(distDir)) {
  console.error('Error: client/dist directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

if (fs.existsSync(zipPath)) {
  try {
    fs.unlinkSync(zipPath);
  } catch (e) {}
}

const isWindows = process.platform === 'win32';
if (isWindows) {
  execSync(`powershell -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipPath}' -Force"`);
} else {
  execSync(`cd "${distDir}" && zip -r "${zipPath}" ./*`);
}

const stats = fs.statSync(zipPath);
console.log(`Extension package successfully created: ${zipPath} (${Math.round(stats.size / 1024)} KB)`);
