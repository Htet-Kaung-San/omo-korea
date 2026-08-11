const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const workflow = readFileSync(
  join(__dirname, '..', '..', '.github', 'workflows', 'sync-notices.yml'),
  'utf8',
);
const seedScript = readFileSync(
  join(__dirname, '..', 'scripts', 'seed-notices.mjs'),
  'utf8',
);

describe('notice synchronization scheduler', () => {
  test('runs every 15 minutes and supports deliberate manual runs', () => {
    expect(workflow).toMatch(/workflow_dispatch:/);
    expect(workflow).toMatch(/cron:\s*'\*\/15 \* \* \* \*'/);
  });

  test('prevents overlapping production synchronizations', () => {
    expect(workflow).toMatch(/group:\s*sync-pnu-notices/);
    expect(workflow).toMatch(/cancel-in-progress:\s*false/);
    expect(workflow).toMatch(/timeout-minutes:\s*20/);
  });

  test('uses only repository secrets and the reviewed sync command', () => {
    expect(workflow).toMatch(/working-directory:\s*backend/);
    expect(workflow).toMatch(/run:\s*npm ci/);
    expect(workflow).toMatch(/run:\s*npm run seed:notices/);
    expect(workflow).toContain('secrets.SUPABASE_URL');
    expect(workflow).toContain('secrets.SUPABASE_KEY');
    expect(workflow).not.toMatch(/https:\/\/[^\s]+\.supabase\.co/);
  });

  test('configures the Node 20 WebSocket transport used by the workflow', () => {
    expect(seedScript).toMatch(/import WebSocket from 'ws'/);
    expect(seedScript).toMatch(/realtime:\s*\{\s*transport:\s*WebSocket\s*\}/);
  });
});
