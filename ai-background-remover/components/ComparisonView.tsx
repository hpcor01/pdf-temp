import React from 'react';

interface ComparisonViewProps {
  originalUrl: string;
  processedUrl: string | null;
  isLoading: boolean;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ originalUrl, processedUrl, isLoading }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* Original Image */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Original
          </h4>
        </div>
        <div className="aspect-[4/3] w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative group">
           <img 
            src={originalUrl} 
            alt="Original" 
            className="w-full h-full object-contain p-2"
          />
        </div>
      </div>

      {/* Processed Result */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
           <h4 className="font-medium text-indigo-700 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-indigo-400 animate-pulse' : 'bg-indigo-600'}`}></span>
            {isLoading ? 'Processing...' : 'Result'}
          </h4>
        </div>
        
        <div className="aspect-[4/3] w-full rounded-xl overflow-hidden border border-indigo-100 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-white relative">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-medium text-indigo-600 animate-pulse">Removing background...</p>
              <p className="text-xs text-slate-400 mt-1">This uses Gemini 2.5 Flash</p>
            </div>
          ) : processedUrl ? (
            <img 
              src={processedUrl} 
              alt="Processed" 
              className="w-full h-full object-contain p-2 animate-in fade-in zoom-in duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
              Waiting to process...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
