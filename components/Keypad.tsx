import React from 'react';
import { playSound } from '../utils/sound';

interface KeypadProps {
  onKeyPress: (key: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  value: string;
  onBack: () => void;
}

const Keypad: React.FC<KeypadProps> = ({ onKeyPress, onClear, onSubmit, value, onBack }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'];

  const handlePress = (k: string) => {
    if (k === 'C') {
      playSound('cancel');
      onClear();
    } else if (k === 'OK') {
      playSound('success');
      onSubmit();
    } else {
      playSound('click');
      onKeyPress(k);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-4 animate-fade-in">
        <div className="w-full mb-8">
          <label className="block text-slate-400 text-sm font-semibold mb-2 uppercase tracking-wider">
            Número de Série (ID)
          </label>
          <div className="h-16 w-full bg-slate-800 rounded-2xl shadow-inner border-2 border-slate-700 flex items-center justify-center text-3xl font-mono tracking-widest text-white">
            {value || <span className="text-slate-600">_ _ _ _</span>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 w-full">
          {keys.map((k) => {
              const bgColor = k === 'OK' ? 'bg-emerald-600 text-white active:bg-emerald-700 border-0' : 
                              k === 'C' ? 'bg-rose-900/40 text-rose-300 active:bg-rose-900/60 border border-rose-900/50' : 
                              'bg-slate-800 text-white shadow-sm active:bg-slate-700 border border-slate-700';
              
              return (
              <button
                key={k}
                onClick={() => handlePress(k)}
                className={`${bgColor} h-20 rounded-2xl text-2xl font-bold transition-all transform active:scale-95 flex items-center justify-center`}
              >
                {k === 'C' ? (
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
                  </svg>
                ) : k === 'OK' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                ) : (
                  k
                )}
              </button>
              )
          })}
        </div>
        
        <button 
          onClick={() => {
            playSound('cancel');
            onBack();
          }}
          className="mt-8 text-slate-500 font-medium hover:text-slate-300 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Voltar para Início
        </button>
      </div>
    </>
  );
};

export default Keypad;