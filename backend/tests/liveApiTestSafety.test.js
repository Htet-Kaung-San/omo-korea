const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const backendRoot = join(__dirname, '..');

describe('live API test isolation', () => {
  test('default backend tests exclude the mutation-capable live API suite', () => {
    const packageJson = JSON.parse(readFileSync(join(backendRoot, 'package.json'), 'utf8'));
    expect(packageJson.scripts.test).toContain('--testPathIgnorePatterns=tests/api.test.js');
    expect(packageJson.scripts['test:live-api']).toBe('node scripts/run-live-api-tests.mjs');
  });

  test('live API runner fails before Jest without explicit approval', () => {
    const result = spawnSync(
      process.execPath,
      [join(backendRoot, 'scripts', 'run-live-api-tests.mjs')],
      {
        cwd: backendRoot,
        encoding: 'utf8',
        env: { ...process.env, LIVE_SUPABASE_TESTS_APPROVED: '' },
      },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Refusing to run live API tests/);
    expect(result.stderr).toMatch(/mutate the configured Supabase project/);
  });

  test('PR CI uses only non-production import configuration', () => {
    const workflow = readFileSync(join(backendRoot, '..', '.github', 'workflows', 'pr-ci.yml'), 'utf8');
    expect(workflow).toContain('SUPABASE_URL: http://127.0.0.1:54321');
    expect(workflow).toContain('SUPABASE_KEY: ci-only-test-key');
    expect(workflow).toContain('JWT_SECRET: ci-only-test-secret-');
    expect(workflow).not.toMatch(/secrets\.(SUPABASE|JWT)/);
  });
});
