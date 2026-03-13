const { spawnSync } = require('node:child_process');

const currentNodeOptions = process.env.NODE_OPTIONS || '';
const hasLegacyOpenSslFlag = currentNodeOptions.includes('--openssl-legacy-provider');

const env = {
  ...process.env,
  NODE_OPTIONS: hasLegacyOpenSslFlag
    ? currentNodeOptions
    : `${currentNodeOptions} --openssl-legacy-provider`.trim(),
};

const result = spawnSync(
  process.execPath,
  [require.resolve('react-scripts/bin/react-scripts.js'), 'build'],
  { stdio: 'inherit', env }
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
