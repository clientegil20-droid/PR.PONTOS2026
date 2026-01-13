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
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto p-8 animate-slide-up bg-[#030712]/40 backdrop-blur-2xl rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full mb-10 text-center relative z-10">
        <label className="block text-indigo-300/50 text-[10px] font-black uppercase tracking-[0.4em] mb-4">
          Identificação do Colaborador
        </label>
        <div className="h-24 w-full bg-slate-900/50 rounded-[2rem] border-2 border-white/5 flex items-center justify-center text-5xl font-black tracking-[0.3em] text-white shadow-inner group-hover:border-indigo-500/30 transition-all">
          {value ? (
            <span className="animate-pulse text-indigo-400">{value}</span>
          ) : (
            <div className="flex gap-3 opacity-20">
              <span className="w-4 h-4 rounded-full bg-slate-500"></span>
              <span className="w-4 h-4 rounded-full bg-slate-500"></span>
              <span className="w-4 h-4 rounded-full bg-slate-500"></span>
              <span className="w-4 h-4 rounded-full bg-slate-500"></span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 w-full relative z-10">
        {keys.map((k) => {
          const isSpecial = k === 'OK' || k === 'C';
          const bgColor = k === 'OK' ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]' :
            k === 'C' ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20' :
              'bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/5';

          return (
            <button
              key={k}
              onClick={() => handlePress(k)}
              className={`${bgColor} h-24 rounded-[1.5rem] text-3xl font-black transition-all active:scale-90 flex items-center justify-center backdrop-blur-md`}
            >
              {k === 'C' ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
                </svg>
              ) : k === 'OK' ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
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
        className="mt-10 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-indigo-400 transition-colors flex items-center gap-3 py-2 px-6 rounded-full border border-transparent hover:border-indigo-500/20 hover:bg-indigo-500/5 group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 group-hover:-translate-x-1 transition-transform">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Sair do Sistema
      </button>
    </div>
  );
};


export default Keypad;