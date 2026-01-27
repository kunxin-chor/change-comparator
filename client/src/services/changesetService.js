export function getLanguageFromPath(path) {
  const ext = path.split('.').pop().toLowerCase();
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

export async function loadChangesetsFromDbDocument(dbDoc) {
  const changesetArray = Array.isArray(dbDoc?.changesets) ? dbDoc.changesets : [];

  const loadedChangesets = await Promise.all(
    changesetArray.map(async (cs) => {
      const files = await Promise.all(
        (cs.files || []).map(async (file) => {
          let content = '';

          if (file.url && !file.url.startsWith('#')) {
            const response = await fetch(file.url);
            if (!response.ok) {
              throw new Error(`Failed to fetch ${file.path}: ${response.status} ${response.statusText}`);
            }
            content = await response.text();
          }

          return {
            id: file.path,
            language: getLanguageFromPath(file.path),
            content,
            url: file.url,
            comments: file.comments || {}
          };
        })
      );

      return {
        version: cs.version,
        name: cs.name,
        sha: cs.sha,
        shortSha: cs.shortSha,
        author: cs.author,
        date: cs.date,
        files
      };
    })
  );

  return loadedChangesets;
}

export function getAllFilesFromChangesets(changesets, pairIndex) {
  if (!changesets[pairIndex] || !changesets[pairIndex + 1]) {
    return [];
  }

  const files1 = changesets[pairIndex].files;
  const files2 = changesets[pairIndex + 1].files;

  const fileMap = new Map();

  files1.forEach((f) => fileMap.set(f.id, f));
  files2.forEach((f) => {
    if (!fileMap.has(f.id)) {
      fileMap.set(f.id, f);
    }
  });

  return Array.from(fileMap.values());
}

export function getFileFromChangeset(changesets, idx, selectedFileId) {
  const file = changesets[idx]?.files.find((f) => f.id === selectedFileId);

  if (file) return file;

  return selectedFileId
    ? {
        id: selectedFileId,
        language: 'text',
        content: '',
        comments: {}
      }
    : null;
}
