#!/usr/bin/env node
const { execSync, spawn } = require('child_process');

function getGitHash() {
  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch (error) {
    return 'local-build';
  }
}

// If called with arguments, run the command with git hash
if (process.argv.length > 2) {
  const gitHash = getGitHash();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  const env = {
    ...process.env,
    VITE_APP_GIT_HASH: gitHash,
  };

  // Add NODE_OPTIONS for build commands
  if (args.includes('build')) {
    env.NODE_OPTIONS = '--max-old-space-size=8192';
  }

  console.log(`Running ${command} ${args.join(' ')} with git hash: ${gitHash}`);

  const child = spawn(command, args, {
    stdio: 'inherit',
    env,
    shell: true,
  });

  child.on('exit', code => process.exit(code || 0));
  child.on('error', error => {
    console.error('Command failed:', error);
    process.exit(1);
  });
} else {
  // Just output the git hash
  process.stdout.write(getGitHash());
}
