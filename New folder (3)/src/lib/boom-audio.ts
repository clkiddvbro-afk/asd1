let audioCtx: AudioContext | null = null;
let master: GainNode | null = null;

function context(): AudioContext {
  if (audioCtx && master) return audioCtx;
  const Ctx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) throw new Error("Web Audio is unavailable");
  const ctx = new Ctx();
  const gain = ctx.createGain();
  gain.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -12;
  comp.knee.value = 18;
  comp.ratio.value = 8;
  comp.attack.value = 0.002;
  comp.release.value = 0.28;
  gain.connect(comp);
  comp.connect(ctx.destination);
  audioCtx = ctx;
  master = gain;
  return ctx;
}

function noiseBurst(ctx: AudioContext, seconds: number, tilt: number): AudioBufferSourceNode {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const env = Math.pow(1 - i / length, tilt);
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  return source;
}

/** Detonation. Call inside the toggle click so the browser allows sound. */
export function playBoom(hot: boolean): void {
  let ctx: AudioContext;
  try {
    ctx = context();
  } catch {
    return;
  }
  void ctx.resume();
  const out = master;
  if (!out) return;
  const now = ctx.currentTime;
  const body = hot ? 1.25 : 0.62;

  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = "sine";
  sub.frequency.setValueAtTime(hot ? 128 : 86, now);
  sub.frequency.exponentialRampToValueAtTime(hot ? 26 : 38, now + (hot ? 0.5 : 0.28));
  subGain.gain.setValueAtTime(0.0001, now);
  subGain.gain.exponentialRampToValueAtTime(hot ? 1 : 0.5, now + 0.012);
  subGain.gain.exponentialRampToValueAtTime(0.0001, now + body);
  sub.connect(subGain);
  subGain.connect(out);
  sub.start(now);
  sub.stop(now + body + 0.05);

  const over = ctx.createOscillator();
  const overGain = ctx.createGain();
  over.type = "triangle";
  over.frequency.setValueAtTime(hot ? 74 : 52, now);
  over.frequency.exponentialRampToValueAtTime(30, now + 0.36);
  overGain.gain.setValueAtTime(0.0001, now);
  overGain.gain.exponentialRampToValueAtTime(hot ? 0.38 : 0.16, now + 0.02);
  overGain.gain.exponentialRampToValueAtTime(0.0001, now + (hot ? 0.85 : 0.4));
  over.connect(overGain);
  overGain.connect(out);
  over.start(now);
  over.stop(now + 1);

  const airSeconds = hot ? 0.62 : 0.28;
  const air = noiseBurst(ctx, airSeconds, 1.7);
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.setValueAtTime(hot ? 2200 : 800, now);
  lowpass.frequency.exponentialRampToValueAtTime(140, now + airSeconds);
  const airGain = ctx.createGain();
  airGain.gain.setValueAtTime(hot ? 0.72 : 0.28, now);
  airGain.gain.exponentialRampToValueAtTime(0.0001, now + airSeconds);
  air.connect(lowpass);
  lowpass.connect(airGain);
  airGain.connect(out);
  air.start(now);

  const crack = noiseBurst(ctx, 0.045, 1);
  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 1600;
  const crackGain = ctx.createGain();
  crackGain.gain.value = hot ? 0.5 : 0.18;
  crack.connect(highpass);
  highpass.connect(crackGain);
  crackGain.connect(out);
  crack.start(now);
}
