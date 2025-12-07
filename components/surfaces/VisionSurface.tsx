import * as React from 'react';
import { useAuraStore } from '../../store';
import { Camera, Image as ImageIcon, Video, Upload, Loader2, Play, Pause, Trash2, SwitchCamera, ScanLine } from 'lucide-react';
import { blobToBase64 } from '../../utils/fileUtils';

export const VisionSurface: React.FC = () => {
  const {
    visionMode,
    openVisionSurface,
    setVisionFile,
    visionFile,
    analyzeVisionFile,
    isVisionAnalyzing,
    visionAnalysisResult,
    clearVision,
    sendVisionFrame,
    isConnected
  } = useAuraStore();

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null); // Used for capturing frames
  const overlayRef = React.useRef<HTMLCanvasElement>(null); // Used for drawing markers
  const [isStreaming, setIsStreaming] = React.useState(false);
  const streamRef = React.useRef<MediaStream | null>(null);
  const intervalRef = React.useRef<number | null>(null);
  
  // Camera settings
  const [facingMode, setFacingMode] = React.useState<'user' | 'environment'>('environment');

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start/Stop camera when mode changes
  React.useEffect(() => {
    if (visionMode === 'live') {
      startCamera();
    } else {
      stopCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visionMode, facingMode]); // Restart if facing mode changes

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const startCamera = async () => {
    stopCamera(); // Ensure previous stream is closed
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        // Wait for metadata to load to set dimensions
        videoRef.current.onloadedmetadata = () => {
            setIsStreaming(true);
            startFrameTransmission();
            // Adjust overlay canvas size to match video
            if (overlayRef.current && videoRef.current) {
                overlayRef.current.width = videoRef.current.videoWidth;
                overlayRef.current.height = videoRef.current.videoHeight;
            }
        };
      }
    } catch (err) {
      console.error("Failed to access camera", err);
    }
  };

  const stopCamera = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  const startFrameTransmission = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // 1fps is a good balance for Gemini Live
    intervalRef.current = window.setInterval(() => {
      if (videoRef.current && canvasRef.current && isConnected) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          // Capture frame at lower resolution if needed for bandwidth
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0);
          
          // Send as base64 JPEG (0.6 quality is usually sufficient for CV)
          const base64 = canvasRef.current.toDataURL('image/jpeg', 0.6).split(',')[1];
          sendVisionFrame(base64);
          
          // Future: If backend returns bounding boxes, draw them on overlayRef here
        }
      }
    }, 1000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVisionFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 bg-gray-900/80 backdrop-blur-md rounded-xl text-white">
      <div className="w-full max-w-4xl h-full flex flex-col bg-[#111] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        
        {/* Header / Tabs */}
        <div className="flex border-b border-white/10 bg-[#0a0a0a] shrink-0">
          {[
            { id: 'image', label: 'Imagem', icon: ImageIcon },
            { id: 'video', label: 'Vídeo', icon: Video },
            { id: 'live', label: 'Câmera Ao Vivo', icon: Camera }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => openVisionSurface(tab.id as any)}
              className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors
                ${visionMode === tab.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}
              `}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 relative overflow-y-auto p-6 flex flex-col items-center scrollbar-thin scrollbar-thumb-gray-700">
          
          {/* LIVE MODE */}
          {visionMode === 'live' && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              
              {/* Video Container */}
              <div className="relative w-full max-w-md aspect-[9/16] sm:aspect-video bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl group">
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} // Mirror front camera
                />
                {/* Hidden canvas for capture */}
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Overlay canvas for object markers/bounding boxes */}
                <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />

                {/* Camera Controls Overlay */}
                <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
                    <div className="flex justify-end">
                        {isConnected && isStreaming && (
                            <div className="flex items-center gap-2 bg-red-500/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg">
                                <div className="w-2 h-2 bg-white rounded-full" /> LIVE
                            </div>
                        )}
                    </div>
                    
                    <div className="flex justify-center pointer-events-auto">
                         <button 
                            onClick={toggleCamera}
                            className="p-3 rounded-full bg-black/50 text-white border border-white/20 hover:bg-blue-600 hover:border-blue-500 transition-all active:scale-95"
                            title="Trocar Câmera"
                         >
                            <SwitchCamera className="w-6 h-6" />
                         </button>
                    </div>
                </div>

                {/* Scan Line Animation (Visual Feedback) */}
                {isConnected && isStreaming && (
                     <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                        <div className="w-full h-1 bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)] animate-[scan_3s_linear_infinite]"></div>
                     </div>
                )}

                {!isStreaming && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-zinc-900">
                      <Loader2 className="w-8 h-8 animate-spin mb-2" />
                      <span className="text-xs uppercase tracking-widest">Iniciando Câmera...</span>
                   </div>
                )}
              </div>

              <p className="text-sm text-gray-400 text-center max-w-md animate-fade-in-down">
                {isConnected 
                  ? "A AURA está analisando o vídeo em tempo real (1 fps)." 
                  : "Conecte-se à AURA (botão Initialize) para iniciar a análise."}
              </p>
            </div>
          )}

          {/* IMAGE / VIDEO UPLOAD MODE */}
          {(visionMode === 'image' || visionMode === 'video') && (
            <div className="w-full max-w-2xl flex flex-col gap-6 animate-fade-in-down">
              {!visionFile ? (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/5 hover:border-blue-500/50 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400 group-hover:text-blue-400 transition-colors">
                    <Upload className="w-12 h-12 mb-4 transform group-hover:-translate-y-1 transition-transform" />
                    <p className="mb-2 text-lg font-medium">Clique para enviar ou arraste</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                      {visionMode === 'image' ? 'PNG, JPG, WEBP (Max 10MB)' : 'MP4, MOV, WEBM (Max 100MB)'}
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept={visionMode === 'image' ? "image/*" : "video/*"} 
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="w-full flex flex-col gap-4">
                   <div className="relative w-full bg-black rounded-xl overflow-hidden border border-white/10 flex items-center justify-center min-h-[300px] max-h-[500px] shadow-2xl">
                      {visionFile.type.startsWith('image') ? (
                        <img src={URL.createObjectURL(visionFile)} alt="Preview" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <video src={URL.createObjectURL(visionFile)} controls className="max-w-full max-h-full" />
                      )}
                      <button 
                        onClick={clearVision}
                        className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-red-500 text-white rounded-full transition-colors backdrop-blur-sm"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                   </div>
                   
                   <div className="flex justify-center">
                      <button
                        onClick={analyzeVisionFile}
                        disabled={isVisionAnalyzing}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-full font-semibold text-white shadow-lg shadow-blue-900/20 flex items-center gap-3 transition-all hover:scale-105 active:scale-95"
                      >
                        {isVisionAnalyzing ? (
                          <><Loader2 className="w-5 h-5 animate-spin" /> Analisando...</>
                        ) : (
                          <><ScanLine className="w-5 h-5" /> Analisar Arquivo</>
                        )}
                      </button>
                   </div>
                </div>
              )}

              {visionAnalysisResult && (
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 animate-fade-in-down">
                   <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      <h3 className="text-lg font-semibold text-white">Resultado da Análise</h3>
                   </div>
                   <div className="prose prose-invert prose-sm max-w-none">
                     <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                       {visionAnalysisResult}
                     </p>
                   </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};