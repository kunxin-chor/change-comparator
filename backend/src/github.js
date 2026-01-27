const fetchImport = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const GITHUB_API_BASE = 'https://api.github.com';

function parseRepoUrl(url) {
  const githubPattern = /github\.com\/([^\/]+)\/([^\/]+)/;
  const match = url.match(githubPattern);

  if (!match) return null;

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, '')
  };
}

function buildHeaders(token) {
  const headers = {
    Accept: 'application/vnd.github.v3+json'
  };

  if (token) {
    headers.Authorization = `token ${token}`;
  }

  return headers;
}

async function fetchJson(url, token) {
  const res = await fetchImport(url, { headers: buildHeaders(token) });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub API error ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

function filterTreeFiles(tree) {
  return tree
    .filter((item) => {
      if (item.type !== 'blob') return false;
      const isValidSize = typeof item.size === 'number' ? item.size < 1000000 : true;
      const hasValidExtension = /\.(js|jsx|ts|tsx|py|java|cpp|c|cs|go|rs|rb|php|html|css|scss|json|md|yml|yaml|xml|sh|txt)$/i.test(item.path);
      return isValidSize && hasValidExtension;
    })
    .map((item) => ({
      path: `/${item.path}`,
      url: item.url // placeholder
    }));
}

async function buildChangesetsFromRepo({ repoUrl, branch = 'main', token = '', commitCount = 4 }) {
  const parsed = parseRepoUrl(repoUrl);
  if (!parsed) {
    throw new Error('Invalid GitHub repo URL');
  }

  const commitsUrl = `${GITHUB_API_BASE}/repos/${parsed.owner}/${parsed.repo}/commits?sha=${encodeURIComponent(branch)}&per_page=${commitCount}`;
  const commitsData = await fetchJson(commitsUrl, token);

  const commits = commitsData
    .map((c) => ({
      sha: c.sha,
      shortSha: c.sha.substring(0, 7),
      message: c.commit.message,
      author: c.commit.author?.name || 'unknown',
      date: c.commit.author?.date || null
    }))
    .reverse(); // oldest first

  if (commits.length < 2) {
    throw new Error('Need at least 2 commits to build a changeset comparison');
  }

  const changesets = [];

  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    const treeUrl = `${GITHUB_API_BASE}/repos/${parsed.owner}/${parsed.repo}/git/trees/${commit.sha}?recursive=1`;
    const treeData = await fetchJson(treeUrl, token);

    const files = treeData.tree
      .filter((item) => {
        if (item.type !== 'blob') return false;
        const isValidSize = typeof item.size === 'number' ? item.size < 1000000 : true;
        const hasValidExtension = /\.(js|jsx|ts|tsx|py|java|cpp|c|cs|go|rs|rb|php|html|css|scss|json|md|yml|yaml|xml|sh|txt)$/i.test(item.path);
        return isValidSize && hasValidExtension;
      })
      .map((item) => ({
        path: `/${item.path}`,
        url: `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${commit.sha}/${item.path}`,
        comments: {}
      }));

    changesets.push({
      version: i + 1,
      name: commit.message.split('\n')[0],
      sha: commit.sha,
      shortSha: commit.shortSha,
      author: commit.author,
      date: commit.date,
      files
    });
  }

  return changesets;
}

module.exports = {
  parseRepoUrl,
  buildChangesetsFromRepo
};
