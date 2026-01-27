// Service for handling changeset operations

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

export async function loadChangesetsFromUrls(inputChangesets) {
  const loadedChangesets = await Promise.all(
    inputChangesets.map(async (changeset, index) => {
      const files = await Promise.all(
        changeset.files.map(async (file) => {
          const response = await fetch(file.url);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${file.path}: ${response.statusText}`);
          }
          const content = await response.text();
          const language = getLanguageFromPath(file.path);
          
          return {
            id: file.path,
            language: language,
            content: content,
            comments: {}
          };
        })
      );
      
      return {
        version: index + 1,
        name: changeset.name || `Version ${index + 1}`,
        files: files
      };
    })
  );
  
  return loadedChangesets;
}

export async function loadChangesetsFromSaved(changeset) {
  const loadedChangesets = await Promise.all(
    changeset.map(async (cs) => {
      const files = await Promise.all(
        cs.files.map(async (file) => {
          let content = '';
          
          // Fetch from URL if it's valid (not a placeholder)
          if (file.url && !file.url.startsWith('#')) {
            try {
              const response = await fetch(file.url);
              if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText}`);
              }
              content = await response.text();
            } catch (error) {
              console.error(`Failed to fetch ${file.path}:`, error);
              content = `// Error loading file: ${error.message}`;
            }
          }
          
          const language = getLanguageFromPath(file.path);
          
          return {
            id: file.path,
            language: language,
            content: content,
            url: file.url,
            comments: file.comments || {}
          };
        })
      );
      
      return {
        ...cs,
        files: files
      };
    })
  );
  
  return loadedChangesets;
}

export function getAllFilesFromChangesets(changesets, timelineIndex) {
  if (!changesets[timelineIndex] || !changesets[timelineIndex + 1]) {
    return [];
  }
  
  const files1 = changesets[timelineIndex].files;
  const files2 = changesets[timelineIndex + 1].files;
  
  const fileMap = new Map();
  
  files1.forEach(f => fileMap.set(f.id, f));
  files2.forEach(f => {
    if (!fileMap.has(f.id)) {
      fileMap.set(f.id, f);
    }
  });
  
  return Array.from(fileMap.values());
}

export function getFileFromChangeset(changesets, timelineIndex, selectedFileId) {
  const file = changesets[timelineIndex]?.files.find(f => f.id === selectedFileId);
  
  if (file) return file;
  
  // Return empty placeholder if file doesn't exist
  return selectedFileId ? { 
    id: selectedFileId, 
    language: 'text', 
    content: '', 
    comments: {} 
  } : null;
}
