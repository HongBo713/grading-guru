// @ts-ignore
import React, { useState, useEffect } from 'react';
import { Camera, RefreshCw, X } from 'lucide-react';
import { DesktopCapturerSource } from 'electron';

const CaptureScreen = () => {
  const [sources, setSources] = useState<Electron.DesktopCapturerSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    // Cleanup preview URL when component unmounts
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const getScreenSources = async () => {
    try {
      const sources = await window.electron.getScreenSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 320, height: 180 }
      });
      setSources(sources as DesktopCapturerSource[]);
    } catch (error: unknown) {
      console.error('Failed to get screen sources:', error instanceof Error ? error.message : error);
    }
  };

  const handleStartCapture = async () => {
    if (!selectedSource) {
      await getScreenSources();
    }
    setIsCapturing(true);
  };

  const handleSourceSelect = async (sourceId: string) => {
    setSelectedSource(sourceId);
    setIsCapturing(false);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
          }
        } as any
      });
  
      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
  
      // Create canvas to capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob and create URL
        canvas.toBlob((blob) => {
          if (blob) {
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(URL.createObjectURL(blob));
          }
        }, 'image/png', 1);
      }
  
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
  
    } catch (error) {
      // Handle user cancellation (ESC key)
      if (error instanceof Error && error.name === 'NotAllowedError') {
        console.log('Screen capture was cancelled');
        handleReset(); // Reset the UI state
        return; // Exit quietly without showing error
      }
      
      // Handle other errors
      console.error('Error capturing screen:', error);
      // Optionally show user-friendly error message
      handleReset(); // Reset UI state for other errors too
    }
  };

  const handleReset = () => {
    setSelectedSource(null);
    setIsCapturing(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="h-full p-4">
      <div className="bg-white rounded-xl shadow-md h-full flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Screen Capture</h2>
          {(isCapturing || previewUrl) && (
            <button 
              onClick={handleReset}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {!isCapturing && !previewUrl && (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="bg-gray-50 w-full max-w-md p-8 rounded-2xl border-2 border-dashed border-gray-200">
                <div className="flex flex-col items-center text-center">
                  <Camera size={48} className="text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    Ready to Capture
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Click below to start capturing your screen or window
                  </p>
                  <button 
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 
                             transition-colors flex items-center gap-2 font-medium"
                    onClick={handleStartCapture}
                  >
                    <Camera size={20} />
                    Start Capture
                  </button>
                </div>
              </div>
            </div>
          )}

          {isCapturing && (
            <div className="h-full flex flex-col">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-gray-700 font-medium">Select Source</h3>
                <button
                  onClick={getScreenSources}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 overflow-y-auto flex-1">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer
                             hover:border-blue-500 hover:shadow-md transition-all"
                    onClick={() => handleSourceSelect(source.id)}
                  >
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 mb-2">
                      <img 
                        src={source.thumbnail.toDataURL()} 
                        alt={source.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm text-gray-600 truncate text-center">
                      {source.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {previewUrl && (
            <div className="h-full flex flex-col">
              <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg p-4">
                <img 
                  src={previewUrl} 
                  alt="Captured screen"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button 
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 
                           hover:bg-gray-50 transition-colors font-medium"
                  onClick={handleReset}
                >
                  Retake
                </button>
                <button 
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white 
                           hover:bg-blue-600 transition-colors font-medium"
                  onClick={() => {/* Handle save */}}
                >
                  Save Capture
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default CaptureScreen;