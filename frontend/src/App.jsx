import { useState } from 'react'
import CodeDiffViewer from './components/CodeDiffViewer'
import './App.css'

function App() {
  const files = [
    {
      id: 1,
      name: 'example1.js',
      content: `function greet(name) {\n  console.log("Hello " + name);\n}`,
      comments: {
        2: { text: 'Using string concatenation here', markdown: 'Using **string concatenation** here' }
      }
    },
    {
      id: 2,
      name: 'example2.js',
      content: `function greet(name) {\n  console.log(\`Hello \${name}\`);\n  return \`Hello \${name}\`;\n}`,
      comments: {
        2: { text: 'Changed to template literals for better readability', markdown: 'Changed to **template literals** for better readability' },
        3: { text: 'Added return statement', markdown: 'Added `return` statement to make function more useful' }
      }
    }
  ];

  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Code Diff Comment Tool</h1>
        <p>Comparing File {currentFileIndex + 1} vs File {currentFileIndex + 2}</p>
      </header>
      
      <CodeDiffViewer 
        file1={files[currentFileIndex]} 
        file2={files[currentFileIndex + 1]} 
      />
    </div>
  )
}

export default App
