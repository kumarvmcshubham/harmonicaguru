// js/yin.js
// YIN pitch detection algorithm — ported from hb-ai-coach-v4.html
// Do not modify — this is the core audio engine

export function yin(float32Array, sampleRate) {
  const W = float32Array.length;
  const half = W >> 1;
  const yinBuf = new Float32Array(half);
  yinBuf[0] = 1;
  let runSum = 0;
  let tauEstimate = -1;
  const threshold = 0.15;

  for (let tau = 1; tau < half; tau++) {
    let s = 0;
    for (let i = 0; i < half; i++) {
      const d = float32Array[i] - float32Array[i + tau];
      s += d * d;
    }
    runSum += s;
    yinBuf[tau] = runSum > 0 ? (s * tau) / runSum : 0;
    if (tau > 2 && yinBuf[tau] < threshold) {
      if (yinBuf[tau] < yinBuf[tau - 1]) {
        tauEstimate = tau;
        break;
      }
    }
  }

  if (tauEstimate === -1) {
    // Find global minimum
    let minVal = Infinity, minTau = -1;
    for (let tau = 1; tau < half; tau++) {
      if (yinBuf[tau] < minVal) { minVal = yinBuf[tau]; minTau = tau; }
    }
    tauEstimate = minTau;
  }

  // Parabolic interpolation
  if (tauEstimate > 1 && tauEstimate < half - 1) {
    const s0 = yinBuf[tauEstimate - 1];
    const s1 = yinBuf[tauEstimate];
    const s2 = yinBuf[tauEstimate + 1];
    const denom = 2 * (2 * s1 - s2 - s0);
    if (denom !== 0) tauEstimate += (s2 - s0) / denom;
  }

  const pitch = tauEstimate > 0 ? sampleRate / tauEstimate : null;
  const clarity = tauEstimate > 0
    ? Math.max(0, 1 - yinBuf[Math.round(tauEstimate)] / threshold)
    : 0;

  return { pitch, clarity };
}

export function getRMS(buffer) {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}