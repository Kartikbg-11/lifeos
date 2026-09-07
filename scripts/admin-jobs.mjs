// Schedule this command once per minute on the application host.
// node --env-file=.env scripts/admin-jobs.mjs
if (!process.env.ADMIN_JOBS_SECRET || process.env.ADMIN_JOBS_SECRET.length < 32) throw new Error('Set ADMIN_JOBS_SECRET to a random value of at least 32 characters.');
const origin = process.env.LIFEOS_ORIGIN || 'http://localhost:8090';
const response = await fetch(`${origin}/api/internal/admin-jobs`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.ADMIN_JOBS_SECRET}` } });
if (!response.ok) throw new Error(`Job runner failed (${response.status}).`);
console.log(JSON.stringify(await response.json()));
