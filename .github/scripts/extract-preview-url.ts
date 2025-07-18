#!/usr/bin/env node

import * as fs from 'fs';

const token = process.env.GITHUB_TOKEN;
const sha = process.env.COMMIT_SHA || process.env.GITHUB_SHA;
const repo = process.env.GITHUB_REPOSITORY;

if (!token || !sha || !repo) {
  console.error(
    'Missing required environment variables: GITHUB_TOKEN, COMMIT_SHA/GITHUB_SHA, GITHUB_REPOSITORY',
  );
  process.exit(1);
}

async function fetchCheckRuns() {
  const response = await fetch(`https://api.github.com/repos/${repo}/commits/${sha}/check-runs`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'ui-automation-script',
    },
  });

  if (!response.ok) {
    console.error(`GitHub API error: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  return await response.json();
}

async function extractPreviewUrl() {
  console.log('Fetching check runs for commit:', sha);

  const checkRunsData = await fetchCheckRuns();
  const cloudflareCheck = checkRunsData.check_runs?.find(
    (run: any) => run.name.includes('Cloudflare Pages') && run.conclusion === 'success',
  );

  if (!cloudflareCheck) {
    console.error('No successful Cloudflare Pages check run found');
    process.exit(1);
  }

  console.log('Found Cloudflare Pages check run:', cloudflareCheck.name);

  let previewUrl = null;

  if (cloudflareCheck.details_url && cloudflareCheck.details_url.includes('.pages.dev')) {
    previewUrl = cloudflareCheck.details_url;
  }

  if (!previewUrl && cloudflareCheck.output) {
    const outputText = cloudflareCheck.output.summary || cloudflareCheck.output.text || '';
    const urlMatches = outputText.match(/https:\/\/[^\s<>"']+\.pages\.dev/g);
    if (urlMatches && urlMatches.length > 0) {
      console.log(`Found ${urlMatches.length} preview URLs:`, urlMatches);

      const branchUrl = urlMatches.find((url: string) => {
        const subdomain = url.split('.')[0].split('//')[1];
        return (
          subdomain &&
          subdomain.length > 8 &&
          /[a-zA-Z-]/.test(subdomain) &&
          !/^[a-f0-9]+$/.test(subdomain)
        );
      });

      const selectedUrl = branchUrl || urlMatches[urlMatches.length - 1];
      let extractedUrl = selectedUrl;
      extractedUrl = extractedUrl
        .replace(/['">]+$/, '')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&');
      previewUrl = extractedUrl;

      console.log(`Using URL: ${previewUrl}${branchUrl ? ' (branch-specific)' : ' (fallback)'}`);
    }
  }

  const eventData = JSON.parse(
    process.env.GITHUB_EVENT_PATH ? fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8') : '{}',
  );
  const prNumber = eventData.pull_request?.number || null;

  console.log('Extracted preview URL:', previewUrl);
  console.log('PR number:', prNumber);

  const shouldRun = previewUrl && prNumber ? 'true' : 'false';

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
