import React, { useState, useCallback, useRef } from 'react';
import { aspectRatios, AspectRatio } from '../types';
import * as geminiService from '../services/geminiService';
import { Spinner } from '../App';
import { FileUpload } from '../App';
import { VideoGenerationReferenceType } from '@google/genai';

// --- IMAGE GENERATION ---
export const ImageGenerate: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    try {
      const imageUrl = await geminiService.generateImage(prompt, aspectRatio);
      setGeneratedImage(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg shadow-lg space-y-6">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-slate-300 mb-2">Image Prompt</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A futuristic cityscape at sunset, neon lights reflecting on wet streets"
            className="w-full h-24 p-3 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Aspect Ratio</label>
          <div className="flex flex-wrap gap-2">
            {aspectRatios.map(ar => (
              <button
                key={ar}
                type="button"
                onClick={() => setAspectRatio(ar)}
                className={`px-4 py-2 text-sm rounded-md transition ${aspectRatio === ar ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-700 hover:bg-slate-600'}`}
                disabled={isLoading}
              >
                {ar}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition disabled:bg-slate-500">
          {isLoading ? <><Spinner /> Generating...</> : 'Generate Image'}
        </button>
      </form>
      {error && <div className="mt-4 bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md">{error}</div>}
      <div className="mt-8">
        {isLoading && <div className="text-center p-8 bg-slate-800/50 rounded-lg"><Spinner /></div>}
        {generatedImage && (
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-slate-200">Generated Image</h3>
            <img src={generatedImage} alt="Generated" className="w-full h-auto object-contain rounded-md" />
          </div>
        )}
      </div>
    </div>
  );
};


// --- IMAGE EDITING ---
export const ImageEdit: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (files: File[]) => {
    const file = files[0] || null;
    setImageFile(file);
    setEditedImage(null);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setOriginalImage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt || !imageFile) {
      setError('Please provide an image and an editing prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImage(null);
    try {
      const imageUrl = await geminiService.editImage(prompt, imageFile);
      setEditedImage(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg shadow-lg space-y-6">
        <FileUpload onFileChange={handleFileChange} accept="image/*" disabled={isLoading} />
        <div>
          <label htmlFor="edit-prompt" className="block text-sm font-medium text-slate-300 mb-2">Editing Prompt</label>
          <input
            id="edit-prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Add a retro filter, make it black and white"
            className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            disabled={isLoading}
          />
        </div>
        <button type="submit" disabled={isLoading || !imageFile} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition disabled:bg-slate-500">
          {isLoading ? <><Spinner /> Editing...</> : 'Edit Image'}
        </button>
      </form>
      {error && <div className="mt-4 bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md">{error}</div>}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {originalImage && (
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-slate-200">Original</h3>
            <img src={originalImage} alt="Original" className="w-full h-auto object-contain rounded-md" />
          </div>
        )}
        {isLoading && <div className="bg-slate-800 p-4 rounded-lg flex items-center justify-center"><Spinner /></div>}
        {editedImage && (
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-slate-200">Edited</h3>
            <img src={editedImage} alt="Edited" className="w-full h-auto object-contain rounded-md" />
          </div>
        )}
      </div>
    </div>
  );
};


// --- IMAGE ANALYSIS ---
export const ImageAnalyze: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      setError('Please upload an image to analyze.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await geminiService.analyzeImage(prompt, imageFile);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-start">
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg shadow-lg space-y-6">
          <FileUpload onFileChange={(files) => setImageFile(files[0] || null)} accept="image/*" disabled={isLoading} />
          <div>
            <label htmlFor="analyze-prompt" className="block text-sm font-medium text-slate-300 mb-2">Analysis Prompt (Optional)</label>
            <input
              id="analyze-prompt"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., What is the main subject? Is this a famous place?"
              className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              disabled={isLoading}
            />
          </div>
          <button type="submit" disabled={isLoading || !imageFile} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition disabled:bg-slate-500">
            {isLoading ? <><Spinner /> Analyzing...</> : 'Analyze Image'}
          </button>
        </form>
        {error && <div className="mt-4 bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md">{error}</div>}
      </div>
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg min-h-[200px]">
        <h3 className="text-lg font-semibold mb-4 text-slate-200">Analysis Result</h3>
        {isLoading && <div className="flex justify-center items-center h-full"><Spinner /></div>}
        {analysis && <div className="text-slate-300 whitespace-pre-wrap prose prose-invert prose-p:my-2">{analysis}</div>}
        {!isLoading && !analysis && <p className="text-slate-500">Upload an image and click "Analyze" to see the result.</p>}
      </div>
    </div>
  );
};


// --- VIDEO ANALYSIS ---
export const VideoAnalyze: React.FC = () => {
    const [mode, setMode] = useState<'videoOnly' | 'videoWithImage'>('videoOnly');
    const [prompt, setPrompt] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [contextImageFile, setContextImageFile] = useState<File | null>(null);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState('');
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const extractFrames = useCallback(async (file: File): Promise<string[]> => {
      return new Promise((resolve, reject) => {
        if (!videoRef.current || !canvasRef.current) {
          return reject(new Error("Video or canvas element not ready."));
        }
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const frames: string[] = [];
        const objectURL = URL.createObjectURL(file);
        
        video.src = objectURL;

        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const duration = video.duration;
          const interval = 1; // 1 frame per second
          const maxFrames = 16;
          let currentTime = 0;
          let frameCount = 0;

          const captureFrame = () => {
            if (currentTime >= duration || frameCount >= maxFrames) {
              URL.revokeObjectURL(objectURL);
              resolve(frames);
              return;
            }
            
            video.currentTime = currentTime;
          };
          
          video.onseeked = () => {
            if (ctx) {
              ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
              frames.push(canvas.toDataURL('image/jpeg', 0.8));
              frameCount++;
              setProgress(`Extracting frames... ${frameCount}/${Math.min(maxFrames, Math.floor(duration))}`);
            }
            currentTime += interval;
            captureFrame();
          };

          captureFrame();
        };

        video.onerror = (e) => {
            URL.revokeObjectURL(objectURL);
            reject(new Error("Error loading video file."));
        };
      });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!videoFile) {
        setError('Please upload a video to analyze.');
        return;
      }
      if (mode === 'videoWithImage' && !contextImageFile) {
        setError('Please upload an image to use for context.');
        return;
      }

      setIsLoading(true);
      setError(null);
      setAnalysis(null);
      setProgress('Starting analysis...');
      try {
        const frames = await extractFrames(videoFile);
        if (frames.length === 0) throw new Error("Could not extract any frames from the video.");
        setProgress(`Analyzing ${frames.length} frames with Gemini...`);

        let result: string;
        if (mode === 'videoWithImage' && contextImageFile) {
          result = await geminiService.analyzeVideoWithImage(prompt, frames, contextImageFile);
        } else {
          result = await geminiService.analyzeVideoFrames(prompt, frames);
        }
        
        setAnalysis(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
        setProgress('');
      }
    };
    
    // Reset inputs when mode changes
    const handleModeChange = (newMode: 'videoOnly' | 'videoWithImage') => {
      setMode(newMode);
      setPrompt('');
      setVideoFile(null);
      setContextImageFile(null);
      setAnalysis(null);
      setError(null);
      setProgress('');
    }

    const isSubmitDisabled = isLoading || !videoFile || (mode === 'videoWithImage' && !contextImageFile);

    return (
        <div className="w-full max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
                 <div className="mb-6 flex justify-center p-1 bg-slate-700 rounded-lg">
                    {(['videoOnly', 'videoWithImage'] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => handleModeChange(m)}
                            className={`w-1/2 py-2 px-4 rounded-md text-sm font-semibold transition ${mode === m ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-600/50'}`}
                        >
                            {m === 'videoOnly' ? 'Analyze Video' : 'Analyze with Image'}
                        </button>
                    ))}
                </div>
                <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg shadow-lg space-y-6">
                    <FileUpload onFileChange={(files) => setVideoFile(files[0] || null)} accept="video/*" disabled={isLoading} />
                     {mode === 'videoWithImage' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Context Image</label>
                            <FileUpload onFileChange={(files) => setContextImageFile(files[0] || null)} accept="image/*" disabled={isLoading} />
                        </div>
                    )}
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={
                        mode === 'videoWithImage' 
                        ? "e.g., Is the person in the image in the video?"
                        : "Analysis prompt (optional)"
                      }
                      className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      disabled={isLoading}
                    />
                    <button type="submit" disabled={isSubmitDisabled} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition disabled:bg-slate-500">
                      {isLoading ? <><Spinner /> Analyzing...</> : 'Analyze'}
                    </button>
                </form>
                {isLoading && <div className="mt-4 text-center text-indigo-300">{progress}</div>}
                {error && <div className="mt-4 bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md">{error}</div>}
            </div>
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg min-h-[200px]">
                <h3 className="text-lg font-semibold mb-4 text-slate-200">Analysis Result</h3>
                {isLoading && <div className="flex justify-center items-center h-full"><Spinner /></div>}
                {analysis && <div className="text-slate-300 whitespace-pre-wrap prose prose-invert prose-p:my-2">{analysis}</div>}
                {!isLoading && !analysis && <p className="text-slate-500">Upload content and click "Analyze" to see the result.</p>}
            </div>
            <video ref={videoRef} className="hidden"></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
    );
};

// --- VIDEO GENERATION ---
export const VideoGenerate: React.FC = () => {
    const [mode, setMode] = useState<'text' | 'images'>('text');
    const [prompt, setPrompt] = useState('A video of a cake with "Happy birthday Clarryson" written on it');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [referenceType, setReferenceType] = useState<VideoGenerationReferenceType>(VideoGenerationReferenceType.ASSET);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
    const loadingMessageIntervalRef = useRef<number | null>(null);

    const reassuringMessages = [
        "Hold tight, the AI is dreaming up your video...",
        "Rendering pixels into motion...",
        "This is where the magic happens. It can take a few minutes.",
        "Composing your visual masterpiece...",
        "Just a little longer, great things are coming!",
        "The video generation process is underway...",
    ];
    
    React.useEffect(() => {
        const checkKey = async () => {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setHasApiKey(hasKey);
        };
        checkKey();
        return () => {
            if (loadingMessageIntervalRef.current) clearInterval(loadingMessageIntervalRef.current);
        };
    }, []);

    React.useEffect(() => {
        // Cleanup object URLs on unmount or when previews change
        return () => {
            imagePreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [imagePreviews]);

    const handleSelectKey = async () => {
        try {
            await window.aistudio.openSelectKey();
            setHasApiKey(true);
            setError(null);
        } catch (e) {
            setError("Could not open API key selection dialog.");
        }
    };
    
    const handleImageFileChange = (newFiles: File[]) => {
        setImageFiles(newFiles);
        const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
        setImagePreviews(newPreviewUrls);
    };

    const handleRemoveImage = (indexToRemove: number) => {
        const updatedFiles = imageFiles.filter((_, index) => index !== indexToRemove);
        const updatedPreviews = imagePreviews.filter((_, index) => index !== indexToRemove);
        
        URL.revokeObjectURL(imagePreviews[indexToRemove]);

        setImageFiles(updatedFiles);
        setImagePreviews(updatedPreviews);
    };

    const startLoadingMessages = () => {
        let index = 0;
        setLoadingMessage(reassuringMessages[index]);
        loadingMessageIntervalRef.current = window.setInterval(() => {
            index = (index + 1) % reassuringMessages.length;
            setLoadingMessage(reassuringMessages[index]);
        }, 5000);
    };

    const stopLoadingMessages = () => {
        if (loadingMessageIntervalRef.current) {
            clearInterval(loadingMessageIntervalRef.current);
            loadingMessageIntervalRef.current = null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt || (mode === 'images' && imageFiles.length === 0)) {
            let errMessage = 'Please enter a prompt.';
            if (mode === 'images') errMessage = 'Please provide a prompt and at least one image.';
            setError(errMessage);
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedVideoUrl(null);
        setLoadingMessage('');
        startLoadingMessages();

        try {
            const progressCallback = (message: string) => {
                stopLoadingMessages();
                setLoadingMessage(message);
            };
            const videoUrl = mode === 'text'
                ? await geminiService.generateVideo(prompt, progressCallback)
                : await geminiService.generateVideoFromImages(prompt, imageFiles, referenceType, progressCallback);
            setGeneratedVideoUrl(videoUrl);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            if (errorMessage.includes("Requested entity was not found")) {
                setError("Your API Key was not found or is invalid. Please select a valid API key.");
                setHasApiKey(false);
            }
        } finally {
            setIsLoading(false);
            stopLoadingMessages();
        }
    };

    if (hasApiKey === null) return <div className="text-center p-8"><Spinner /></div>;
    
    if (!hasApiKey) {
        return (
            <div className="w-full max-w-2xl mx-auto bg-slate-800 p-8 rounded-lg shadow-lg text-center">
                <h2 className="text-2xl font-bold mb-4">API Key Required for Video Generation</h2>
                <p className="text-slate-400 mb-6">The Veo video generation model requires you to select your own API key. Please ensure you have enabled billing for your project. For more information, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">billing documentation</a>.</p>
                <button onClick={handleSelectKey} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-md transition">Select API Key</button>
                {error && <div className="mt-4 bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md">{error}</div>}
            </div>
        );
    }

    const isSubmitDisabled = isLoading || !prompt || (mode === 'images' && imageFiles.length === 0);

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="mb-6 flex justify-center p-1 bg-slate-700 rounded-lg">
                {(['text', 'images'] as const).map((m) => (
                    <button
                        key={m}
                        onClick={() => {
                            setMode(m);
                            setImageFiles([]);
                            setImagePreviews([]);
                        }}
                        className={`w-1/2 py-2 px-4 rounded-md text-sm font-semibold transition ${mode === m ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-600/50'}`}
                    >
                        {m === 'text' ? 'Text to Video' : 'Image(s) to Video'}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg shadow-lg space-y-6">
                 {mode === 'images' && (
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-300">Reference Image(s) (up to 3)</label>
                        <FileUpload onFileChange={handleImageFileChange} accept="image/*" multiple maxFiles={3} disabled={isLoading} showPreviews={false} />
                        <div className="pt-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Image(s) Purpose</label>
                             <div className="flex flex-wrap gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="referenceType"
                                        checked={referenceType === VideoGenerationReferenceType.ASSET}
                                        onChange={() => setReferenceType(VideoGenerationReferenceType.ASSET)}
                                        className="bg-slate-700 border-slate-600 text-indigo-500 focus:ring-indigo-500"
                                        disabled={isLoading}
                                    />
                                    <span className="text-slate-300">General Asset</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="referenceType"
                                        checked={referenceType === VideoGenerationReferenceType.CHARACTER}
                                        onChange={() => setReferenceType(VideoGenerationReferenceType.CHARACTER)}
                                        className="bg-slate-700 border-slate-600 text-indigo-500 focus:ring-indigo-500"
                                        disabled={isLoading}
                                    />
                                    <span className="text-slate-300">Specific Character</span>
                                </label>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Select 'Specific Character' to improve consistency for individuals in the video.</p>
                        </div>
                    </div>
                )}
                
                {mode === 'images' && imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                        {imagePreviews.map((preview, index) => (
                            <div key={preview} className="relative group aspect-square">
                                <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                    aria-label="Remove image"
                                    disabled={isLoading}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div>
                    <label htmlFor="video-prompt" className="block text-sm font-medium text-slate-300 mb-2">Video Prompt</label>
                    <textarea
                        id="video-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={
                            mode === 'text' 
                            ? "e.g., A cinematic shot of a panda riding a skateboard" 
                            : "e.g., A video of this character, in this environment, using this item"
                        }
                        className="w-full h-24 p-3 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        disabled={isLoading}
                    />
                </div>
                <button type="submit" disabled={isSubmitDisabled} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition disabled:bg-slate-500">
                    {isLoading ? <><Spinner /> Generating...</> : 'Generate Video'}
                </button>
            </form>
            {error && <div className="mt-4 bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md">{error}</div>}
            <div className="mt-8">
                {isLoading && (
                    <div className="text-center p-8 bg-slate-800/50 rounded-lg">
                        <Spinner />
                        <p className="mt-4 text-indigo-300">{loadingMessage}</p>
                    </div>
                )}
                {generatedVideoUrl && (
                    <div className="bg-slate-800 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4 text-slate-200">Generated Video</h3>
                        <video src={generatedVideoUrl} controls autoPlay loop className="w-full h-auto rounded-md" />
                    </div>
                )}
            </div>
        </div>
    );
};