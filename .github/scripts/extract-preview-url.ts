#!/usr/bin/env node

// Type declarations for Node.js environment
declare const process: {
  env: Record<string, string | undefined>;
  exit: (code?: number) => never;
};

declare const require: (module: string) => any;

// Use require instead of import for Node.js script
const fs = require('fs');

const checkRun = JSON.parse(
  process.env.GITHUB_EVENT_PATH ? fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8') : '{}',
).check_run;

if (!checkRun) {
  console.error('No check run data found.');
  process.exit(1);
}

async function extractPreviewUrl() {
  console.log('Check run details:', JSON.stringify(checkRun, null, 2));

  // Extract preview URL from check run details
  let previewUrl = null;

  // Check the details_url first (this often contains the preview URL)
  if (checkRun.details_url && checkRun.details_url.includes('.pages.dev')) {
    previewUrl = checkRun.details_url;
  }

  // If not found, check the output summary or text
  if (!previewUrl && checkRun.output) {
    const outputText = checkRun.output.summary || checkRun.output.text || '';
    const urlMatch = outputText.match(/https:\/\/[^\s]+\.pages\.dev[^\s]*/);
    if (urlMatch) {
      previewUrl = urlMatch[0];
    }
  }

  // Find associated PR
  let prNumber = null;
  if (checkRun.pull_requests && checkRun.pull_requests.length > 0) {
    prNumber = checkRun.pull_requests[0].number;
  }

  console.log('Extracted preview URL:', previewUrl);
  console.log('PR number:', prNumber);

  const shouldRun = previewUrl && prNumber ? 'true' : 'false';

  // Set outputs for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `url=${previewUrl || ''}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `pr_number=${prNumber || ''}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `should_run=${shouldRun}\n`);
  }

  if (shouldRun === 'true') {
    console.log(`Will run tests for PR #${prNumber} against ${previewUrl}`);
  } else {
    console.log(`Missing required information - PR: ${prNumber}, URL: ${previewUrl}`);
  }
}

extractPreviewUrl();
