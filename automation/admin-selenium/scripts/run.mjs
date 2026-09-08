import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, open, readFile, unlink, cp } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { seed } from './seed.mjs';

const moduleRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(moduleRoot, '../..');
const args = process.argv.slice(2);
const getArg = (name, fallback) => args.find(arg => arg.startsWith(`--${name}=`))?.split('=').slice(1).join('=') || fallback;
const browser = getArg('browser', 'chrome'), groups = getArg('groups', 'smoke,regression,security'), threads = getArg('threads', '2');
const test = getArg('test', ''), headed = args.includes('--headed'), dev = args.includes('--dev'), serveOnly = args.includes('--serve-only');
for (const arg of args) if (!/^--(browser|groups|threads|test)=/.test(arg) && !['--headed', '--dev', '--serve-only', '--skip-app-build'].includes(arg)) throw new Error(`Unknown argument: ${arg}`);
if (!['chrome', 'firefox', 'edge'].includes(browser) || !/^[1-8]$/.test(threads) || !/^(smoke|regression|security)(,(smoke|regression|security))*$/.test(groups) || (test && !/^[A-Za-z0-9_*,#]+$/.test(test))) throw new Error('Invalid browser, groups, threads, or test selection.');
const port = Number(process.env.E2E_PORT || 8190);
if (!Number.isInteger(port) || port < 1024 || port > 65535 || [8090, 8091].includes(port)) throw new Error('Choose an unused E2E_PORT (default 8190), separate from the working app and legacy QA server.');
const runtime = resolve(moduleRoot, '.runtime'); await mkdir(runtime, { recursive: true });
const lockPath = resolve(runtime, 'runner.lock');
let lock;
try { lock = await open(lockPath, 'wx'); }
catch {
  const owner = Number(await readFile(lockPath, 'utf8'));
  let alive = true; try { process.kill(owner, 0); } catch (error) { if (error.code === 'ESRCH') alive = false; }
  if (alive) throw new Error('Another Selenium sandbox runner is active. Use separate checkouts for independent runs.');
  await unlink(lockPath); lock = await open(lockPath, 'wx');
}
await lock.writeFile(String(process.pid));
const children = new Set(); let interrupted = false;
const runId = `selenium-${Date.now()}-${randomBytes(3).toString('hex')}`;
const directory = resolve(runtime, runId); await mkdir(directory, { recursive: true });
const databaseUrl = `file:${resolve(directory, 'lifeos.db').replaceAll('\\', '/')}`;
const jobSecret = randomBytes(32).toString('hex');
// Bind IPv4 consistently for Java and Node; use localhost URLs below because Next.js normalizes loopback request URLs to that hostname.
const env = { ...process.env, DATABASE_URL: databaseUrl, LIFEOS_TEST_MODE: '1', ADMIN_JOBS_SECRET: jobSecret, PORT: String(port), HOSTNAME: '127.0.0.1' };
delete env.E2E_CONFIG;
const log = createWriteStream(resolve(directory, 'application.log'));
function start(command, commandArgs, options = {}) {
  const child = spawn(command, commandArgs, { cwd: root, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], ...options });
  children.add(child); child.on('exit', () => children.delete(child));
  child.stdout?.on('data', bytes => { process.stdout.write(bytes); log.write(bytes); });
  child.stderr?.on('data', bytes => { process.stderr.write(bytes); log.write(bytes); });
  return child;
}
function completion(child) { return new Promise((resolveDone, reject) => { child.on('error', reject); child.on('exit', code => code === 0 ? resolveDone() : reject(new Error(`Command exited with code ${code}`))); }); }
async function stop(child) {
  if (child.exitCode !== null) return;
  if (process.platform === 'win32') await new Promise(done => { const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); killer.once('error', done); killer.once('exit', done); });
  else { try { process.kill(-child.pid, 'SIGTERM'); } catch { child.kill('SIGTERM'); } }
}
const onSignal = () => { interrupted = true; for (const child of children) void stop(child); };
process.on('SIGINT', onSignal); process.on('SIGTERM', onSignal);
try {
  await new Promise((available, reject) => { const probe = net.createServer(); probe.once('error', reject); probe.listen(port, () => probe.close(available)); });
  console.log(`Preparing isolated Selenium database for ${runId}`);
  await completion(start(process.execPath, ['scripts/admin-setup.mjs']));
  env.E2E_CONFIG = await seed({ databaseUrl, runId, directory, baseUrl: `http://localhost:${port}`, password: `QA!a9${randomBytes(18).toString('hex')}`, jobSecret });
  const dist = resolve(root, '.next-admin-test');
  if (!dev && !args.includes('--skip-app-build')) await completion(start(process.execPath, ['node_modules/next/dist/bin/next', 'build']));
  let server;
  if (dev) server = start(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '-p', String(port)], { detached: process.platform !== 'win32' });
  else {
    await cp(resolve(root, 'public'), resolve(dist, 'standalone/public'), { recursive: true });
    await cp(resolve(dist, 'static'), resolve(dist, 'standalone/.next-admin-test/static'), { recursive: true });
    server = start(process.execPath, [resolve(dist, 'standalone/server.js')], { detached: process.platform !== 'win32' });
  }
  let ready = false;
  for (let attempt = 0; attempt < 120 && !interrupted; attempt++) {
    if (server.exitCode !== null) throw new Error('The test application stopped before becoming ready.');
    try { const response = await fetch(`http://localhost:${port}/login`, { signal: AbortSignal.timeout(3000) }); if (response.ok) { ready = true; break; } } catch { }
    await delay(500);
  }
  if (!ready || interrupted) throw new Error('The sandbox did not become ready. See application.log.');
  console.log(`Sandbox ready at http://localhost:${port}. Configuration: ${env.E2E_CONFIG}`);
  if (serveOnly) { console.log('Set E2E_CONFIG to this file for IDE/Maven runs. Press Ctrl+C to stop.'); await new Promise(done => { process.once('SIGINT', done); process.once('SIGTERM', done); server.once('exit', done); }); }
  else {
    const mavenArgs = ['-B', '-ntp', '-f', resolve(moduleRoot, 'pom.xml'), 'clean', 'verify', `-Dbrowser=${browser}`, `-Dgroups=${groups}`, `-Dthreads=${threads}`, `-Dheadless=${!headed}`, ...(test ? [`-Dtest=${test}`] : [])];
    // cmd requires quoting for .cmd tools; only validated options and a checked path reach this command.
    if (process.platform === 'win32' && mavenArgs.some(value => /["&|<>^%!\r\n]/.test(value))) throw new Error('Maven arguments contain unsupported Windows shell characters.');
    let testError;
    try { await completion(start('mvn', process.platform === 'win32' ? mavenArgs.map(value => `"${value}"`) : mavenArgs, { shell: process.platform === 'win32' })); }
    catch (error) { testError = error; }
    const reportDir = resolve(moduleRoot, 'target/reports'); await mkdir(reportDir, { recursive: true });
    await cp(resolve(directory, 'application.log'), resolve(reportDir, 'application.log'));
    if (testError) throw testError;
    const summary = JSON.parse(await readFile(resolve(reportDir, 'summary.json'), 'utf8'));
    if (!summary.total || summary.failed || summary.skipped || summary.configurationFailures) throw new Error(`Incomplete or failed run: ${JSON.stringify(summary)}`);
    console.log(`PASS ${summary.passed}/${summary.total} tests. Report: ${resolve(reportDir, 'index.html')}`);
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally {
  for (const child of [...children]) await stop(child);
  log.end(); await lock.close(); await unlink(lockPath);
  process.removeListener('SIGINT', onSignal); process.removeListener('SIGTERM', onSignal);
}
