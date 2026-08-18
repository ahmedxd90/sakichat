type VoiceEffect = "none" | "squirrel" | "child";

export interface ZegoVoiceEffectHandle {
  context: AudioContext;
  processedTrack: MediaStreamTrack;
  source: MediaStreamAudioSourceNode;
}

function makeCurve(amount: number): WaveShaperNode["curve"] {
  const curve = new Float32Array(256);
  for (let i = 0; i < curve.length; i += 1) {
    const x = (i * 2) / (curve.length - 1) - 1;
    curve[i] = Math.tanh(x * amount);
  }
  return curve;
}

/**
 * Web SDK 3.x does not expose setVoiceChangerParam. This graph creates a
 * processed MediaStreamTrack that can be passed to ZEGOCLOUD replaceTrack.
 * It intentionally avoids routing the microphone to speakers, preventing
 * feedback in Android WebView.
 */
export async function createZegoVoiceEffect(
  rawStream: MediaStream,
  effect: Exclude<VoiceEffect, "none">,
): Promise<ZegoVoiceEffectHandle> {
  const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextCtor) throw new Error("Web Audio غير متاح في WebView الحالي");

  const context: AudioContext = new AudioContextCtor();
  await context.resume().catch(() => {});
  const source = context.createMediaStreamSource(rawStream);
  const destination = context.createMediaStreamDestination();
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 16;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.08;

  const shaper = context.createWaveShaper();
  shaper.oversample = "2x";
  shaper.curve = makeCurve(effect === "squirrel" ? 2.8 : 1.45);

  const highpass = context.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = effect === "squirrel" ? 165 : 70;

  const tone = context.createBiquadFilter();
  tone.type = effect === "squirrel" ? "highshelf" : "lowpass";
  tone.frequency.value = effect === "squirrel" ? 1450 : 4200;
  if (effect === "squirrel") tone.gain.value = 11;

  source.connect(highpass);
  highpass.connect(shaper);
  shaper.connect(tone);
  tone.connect(compressor);
  compressor.connect(destination);

  const processedTrack = destination.stream.getAudioTracks()[0];
  if (!processedTrack) {
    await context.close().catch(() => {});
    throw new Error("تعذر إنشاء مسار الصوت المعالج");
  }
  return { context, processedTrack, source };
}

export async function destroyZegoVoiceEffect(handle: ZegoVoiceEffectHandle | null) {
  if (!handle) return;
  try { handle.processedTrack.stop(); } catch (_) {}
  try { handle.source.disconnect(); } catch (_) {}
  await handle.context.close().catch(() => {});
}

export type { VoiceEffect };
