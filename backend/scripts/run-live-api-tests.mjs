import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const approvalVariable = 'LIVE_SUPABASE_TESTS_APPROVED';
if (process.env[approvalVariable] !== 'true') {
  console.error(
    `Refusing to run live API tests without ${approvalVariable}=true. ` +
    'These tests mutate the configured Supabase project.',
  );
  process.exit(1);
}

for (const key of ['SUPABASE_URL', 'SUPABASE_KEY', 'JWT_SECRET']) {
  if (!process.env[key]) {
    console.error(`Refusing to run live API tests because ${key} is missing.`);
    process.exit(1);
  }
}

let target;
try {
  target = new URL(process.env.SUPABASE_URL);
} catch {
  console.error('Refusing to run live API tests because SUPABASE_URL is invalid.');
  process.exit(1);
}

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const jestBin = join(backendRoot, 'node_modules', 'jest', 'bin', 'jest.js');
console.error(`Running mutation-capable live API tests against ${target.hostname}.`);
const result = spawnSync(
  process.execPath,
  [jestBin, '--runInBand', 'tests/api.test.js', ...process.argv.slice(2)],
  { cwd: backendRoot, env: process.env, stdio: 'inherit' },
);
process.exit(result.status ?? 1);
