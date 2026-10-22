function validate(values, period) {
  if (!Array.isArray(values) || !values.every(Number.isFinite) || !Number.isInteger(period) || period < 1) throw new TypeError('finite prices and a positive integer period required');
}
export function sma(values, period) {
  validate(values, period); const out = Array(values.length).fill(null); let sum = 0;
  for (let i = 0; i < values.length; i++) { sum += values[i]; if (i >= period) sum -= values[i - period]; if (i >= period - 1) out[i] = sum / period; }
  return out;
}
export function ema(values, period) {
  validate(values, period); const out = Array(values.length).fill(null);
  if (values.length < period) return out;
  let value = values.slice(0, period).reduce((a, b) => a + b, 0) / period; out[period - 1] = value;
  const alpha = 2 / (period + 1);
  for (let i = period; i < values.length; i++) { value += alpha * (values[i] - value); out[i] = value; }
  return out;
}
export function rsi(values, period) {
  validate(values, period); const out = Array(values.length).fill(null);
  if (values.length <= period) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) { const delta = values[i] - values[i - 1]; gain += Math.max(0, delta); loss += Math.max(0, -delta); }
  gain /= period; loss /= period;
  const score = () => gain === 0 && loss === 0 ? 50 : loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  out[period] = score();
  for (let i = period + 1; i < values.length; i++) { const delta = values[i] - values[i - 1]; gain = (gain * (period - 1) + Math.max(delta, 0)) / period; loss = (loss * (period - 1) + Math.max(-delta, 0)) / period; out[i] = score(); }
  return out;
}
