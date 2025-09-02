import React, { useState } from 'react';
import { 
  storeKnowledgeBase, 
  initializeFromFiles,
  isKnowledgeBaseInitialized 
} from '../../services/knowledgeBaseService';
import { 
  initializeKnowledgeBase, 
  initializeKnowledgeBaseFromFiles 
} from '../../services/chatbotService';

export default function KnowledgeBaseImporter() {
  const [isLoading, setIsLoading] = useState(false);
  const [importMethod, setImportMethod] = useState('file'); // 'file' or 'directory'
  const [directoryPath, setDirectoryPath] = useState('/Users/enesozkan/neofit/fitlib');
  const [importStatus, setImportStatus] = useState({
    isInitialized: isKnowledgeBaseInitialized(),
    message: '',
    error: false
  });

  // Handle file upload method
  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setIsLoading(true);
      setImportStatus({ ...importStatus, message: 'Importing files...', error: false });
      
      try {
        // Use the browser-compatible method
        const success = await initializeKnowledgeBaseFromFiles(Array.from(files));
        
        if (success) {
          setImportStatus({
            isInitialized: true,
            message: `Successfully imported knowledge base from files!`,
            error: false
          });
        } else {
          throw new Error('Failed to initialize knowledge base');
        }
      } catch (error) {
        console.error('Import failed:', error);
        setImportStatus({
          isInitialized: false,
          message: 'Failed to import knowledge base: ' + error.message,
          error: true
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle directory import method
  const handleDirectoryImport = async () => {
    if (!directoryPath) {
      setImportStatus({
        ...importStatus,
        message: 'Please enter a valid directory path',
        error: true
      });
      return;
    }
    
    setIsLoading(true);
    setImportStatus({ ...importStatus, message: 'Importing from directory...', error: false });
    
    try {
      // Initialize the knowledge base from directory
      const success = await initializeKnowledgeBase(directoryPath);
      
      if (success) {
        setImportStatus({
          isInitialized: true,
          message: 'Successfully imported knowledge base from directory!',
          error: false
        });
      } else {
        throw new Error('Failed to initialize knowledge base');
      }
    } catch (error) {
      console.error('Directory import failed:', error);
      setImportStatus({
        isInitialized: false,
        message: 'Failed to import knowledge base from directory: ' + error.message,
        error: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border border-cyber-cyan rounded-lg bg-gray-900">
      <h3 className="text-cyber-cyan font-mono mb-4">IMPORT FITNESS KNOWLEDGE BASE</h3>
      
      {/* Status indicator */}
      {importStatus.isInitialized && (
        <div className="mb-4 p-2 bg-green-900 text-green-100 rounded">
          Knowledge base is initialized and ready for use.
        </div>
      )}
      
      {importStatus.message && (
        <div className={`mb-4 p-2 rounded ${importStatus.error ? 'bg-red-900 text-red-100' : 'bg-blue-900 text-blue-100'}`}>
          {importStatus.message}
        </div>
      )}
      
      {/* Import method selection */}
      <div className="mb-4">
        <label className="text-gray-300 block mb-2">Import Method:</label>
        <div className="flex space-x-4">
          <button
            onClick={() => setImportMethod('file')}
            className={`px-3 py-1 rounded ${
              importMethod === 'file' 
                ? 'bg-cyber-cyan text-gray-900 font-bold' 
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            File Upload
          </button>
          <button
            onClick={() => setImportMethod('directory')}
            className={`px-3 py-1 rounded ${
              importMethod === 'directory' 
                ? 'bg-cyber-cyan text-gray-900 font-bold' 
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            Directory Path
          </button>
        </div>
      </div>
      
      {/* File upload method */}
      {importMethod === 'file' && (
        <div>
          <p className="text-gray-300 mb-4">
            Upload your Obsidian vault files to create an AI-powered fitness advisor.
          </p>
          <input
            type="file"
            multiple
            accept=".md"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="block w-full text-sm text-gray-300
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-cyber-black file:text-cyber-cyan
              hover:file:bg-cyber-cyan hover:file:text-cyber-black
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      )}
      
      {/* Directory path method */}
      {importMethod === 'directory' && (
        <div>
          <p className="text-gray-300 mb-4">
            Enter the path to your Obsidian vault directory. This will import all markdown files in the directory and its subdirectories.
          </p>
          <div className="flex mb-4">
            <input
              type="text"
              value={directoryPath}
              onChange={(e) => setDirectoryPath(e.target.value)}
              disabled={isLoading}
              placeholder="/path/to/obsidian/vault"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-l px-3 py-2 text-gray-300"
            />
            <button
              onClick={handleDirectoryImport}
              disabled={isLoading || !directoryPath}
              className="bg-cyber-black text-cyber-cyan border border-cyber-cyan border-l-0 rounded-r px-4 py-2
                hover:bg-cyber-cyan hover:text-cyber-black transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Importing...' : 'Import'}
            </button>
          </div>
          <p className="text-gray-400 text-xs italic">
            Example: /Users/username/Documents/ObsidianVault
          </p>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="mt-4 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyber-cyan"></div>
        </div>
      )}
    </div>
  );
}