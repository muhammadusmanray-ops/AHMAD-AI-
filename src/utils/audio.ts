/**
 * High-performance audio conversion and playback engine for Gemini Live API.
 * Gemini Live expects 16kHz 16-bit PCM input and returns 24kHz 16-bit PCM output.
 */

export function downsampleTo16k(input: Float32Array, inputSampleRate: number): Float32Array {
  if (!inputSampleRate || inputSampleRate === 16000) return input;
  const ratio = inputSampleRate / 16000;
  const newLength = Math.round(input.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetInput = 0;
  while (offsetResult < result.length) {
    const nextOffsetInput = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetInput; i < nextOffsetInput && i < input.length; i++) {
      accum += input[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetInput = nextOffsetInput;
  }
  return result;
}

export function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new DataView(new ArrayBuffer(input.length * 2));
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return output.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function pcm16ToFloat32(arrayBuffer: ArrayBuffer): Float32Array {
  const view = new DataView(arrayBuffer);
  const sampleCount = Math.floor(arrayBuffer.byteLength / 2);
  const float32 = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    const int16 = view.getInt16(i * 2, true);
    float32[i] = int16 / (int16 < 0 ? 32768 : 32767);
  }
  return float32;
}

/**
 * Gapless Audio Queue Player for Gemini Live 24kHz PCM responses
 */
export class AudioQueuePlayer {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isPlaying = false;
  private onPlaybackStateChange?: (isPlaying: boolean) => void;

  constructor(onPlaybackStateChange?: (isPlaying: boolean) => void) {
    this.onPlaybackStateChange = onPlaybackStateChange;
  }

  public async init() {
    if (!this.ctx || this.ctx.state === "closed") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 1.0;

      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn("Could not resume player AudioContext:", err);
      }
    }
  }

  public setVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  public playChunk(base64Audio: string) {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    if (!this.ctx || !this.gainNode) return;

    try {
      const arrayBuffer = base64ToArrayBuffer(base64Audio);
      const float32Data = pcm16ToFloat32(arrayBuffer);
      if (float32Data.length === 0) return;

      const audioBuffer = this.ctx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.copyToChannel(float32Data, 0);

      const source = this.ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode);

      const currentTime = this.ctx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.005;
      }

      source.start(this.nextStartTime);
      this.activeSources.push(source);

      if (!this.isPlaying) {
        this.isPlaying = true;
        this.onPlaybackStateChange?.(true);
      }

      this.nextStartTime += audioBuffer.duration;

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx > -1) {
          this.activeSources.splice(idx, 1);
        }
        if (this.activeSources.length === 0) {
          this.isPlaying = false;
          this.nextStartTime = 0;
          this.onPlaybackStateChange?.(false);
        }
      };
    } catch (e) {
      console.error("Error scheduling audio chunk:", e);
    }
  }

  public interrupt() {
    // Stop all playing audio sources immediately
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Source might have finished already
      }
    }
    this.activeSources = [];
    if (this.ctx) {
      this.nextStartTime = this.ctx.currentTime;
    } else {
      this.nextStartTime = 0;
    }
    if (this.isPlaying) {
      this.isPlaying = false;
      this.onPlaybackStateChange?.(false);
    }
  }

  public getVolumeLevel(): number {
    if (!this.analyser || !this.isPlaying) return 0;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / (data.length * 255);
  }

  public getFrequencyData(array: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array);
    }
  }

  public close() {
    this.interrupt();
    if (this.ctx && this.ctx.state !== "closed") {
      this.ctx.close();
    }
    this.ctx = null;
  }
}

/**
 * 16kHz Microphone Stream Recorder & Processor for Gemini Live API
 */
export class AudioRecorder {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isRecording = false;
  private isMuted = false;
  private onAudioChunk?: (base64Data: string) => void;

  constructor(onAudioChunk?: (base64Data: string) => void) {
    this.onAudioChunk = onAudioChunk;
  }

  public async start(): Promise<void> {
    if (this.isRecording) return;

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    try {
      this.ctx = new AudioCtx({ sampleRate: 16000 });
    } catch (e) {
      this.ctx = new AudioCtx();
    }

    if (this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn("Could not resume AudioContext:", err);
      }
    }

    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 128;
    this.analyser.smoothingTimeConstant = 0.7;

    // Script processor node buffer size 2048 (approx 42-128ms chunk)
    this.processor = this.ctx.createScriptProcessor(2048, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.isRecording || this.isMuted) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const inputSampleRate = e.inputBuffer.sampleRate || this.ctx?.sampleRate || 48000;
      const resampledData = downsampleTo16k(inputData, inputSampleRate);
      const pcm16Buffer = floatTo16BitPCM(resampledData);
      const base64 = arrayBufferToBase64(pcm16Buffer);
      this.onAudioChunk?.(base64);
    };

    this.source.connect(this.analyser);
    this.analyser.connect(this.processor);
    this.processor.connect(this.ctx.destination);

    this.isRecording = true;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.stream) {
      this.stream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  public getVolumeLevel(): number {
    if (!this.analyser || !this.isRecording || this.isMuted) return 0;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / (data.length * 255);
  }

  public stop() {
    this.isRecording = false;
    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.ctx && this.ctx.state !== "closed") {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
