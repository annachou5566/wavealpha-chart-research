export function viewport({ width, height, fromTime, toTime, minPrice, maxPrice }) {
  if (![width, height, fromTime, toTime, minPrice, maxPrice].every(Number.isFinite) || width <= 0 || height <= 0 || toTime <= fromTime || maxPrice <= minPrice) throw new RangeError('invalid viewport');
  return Object.freeze({
    toScreen: ({ time, price }) => ({ x: (time - fromTime) / (toTime - fromTime) * width, y: (maxPrice - price) / (maxPrice - minPrice) * height }),
    toAnchor: ({ x, y }) => ({ time: fromTime + x / width * (toTime - fromTime), price: maxPrice - y / height * (maxPrice - minPrice) }),
  });
}
export function segmentDistance(point, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, len = dx * dx + dy * dy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / len));
  return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
}
export function nearestOhlc(pointer, candles, transform, threshold = 10) {
  if (!Number.isFinite(threshold) || threshold < 0) throw new RangeError('invalid snap threshold');
  let result = null, distance = threshold;
  for (const bar of candles) for (const field of ['open', 'high', 'low', 'close']) {
    const anchor = { time: bar.time, price: bar[field] };
    if (!Number.isFinite(anchor.time) || !Number.isFinite(anchor.price)) continue;
    const screen = transform.toScreen(anchor), d = Math.hypot(screen.x - pointer.x, screen.y - pointer.y);
    if (d <= distance) { distance = d; result = { ...anchor, field, distance }; }
  }
  return result;
}
