import React, { useState, useEffect } from 'react';
import { Uploader } from './components/Uploader';
import { ComparisonView } from './components/ComparisonView';
import { Button } from './components/Button';
import { removeBackground } from './services/geminiService';
import { AppStatus } from './types';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Cleanup object URLs to avoid memory leaks
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
    };
  }, [originalUrl]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setOriginalUrl(url);
    setProcessedUrl(null);
    setStatus(AppStatus.IDLE);
    setErrorMsg(null);
  };

  const handleProcess = async () => {
    if (!file) return;

    setStatus(AppStatus.PROCESSING);
    setErrorMsg(null);

    try {
      const resultBase64 = await removeBackground(file);
      setProcessedUrl(resultBase64);
      setStatus(AppStatus.SUCCESS);
    } catch (error) {
      console.error(error);
      setStatus(AppStatus.ERROR);
      setErrorMsg("Failed to remove background. Please try again or use a clearer image.");
    }
  };

  const handleDownload = () => {
    if (!processedUrl) return;
    const link = document.createElement('a');
    link.href = processedUrl;
    link.download = `processed-${file?.name || 'image'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setFile(null);
    setOriginalUrl(null);
    setProcessedUrl(null);
    setStatus(AppStatus.IDLE);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
              AI
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">BackgroundRemover</h1>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            Powered by Gemini 2.5
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col">
        
        {/* Intro / Empty State */}
        {!file && (
          <div className="flex flex-col items-center justify-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 text-center mb-4">
              Remove Backgrounds <span className="text-indigo-600">Instantly</span>
            </h2>
            <p className="text-lg text-slate-600 text-center max-w-2xl mb-10">
              Upload an image and let our AI automatically detect the subject and remove the background in seconds.
            </p>
            <div className="w-full max-w-xl">
              <Uploader onFileSelect={handleFileSelect} />
            </div>
          </div>
        )}

        {/* Editor State */}
        {file && originalUrl && (
          <div className="w-full animate-in fade-in duration-300">
             {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  disabled={status === AppStatus.PROCESSING}
                >
                  ← New Upload
                </Button>
                <div className="hidden sm:block w-px h-6 bg-slate-200 mx-2"></div>
                <span className="text-sm text-slate-600 truncate max-w-[150px] font-medium hidden sm:block">
                  {file.name}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                 {status === AppStatus.SUCCESS && (
                  <Button variant="outline" onClick={handleDownload}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </Button>
                 )}
                 {status !== AppStatus.SUCCESS && (
                  <Button 
                    onClick={handleProcess} 
                    isLoading={status === AppStatus.PROCESSING}
                  >
                    Remove Background
                  </Button>
                 )}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errorMsg}
              </div>
            )}

            {/* Comparison Area */}
            <ComparisonView 
              originalUrl={originalUrl} 
              processedUrl={processedUrl}
              isLoading={status === AppStatus.PROCESSING}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} AI Background Remover. Built with Google Gemini.
        </div>
      </footer>
    </div>
  );
};

export default App;
