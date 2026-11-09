import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('🚀 Starting PCS Meet Manager (Server on Port 5000 & Client on Port 5173)...');

const serverProc = spawn(npmCmd, ['start'], {
  cwd: path.join(rootDir, 'server'),
  stdio: 'inherit',
  shell: true,
});

const clientProc = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'client'),
  stdio: 'inherit',
  shell: true,
});

const cleanup = () => {
  console.log('\nShutting down PCS Meet Manager servers...');
  try { serverProc.kill('SIGTERM'); } catch (e) {}
  try { clientProc.kill('SIGTERM'); } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
