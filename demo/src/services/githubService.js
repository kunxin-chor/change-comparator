const GITHUB_API_BASE = 'https://api.github.com';

export async function fetchCommits(owner, repo, branch = 'main') {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?sha=${branch}&per_page=20`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch commits: ${response.statusText}`);
  }
  
  const commits = await response.json();
  const mappedCommits = commits.map(commit => ({
    sha: commit.sha,
    message: commit.commit.message,
    author: commit.commit.author.name,
    date: commit.commit.author.date,
    shortSha: commit.sha.substring(0, 7)
  }));
  
  // Reverse to show oldest first (chronological order)
  return mappedCommits.reverse();
}

export async function fetchCommitComparison(owner, repo, baseSha, headSha) {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/compare/${baseSha}...${headSha}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch comparison: ${response.statusText}`);
  }
  
  const comparison = await response.json();
  return comparison;
}

export async function fetchFileContent(owner, repo, sha, path) {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}?ref=${sha}`
  );
  
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.content) {
    return atob(data.content);
  }
  
  return null;
}

export async function fetchCommitTree(owner, repo, sha) {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch tree: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.tree.filter(item => item.type === 'blob'); // Only return files, not directories
}

export function parseRepoUrl(url) {
  const githubPattern = /github\.com\/([^\/]+)\/([^\/]+)/;
  const match = url.match(githubPattern);
  
  if (match) {
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, '')
    };
  }
  
  return null;
}

export async function buildChangesetsFromCommits(owner, repo, commits, selectedIndices) {
  console.log('buildChangesetsFromCommits called:', { owner, repo, selectedIndices });
  const changesets = [];
  
  for (let i = 0; i < selectedIndices.length; i++) {
    const commitIndex = selectedIndices[i];
    const commit = commits[commitIndex];
    console.log(`Processing commit ${i + 1}/${selectedIndices.length}:`, commit.shortSha);
    
    // Fetch all files in this commit
    const tree = await fetchCommitTree(owner, repo, commit.sha);
    console.log(`Found ${tree.length} total files in commit`);
    
    // Limit to reasonable file types and sizes
    const validFiles = tree.filter(item => {
      const isValidSize = item.size < 1000000; // Skip files larger than 1MB
      const hasValidExtension = /\.(js|jsx|ts|tsx|py|java|cpp|c|cs|go|rs|rb|php|html|css|scss|json|md|yml|yaml|xml|sh|txt)$/i.test(item.path);
      return isValidSize && hasValidExtension;
    });
    
    console.log(`Fetching content for ${validFiles.length} valid files`);
    
    // Fetch content for each file
    const files = await Promise.all(
      validFiles.map(async (fileItem) => {
        try {
          const content = await fetchFileContent(owner, repo, commit.sha, fileItem.path);
          const language = getLanguageFromFilename(fileItem.path);
          
          return {
            id: `/${fileItem.path}`,
            language: language,
            content: content || '',
            comments: {}
          };
        } catch (error) {
          console.warn(`Failed to fetch ${fileItem.path}:`, error.message);
          return null;
        }
      })
    );
    
    // Filter out failed fetches
    const successfulFiles = files.filter(f => f !== null);
    console.log(`Successfully fetched ${successfulFiles.length} files`);
    
    changesets.push({
      version: i + 1,
      name: commit.message.split('\n')[0],
      sha: commit.sha,
      shortSha: commit.shortSha,
      author: commit.author,
      date: commit.date,
      files: successfulFiles
    });
  }
  
  console.log('Built changesets:', changesets);
  return changesets;
}

function getLanguageFromFilename(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const languageMap = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    md: 'markdown',
    yml: 'yaml',
    yaml: 'yaml',
    xml: 'xml',
    sh: 'bash'
  };
  
  return languageMap[ext] || 'text';
}
