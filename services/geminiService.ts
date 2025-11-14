import { GoogleGenAI, Modality, Part, VideoGenerationReferenceImage, VideoGenerationReferenceType } from "@google/genai";
import { AspectRatio } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

const fileToGenerativePart = async (file: File): Promise<Part> => {
  const base64Data = await fileToBase64(file);
  return {
    inlineData: {
      data: base64Data,
      mimeType: file.type,
    },
  };
};

export const generateImage = async (prompt: string, aspectRatio: AspectRatio) => {
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: aspectRatio,
    },
  });

  const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
  return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const editImage = async (prompt: string, imageFile: File) => {
  const imagePart = await fileToGenerativePart(imageFile);
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [imagePart, { text: prompt }],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64ImageBytes: string = part.inlineData.data;
      return `data:image/png;base64,${base64ImageBytes}`;
    }
  }
  throw new Error("No image generated");
};

export const analyzeImage = async (prompt: string, imageFile: File) => {
  const imagePart = await fileToGenerativePart(imageFile);
  const fullPrompt = prompt || "Analyze this image in detail.";
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [{ text: fullPrompt }, imagePart] },
  });

  return response.text;
};

export const analyzeVideoFrames = async (prompt: string, frames: string[]) => {
    const fullPrompt = prompt || "These are sequential frames from a video. Analyze the video and describe what is happening.";

    const imageParts: Part[] = frames.map(frameData => ({
        inlineData: {
            data: frameData.split(',')[1],
            mimeType: 'image/jpeg'
        }
    }));
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: fullPrompt }, ...imageParts] },
    });

    return response.text;
};

export const analyzeVideoWithImage = async (prompt: string, frames: string[], imageFile: File) => {
    const fullPrompt = prompt || "Analyze the relationship between the provided image and the video frames. Describe what is happening.";

    const imageParts: Part[] = frames.map(frameData => ({
        inlineData: {
            data: frameData.split(',')[1],
            mimeType: 'image/jpeg'
        }
    }));

    const contextImagePart = await fileToGenerativePart(imageFile);
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: fullPrompt }, contextImagePart, ...imageParts] },
    });

    return response.text;
};

const handleVideoOperation = async (
    getOperation: () => Promise<any>,
    onProgress: (message: string) => void
): Promise<string> => {
    // Re-instantiate to ensure the latest API key is used, as per Veo guidelines.
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set");
    }
    const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

    onProgress("Starting video generation operation...");
    let operation = await getOperation();

    onProgress("Operation initiated. Waiting for video to be processed. This can take several minutes.");
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        onProgress("Checking video status...");
        operation = await localAi.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Could not retrieve video download link.");
    }

    onProgress("Video generated! Downloading video data...");
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to download video: ${response.statusText}. Details: ${errorText}`);
    }

    const blob = await response.blob();
    onProgress("Download complete.");
    return URL.createObjectURL(blob);
};

export const generateVideo = async (prompt: string, onProgress: (message: string) => void): Promise<string> => {
    const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return handleVideoOperation(() => localAi.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
        }
    }), onProgress);
};

export const generateVideoFromImages = async (prompt: string, imageFiles: File[], referenceType: VideoGenerationReferenceType, onProgress: (message: string) => void): Promise<string> => {
    const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    onProgress("Preparing images for video generation...");
    
    const referenceImagesPayload: VideoGenerationReferenceImage[] = await Promise.all(
        imageFiles.map(async (file) => {
            const base64Data = await fileToBase64(file);
            return {
                image: {
                    imageBytes: base64Data,
                    mimeType: file.type,
                },
                referenceType: referenceType,
            };
        })
    );
    
    return handleVideoOperation(() => localAi.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            referenceImages: referenceImagesPayload,
            resolution: '720p',
            aspectRatio: '16:9'
        }
    }), onProgress);
};