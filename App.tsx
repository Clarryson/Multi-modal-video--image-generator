import React, { useState } from 'react';
import { Feature } from './types';
import { ImageGenerate, ImageEdit, ImageAnalyze, VideoAnalyze, VideoGenerate } from './components/Features';

// --- SHARED UI COMPONENTS ---
export const Spinner: React.FC = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

interface FileUploadProps {
  onFileChange: (files: File[]) => void;
  accept: string;
  disabled?: boolean;
  multiple?: boolean;
  maxFiles?: number;
  showPreviews?: boolean;
}
export const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, accept, disabled, multiple = false, maxFiles = 1, showPreviews = true }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    // Cleanup previews on unmount
    return () => {
        previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = event.target.files ? Array.from(event.target.files) : [];
      if (!selectedFiles.length) return;

      const updatedFiles = multiple ? [...files, ...selectedFiles].slice(0, maxFiles) : selectedFiles.slice(0, 1);
      updateFiles(updatedFiles);
  };
  
  const updateFiles = (newFiles: File[]) => {
      previews.forEach(url => URL.revokeObjectURL(url));
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setFiles(newFiles);
      setPreviews(newPreviews);
      onFileChange(newFiles);
  };

  const handleRemoveFile = (indexToRemove: number) => {
      const updatedFiles = files.filter((_, index) => index !== indexToRemove);
      updateFiles(updatedFiles);
  };

  const fileType = accept.split('/')[0];
  const canUploadMore = multiple ? files.length < maxFiles : files.length === 0;

  return (
    <div className={`w-full p-2 border-2 border-dashed border-slate-600 rounded-lg ${disabled ? 'opacity-50' : ''}`}>
        <input type="file" ref={inputRef} onChange={handleFileChange} accept={accept} className="hidden" disabled={disabled || !canUploadMore} multiple={multiple} />
        
        {files.length === 0 ? (
             <div
                onClick={() => canUploadMore && !disabled && inputRef.current?.click()}
                className={`h-40 flex flex-col justify-center items-center text-slate-400 rounded-md transition ${canUploadMore && !disabled ? 'cursor-pointer hover:bg-slate-700/50' : 'cursor-not-allowed'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <p>Click to upload {multiple ? `up to ${maxFiles} ${fileType}s` : `a ${fileType}`}</p>
                <p className="text-xs text-slate-500">{accept}</p>
            </div>
        ) : showPreviews ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {previews.map((preview, index) => (
                    <div key={preview} className="relative group aspect-square">
                        { fileType === 'image' ? (
                            <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                            <video src={preview} className="w-full h-full object-cover rounded-lg" muted playsInline />
                        )}
                        <button
                            onClick={() => handleRemoveFile(index)}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                            aria-label="Remove file"
                            disabled={disabled}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                ))}
                {multiple && canUploadMore && (
                    <div 
                        onClick={() => !disabled && inputRef.current?.click()}
                        className="aspect-square flex flex-col justify-center items-center text-slate-400 border-2 border-dashed border-slate-500 rounded-lg cursor-pointer hover:bg-slate-700/50 transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        <span>Add more</span>
                    </div>
                )}
            </div>
        ) : (
            <div
                onClick={() => !disabled && inputRef.current?.click()}
                className={`h-40 flex flex-col justify-center items-center text-slate-400 rounded-md transition ${!disabled ? 'cursor-pointer hover:bg-slate-700/50' : 'cursor-not-allowed'}`}
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="font-semibold mt-2">{files.length} {fileType}{files.length > 1 ? 's' : ''} selected.</p>
                <p className="text-xs text-slate-500">Click to change selection</p>
            </div>
        )}
    </div>
  );
};

// --- ICON COMPONENTS ---
const GenerateIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>;
const EditIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>;
const AnalyzeIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>;
const VideoAnalyzeIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" /></svg>;
const VideoGenerateIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" /></svg>;


const features: { id: Feature; name: string; icon: React.FC }[] = [
  { id: 'generate', name: 'Generate Image', icon: GenerateIcon },
  { id: 'generate-video', name: 'Generate Video', icon: VideoGenerateIcon },
  { id: 'edit', name: 'Edit Image', icon: EditIcon },
  { id: 'analyze', name: 'Analyze Image', icon: AnalyzeIcon },
  { id: 'video', name: 'Analyze Video', icon: VideoAnalyzeIcon },
];

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>('generate');

  const renderContent = () => {
    switch (activeFeature) {
      case 'generate': return <ImageGenerate />;
      case 'generate-video': return <VideoGenerate />;
      case 'edit': return <ImageEdit />;
      case 'analyze': return <ImageAnalyze />;
      case 'video': return <VideoAnalyze />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            Clarryson Multi-Modal Studio
          </h1>
          <p className="mt-2 text-slate-400">Your all-in-one AI creative suite.</p>
        </header>

        <nav className="mb-8 flex justify-center">
          <div className="bg-slate-800 p-2 rounded-lg shadow-md flex flex-wrap gap-2 justify-center">
            {features.map(feature => (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm sm:text-base font-medium transition-colors ${
                  activeFeature === feature.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <feature.icon />
                <span>{feature.name}</span>
              </button>
            ))}
          </div>
        </nav>

        <main>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;