import { useState } from 'react'
import CodeDiffViewer from './components/CodeDiffViewer'
import FileSelector from './components/FileSelector'
import ViewModeToggle from './components/ViewModeToggle'
import './App.css'

function App() {
  const changesets = [
    {
      version: 1,
      name: 'Initial version',
      files: [
        {
          id: '/index.html',
          language: 'html',
          content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>Welcome</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>`,
          comments: {
            7: { text: 'Basic static heading', markdown: 'Basic **static** heading' }
          }
        },
        {
          id: '/style.css',
          language: 'css',
          content: `body {\n  margin: 0;\n  font-family: Arial;\n}`,
          comments: {
            3: { text: 'Basic font', markdown: 'Using basic **Arial** font' }
          }
        },
        {
          id: '/script.js',
          language: 'javascript',
          content: `console.log('Page loaded');`,
          comments: {
            1: { text: 'Simple log', markdown: 'Simple **console log**' }
          }
        }
      ]
    },
    {
      version: 2,
      name: 'Added styling and interactivity',
      files: [
        {
          id: '/index.html',
          language: 'html',
          content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>Welcome</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <div class="container">\n    <h1 id="greeting">Hello World</h1>\n  </div>\n  <script src="script.js"></script>\n</body>\n</html>`,
          comments: {
            5: { text: 'Added CSS link', markdown: 'Added **CSS link** for styling' },
            8: { text: 'Wrapped in container div', markdown: 'Wrapped in `container` div for better layout' },
            9: { text: 'Added ID for JavaScript access', markdown: 'Added `id="greeting"` for JavaScript access' },
            11: { text: 'Added JavaScript file', markdown: 'Added **JavaScript file** for interactivity' }
          }
        },
        {
          id: '/style.css',
          language: 'css',
          content: `body {\n  margin: 0;\n  font-family: 'Segoe UI', Tahoma, sans-serif;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n}\n\n.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n}\n\n#greeting {\n  color: white;\n  font-size: 48px;\n  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);\n}`,
          comments: {
            3: { text: 'Modern font stack', markdown: 'Using **modern font stack** for better appearance' },
            4: { text: 'Added gradient background', markdown: 'Added beautiful **gradient background**' },
            7: { text: 'Container for centering', markdown: 'Flexbox `container` for **centering content**' },
            14: { text: 'Styled heading', markdown: 'Styled heading with **color, size, and shadow**' }
          }
        },
        {
          id: '/script.js',
          language: 'javascript',
          content: `const greeting = document.getElementById('greeting');\n\ngreeting.addEventListener('click', () => {\n  const name = prompt('What is your name?');\n  if (name) {\n    greeting.textContent = \`Hello \${name}!\`;\n  }\n});\n\nconsole.log('Interactive greeting ready');`,
          comments: {
            1: { text: 'Get greeting element', markdown: 'Get the **greeting element** from DOM' },
            3: { text: 'Add click listener', markdown: 'Add **click event listener** for interactivity' },
            4: { text: 'Prompt for name', markdown: 'Use `prompt()` to **ask for user name**' },
            6: { text: 'Update with template literal', markdown: 'Update text using **template literal** with user name' },
            10: { text: 'Ready message', markdown: 'Log message when **script is ready**' }
          }
        }
      ]
    }
  ];

  const [selectedFileId, setSelectedFileId] = useState('/index.html');
  const [viewMode, setViewMode] = useState('hybrid');

  const file1 = changesets[0].files.find(f => f.id === selectedFileId);
  const file2 = changesets[1].files.find(f => f.id === selectedFileId);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Code Diff Comment Tool</h1>
        <p>Feature: Add greeting page</p>
      </header>
      
      <FileSelector 
        files={changesets[0].files}
        selectedFileId={selectedFileId}
        onSelectFile={setSelectedFileId}
      />
      
      <ViewModeToggle 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      <CodeDiffViewer 
        file1={file1} 
        file2={file2}
        fileName={file1.id}
        version1={changesets[0].version}
        version2={changesets[1].version}
        viewMode={viewMode}
      />
    </div>
  )
}

export default App
