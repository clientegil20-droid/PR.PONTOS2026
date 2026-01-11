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
    <div className="flex flex-col items-center justify-center w-full h-full p-4">
      <div className="bg-slate-800 p-4 rounded-3xl shadow-xl w-full max-w-2xl border border-slate-700">
        <h2 className="text-xl text-center font-bold text-white mb-4">
          Olá, <span className="text-blue-400">{employeeName}</span>
        </h2>
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4] w-full mb-6 shadow-inner group border border-slate-700">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center bg-slate-900/80">
              <p className="mb-4 text-red-300 font-semibold">{error}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-200 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          )}

          {/* Overlay Guide */}
          {!error && (
            <div className="absolute inset-0 border-4 border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
              <div className="w-64 h-80 border-2 border-white/50 rounded-full border-dashed opacity-50 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-white/30 rounded-full mt-8"></div>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              playSound('cancel');
              onCancel();
            }}
            className="flex items-center justify-center py-4 bg-slate-700 text-slate-200 rounded-xl font-bold hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCapture}
            disabled={!!error || !stream}
            className={`flex items-center justify-center py-4 rounded-xl font-bold transition-colors shadow-lg active:scale-95 transform ${error || !stream
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900/50'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
            Tirar Foto
          </button>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-500 text-center">
        Posicione seu rosto dentro da marcação e clique em tirar foto.
      </p>
    </div>
  );
};

export default CameraFeed;