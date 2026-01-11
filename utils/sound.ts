let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx) {
    // @ts-ignore
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
};

export type SoundType = 'click' | 'success' | 'cancel' | 'shutter' | 'start';

export const playSound = (type: SoundType) => {
  try {
    const ctx = getCtx();
    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Default settings
    osc.type = 'sine';
    
    if (type === 'click') {
      // Subtle high tick for typing
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.03);
      gain.gain.setValueAtTime(0.05, t); // Quiet
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      osc.start(t);
      osc.stop(t + 0.04);
    } 
    else if (type === 'success') {
      // Pleasant rising tone
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.1);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.15);
    } 
    else if (type === 'cancel') {
      // Low falling tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.linearRampToValueAtTime(100, t + 0.1);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
    }
    else if (type === 'shutter') {
      // Quick mechanical sound imitation
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.start(t);
      osc.stop(t + 0.1);
    }
    else if (type === 'start') {
      // Gentle wake up sound
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.15);
      gain.gain.setValueAtTime(0.02, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  } catch (e) {
    // Fail silently if audio is not supported/allowed
    console.warn("Audio playback failed", e);
  }
};
