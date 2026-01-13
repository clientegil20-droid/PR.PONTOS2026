import React, { useRef, useEffect, useState, useCallback } from 'react';
import { playSound } from '../utils/sound';

interface CameraFeedProps {
  onCapture: (imageSrc: string) => void;
  onCancel: () => void;
  employeeName: string;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ onCapture, onCancel, employeeName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  const startCamera = useCallback(async () => {
    setError('');
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 1280 }
        }
      });
      setStream(currentStream);
      if (videoRef.current) {
        videoRef.current.srcObject = currentStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Não foi possível acessar a câmera. Verifique se a permissão foi concedida.");
    }
  }, []);

  useEffect(() => {
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [stream]);

  const handleRetry = () => {
    playSound('click');
    startCamera();
  };

  const handleCapture = useCallback(() => {
    playSound('shutter');
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageSrc = canvas.toDataURL('image/png');
        onCapture(imageSrc);
      }
    }
  }, [onCapture]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 animate-slide-up">
      <div className="glass-card p-8 rounded-[3rem] border border-white/10 shadow-2xl w-full max-w-2xl relative overflow-hidden group">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em] mb-2">Identificação Visual</p>
          <h2 className="text-3xl font-black text-white tracking-tighter">
            Olá, <span className="text-indigo-400">{employeeName}</span>
          </h2>
        </div>

        <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 aspect-[3/4] w-full mb-8 shadow-2xl border border-white/5 group-hover:border-indigo-500/30 transition-all duration-500">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center bg-slate-900">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 border border-red-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8 text-red-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.731 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <p className="mb-6 text-slate-400 font-medium text-sm">{error}</p>
              <button
                onClick={handleRetry}
                className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1] opacity-90"
              />
              {/* Overlay Guide */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-80 border-2 border-indigo-500/30 rounded-full border-dashed opacity-50 relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500/50 rounded-full mt-10 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                </div>
                {/* corner markers */}
                <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-white/20 rounded-tl-xl transition-all group-hover:border-indigo-500/50 group-hover:scale-110"></div>
                <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-white/20 rounded-tr-xl transition-all group-hover:border-indigo-500/50 group-hover:scale-110"></div>
                <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-white/20 rounded-bl-xl transition-all group-hover:border-indigo-500/50 group-hover:scale-110"></div>
                <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-white/20 rounded-br-xl transition-all group-hover:border-indigo-500/50 group-hover:scale-110"></div>
              </div>
            </>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="grid grid-cols-2 gap-4 relative z-10">
          <button
            onClick={() => {
              playSound('cancel');
              onCancel();
            }}
            className="flex items-center justify-center py-5 bg-slate-800/50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/5 hover:text-white hover:bg-slate-800 transition-all active:scale-95"
          >
            Voltar
          </button>
          <button
            onClick={handleCapture}
            disabled={!!error || !stream}
            className={`flex items-center justify-center py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 transform ${error || !stream
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-900/40'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 mr-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
            Capturar Foto
          </button>
        </div>
      </div>
      <p className="mt-8 text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] animate-pulse">
        Posicione seu rosto dentro da marcação central
      </p>
    </div>
  );
};

export default CameraFeed;