import { useState } from 'react'
import CodeDiffViewer from './components/CodeDiffViewer'
import FileSelector from './components/FileSelector'
import ViewModeToggle from './components/ViewModeToggle'
import Timeline from './components/Timeline'
import ControlBar from './components/ControlBar'
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
    },
    {
      version: 3,
      name: 'Added animation and improved UX',
      files: [
        {
          id: '/index.html',
          language: 'html',
          content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>Welcome</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <div class="container">\n    <h1 id="greeting" class="animated">Hello World</h1>\n    <button id="reset-btn">Reset</button>\n  </div>\n  <script src="script.js"></script>\n</body>\n</html>`,
          comments: {
            9: { text: 'Added animation class', markdown: 'Added `animated` class for **CSS animations**' },
            10: { text: 'Added reset button', markdown: 'Added **reset button** to restore original greeting' }
          }
        },
        {
          id: '/style.css',
          language: 'css',
          content: `body {\n  margin: 0;\n  font-family: 'Segoe UI', Tahoma, sans-serif;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n}\n\n.container {\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n  gap: 20px;\n}\n\n#greeting {\n  color: white;\n  font-size: 48px;\n  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);\n  cursor: pointer;\n  transition: transform 0.3s ease;\n}\n\n#greeting:hover {\n  transform: scale(1.1);\n}\n\n#greeting.animated {\n  animation: fadeIn 1s ease-in;\n}\n\n@keyframes fadeIn {\n  from { opacity: 0; transform: translateY(-20px); }\n  to { opacity: 1; transform: translateY(0); }\n}\n\n#reset-btn {\n  padding: 10px 20px;\n  font-size: 16px;\n  background: white;\n  color: #667eea;\n  border: none;\n  border-radius: 8px;\n  cursor: pointer;\n  transition: all 0.2s;\n}\n\n#reset-btn:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 4px 12px rgba(0,0,0,0.2);\n}`,
          comments: {
            8: { text: 'Changed to column layout', markdown: 'Changed to **column layout** to accommodate button' },
            13: { text: 'Added gap for spacing', markdown: 'Added `gap` for **spacing between elements**' },
            21: { text: 'Added smooth transition', markdown: 'Added **smooth transition** for hover effect' },
            24: { text: 'Hover scale effect', markdown: '**Scale effect** on hover for better UX' },
            28: { text: 'Fade-in animation', markdown: '**Fade-in animation** when page loads' },
            36: { text: 'Reset button styling', markdown: 'Styled **reset button** to match theme' }
          }
        },
        {
          id: '/script.js',
          language: 'javascript',
          content: `const greeting = document.getElementById('greeting');\nconst resetBtn = document.getElementById('reset-btn');\nconst originalText = 'Hello World';\n\ngreeting.addEventListener('click', () => {\n  const name = prompt('What is your name?');\n  if (name) {\n    greeting.textContent = \`Hello \${name}!\`;\n  }\n});\n\nresetBtn.addEventListener('click', () => {\n  greeting.textContent = originalText;\n  greeting.classList.remove('animated');\n  setTimeout(() => greeting.classList.add('animated'), 10);\n});\n\nconsole.log('Interactive greeting ready');`,
          comments: {
            2: { text: 'Get reset button', markdown: 'Get **reset button** element' },
            3: { text: 'Store original text', markdown: 'Store **original text** for reset functionality' },
            12: { text: 'Reset button handler', markdown: '**Reset button handler** to restore original greeting' },
            13: { text: 'Restore original text', markdown: 'Restore **original text**' },
            14: { text: 'Remove animation class', markdown: 'Remove animation class to **reset animation state**' },
            15: { text: 'Re-trigger animation', markdown: 'Re-add animation class after small delay to **re-trigger animation**' }
          }
        }
      ]
    },
    {
      version: 4,
      name: 'Added dark mode toggle',
      files: [
        {
          id: '/index.html',
          language: 'html',
          content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>Welcome</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <button id="theme-toggle" class="theme-toggle">🌙</button>\n  <div class="container">\n    <h1 id="greeting" class="animated">Hello World</h1>\n    <button id="reset-btn">Reset</button>\n  </div>\n  <script src="script.js"></script>\n</body>\n</html>`,
          comments: {
            8: { text: 'Added theme toggle button', markdown: 'Added **theme toggle button** for dark/light mode' }
          }
        },
        {
          id: '/style.css',
          language: 'css',
          content: `body {\n  margin: 0;\n  font-family: 'Segoe UI', Tahoma, sans-serif;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  transition: background 0.3s ease;\n}\n\nbody.light-mode {\n  background: linear-gradient(135deg, #ffeaa7 0%, #fd79a8 100%);\n}\n\n.theme-toggle {\n  position: fixed;\n  top: 20px;\n  right: 20px;\n  padding: 10px 15px;\n  font-size: 24px;\n  background: rgba(255, 255, 255, 0.2);\n  border: 2px solid rgba(255, 255, 255, 0.3);\n  border-radius: 50%;\n  cursor: pointer;\n  transition: all 0.3s;\n  backdrop-filter: blur(10px);\n}\n\n.theme-toggle:hover {\n  transform: rotate(180deg);\n  background: rgba(255, 255, 255, 0.3);\n}\n\n.container {\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n  gap: 20px;\n}\n\n#greeting {\n  color: white;\n  font-size: 48px;\n  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);\n  cursor: pointer;\n  transition: transform 0.3s ease;\n}\n\n#greeting:hover {\n  transform: scale(1.1);\n}\n\n#greeting.animated {\n  animation: fadeIn 1s ease-in;\n}\n\n@keyframes fadeIn {\n  from { opacity: 0; transform: translateY(-20px); }\n  to { opacity: 1; transform: translateY(0); }\n}\n\n#reset-btn {\n  padding: 10px 20px;\n  font-size: 16px;\n  background: white;\n  color: #667eea;\n  border: none;\n  border-radius: 8px;\n  cursor: pointer;\n  transition: all 0.2s;\n}\n\n#reset-btn:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 4px 12px rgba(0,0,0,0.2);\n}`,
          comments: {
            5: { text: 'Smooth background transition', markdown: 'Added **smooth transition** for theme changes' },
            8: { text: 'Light mode styles', markdown: '**Light mode** gradient with warm colors' },
            12: { text: 'Fixed position toggle', markdown: '**Fixed position** toggle button in top-right' },
            18: { text: 'Glass effect', markdown: 'Semi-transparent background with **glass effect**' },
            23: { text: 'Backdrop blur', markdown: '**Backdrop blur** for modern glass morphism effect' },
            26: { text: 'Rotate on hover', markdown: '**Rotate animation** on hover for fun interaction' }
          }
        },
        {
          id: '/script.js',
          language: 'javascript',
          content: `const greeting = document.getElementById('greeting');\nconst resetBtn = document.getElementById('reset-btn');\nconst themeToggle = document.getElementById('theme-toggle');\nconst originalText = 'Hello World';\n\ngreeting.addEventListener('click', () => {\n  const name = prompt('What is your name?');\n  if (name) {\n    greeting.textContent = \`Hello \${name}!\`;\n  }\n});\n\nresetBtn.addEventListener('click', () => {\n  greeting.textContent = originalText;\n  greeting.classList.remove('animated');\n  setTimeout(() => greeting.classList.add('animated'), 10);\n});\n\nthemeToggle.addEventListener('click', () => {\n  document.body.classList.toggle('light-mode');\n  themeToggle.textContent = document.body.classList.contains('light-mode') ? '☀️' : '🌙';\n});\n\nconsole.log('Interactive greeting ready');`,
          comments: {
            3: { text: 'Get theme toggle button', markdown: 'Get **theme toggle button** element' },
            19: { text: 'Theme toggle handler', markdown: '**Theme toggle handler** to switch between modes' },
            20: { text: 'Toggle light mode class', markdown: 'Toggle `light-mode` class on body' },
            21: { text: 'Update button icon', markdown: 'Update button icon based on **current theme**' }
          }
        }
      ]
    }
  ];

  const [selectedFileId, setSelectedFileId] = useState('/index.html');
  const [viewMode, setViewMode] = useState('hybrid');
  const [timelineIndex, setTimelineIndex] = useState(0);

  const file1 = changesets[timelineIndex].files.find(f => f.id === selectedFileId);
  const file2 = changesets[timelineIndex + 1].files.find(f => f.id === selectedFileId);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Code Diff Comment Tool</h1>
        <p>Feature: Add greeting page</p>
      </header>
      
      <Timeline 
        changesets={changesets}
        selectedIndex={timelineIndex}
        onIndexChange={setTimelineIndex}
      />
      
      <ControlBar>
        <FileSelector 
          files={changesets[timelineIndex].files}
          selectedFileId={selectedFileId}
          onSelectFile={setSelectedFileId}
        />
        
        <ViewModeToggle 
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </ControlBar>
      
      <CodeDiffViewer 
        file1={file1} 
        file2={file2}
        fileName={file1.id}
        version1={changesets[timelineIndex].version}
        version2={changesets[timelineIndex + 1].version}
        viewMode={viewMode}
      />
    </div>
  )
}

export default App
