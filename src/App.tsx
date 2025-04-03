import React, { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { Chat } from './components/Chat'
import { EmbeddingsService } from './services/embeddings'
import './App.css'

interface FileItem {
  name: string;
  content: string;
}

function App() {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [markdownContent, setMarkdownContent] = useState<string>('')
  const [files, setFiles] = useState<FileItem[]>([])
  const embeddingsService = EmbeddingsService.getInstance()

  const handleFileSelect = async (file: FileItem) => {
    setSelectedFile(file)
    setMarkdownContent(file.content)
  }

  const processFile = async (file: FileItem) => {
    try {
      await embeddingsService.addDocument(file.content, file.name)
    } catch (error) {
      console.error('Error processing document:', error)
    }
  }

  const handleFileOpen = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const content = await file.text()
        const newFile: FileItem = {
          name: file.name,
          content
        }
        setFiles(prev => [...prev, newFile])
        await processFile(newFile)
        handleFileSelect(newFile)
      }
    }
    input.click()
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    for (const file of droppedFiles) {
      if (file.name.endsWith('.md')) {
        const content = await file.text()
        const newFile: FileItem = {
          name: file.name,
          content
        }
        setFiles(prev => [...prev, newFile])
        await processFile(newFile)
        handleFileSelect(newFile)
      }
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  return (
    <div className="d-flex vh-100">
      {/* Barra lateral */}
      <div 
        className="bg-light border-end w-25 min-w-25 max-w-25"
        style={{ minWidth: '250px', maxWidth: '250px' }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="d-flex flex-column h-100">
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
            <button 
              className="btn btn-md btn-primary rounded-circle "
              onClick={handleFileOpen}
              style={{ backgroundColor: '#FFD5C2', color: 'black', border: 'none', height: '2.4rem', width: '2.4rem', padding: '0px' }}
            >
              <i className="bi bi-plus" style={{fontSize: '1.4rem'}}></i>
            </button>
          </div>
          <div className="flex-grow-1 overflow-auto d-flex flex-column justify-content-center align-items-center">
            {files.length === 0 &&
              <div className="d-flex flex-column justify-content-center align-items-center flex-grow-1 w-100">
                <img className="w-50 opacity-75" src={'./src/assets/load.png'}></img>
              </div>  
            }
            <div className="list-group list-group-flush">
              {files.map((file, index) => (
                <button
                  key={index}
                  className={`list-group-item list-group-item-action border-none`}
                  style={{
                    backgroundColor: selectedFile?.name === file.name ? '#FFD5C2' : 'white',
                    color: 'black',
                    border: 'none',
                    borderRadius: '0px',
                  }}
                  onClick={() => handleFileSelect(file)}
                >
                  {file.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-grow-1 p-3">
        <div className="d-flex h-100 gap-3">
          {/* Área de chat */}
          <div className="card d-flex flex-column" style={{ width: 'calc(50% - 6px)' }}>
            <div className="card-body p-0 d-flex flex-column">
              <Chat 
                currentFile={selectedFile ? { name: selectedFile.name, content: selectedFile.content } : undefined}
                onFileSelect={handleFileSelect}
              />
            </div>
          </div>

          {/* Área de visualización de markdown */}
          <div className="card" style={{ width: 'calc(50% - 6px)' }}>
            {selectedFile &&
              <div className="card-header bg-white">
                <h5 className="card-title mb-0">
                  {selectedFile?.name}
                </h5>
              </div>
            }
            <div className='d-flex flex-column justify-content-center align-items-center flex-grow-1 overflow-auto w-100'>
              {
                selectedFile ?
                  <div className="card-body overflow-auto">
                    <ReactMarkdown>{markdownContent}</ReactMarkdown>
                  </div>
                :
                <div className="d-flex justify-content-center align-items-center">
                  <img className="w-50 opacity-75" src={'./src/assets/document.png'}></img>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
