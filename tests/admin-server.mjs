import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '-p', '8091'], { stdio: 'inherit', env: { ...process.env, DATABASE_URL: `file:${resolve('db/admin-test.db').replaceAll('\\', '/')}`, LIFEOS_TEST_MODE: '1', ADMIN_JOBS_SECRET: 'isolated-admin-qa-secret-32-characters-only' } });
server.on('exit', code => process.exit(code || 0));
