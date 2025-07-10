import fetch from 'node-fetch';
import * as fs from 'fs';

const repo = process.env.GITHUB_REPOSITORY; // e.g. "owner/repo"
const sha = process.env.GITHUB_SHA; // commit SHA to search for
const token = process.env.GITHUB_TOKEN; // GitHub token

if (!repo || !sha || !token) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

const [owner, repoName] = repo.split('/');

async function findPR() {
  const url = `https://api.github.com/repos/${owner}/${repoName}/commits/${sha}/pulls`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.groot-preview+json',
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'find-pr-by-sha-script'
    }
  });
  if (!res.ok) {
    console.error(`GitHub API error: ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const prs = await res.json();
  if (!Array.isArray(prs) || prs.length === 0) {
    console.log('No pull request found for this commit.');
    process.exit(0);
  }
  // Use the first PR found
  const pr = prs[0];
  console.log(`Found PR #${pr.number}: ${pr.title}`);
  // Set output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `number=${pr.number}\n`);
  }
}

findPR();
