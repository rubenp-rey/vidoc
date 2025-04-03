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
              className="btn btn-sm btn-primary rounded-circle"
              onClick={handleFileOpen}
            >
              <i className="bi bi-plus"></i>
            </button>
          </div>
          <div className="flex-grow-1 overflow-auto">
            <div className="list-group list-group-flush">
              {files.map((file, index) => (
                <button
                  key={index}
                  className={`list-group-item list-group-item-action ${
                    selectedFile?.name === file.name ? 'active' : ''
                  }`}
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
            <div className="card-header">
              <h5 className="card-title mb-0">Chat</h5>
            </div>
            <div className="card-body p-0 d-flex flex-column">
              <Chat 
                currentFile={selectedFile ? { name: selectedFile.name, content: selectedFile.content } : undefined}
                onFileSelect={handleFileSelect}
              />
            </div>
          </div>

          {/* Área de visualización de markdown */}
          <div className="card" style={{ width: 'calc(50% - 6px)' }}>
            <div className="card-header">
              <h5 className="card-title mb-0">
                {selectedFile?.name || 'Selecciona un archivo'}
              </h5>
            </div>
            <div className="card-body overflow-auto">
              <ReactMarkdown>{markdownContent}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
