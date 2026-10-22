const TYPES = new Map([['trendline', 2], ['horizontal', 1], ['rectangle', 2], ['fibonacci', 2], ['text', 1]]);
const clone = value => structuredClone(value);
function identity(value) { return typeof value === 'string' && value.length > 0 && value.length <= 180; }
export function validateDocument(doc) {
  if (!doc || doc.schema !== 1 || !['ownerId', 'workspaceId', 'symbol', 'timeframe'].every(k => identity(doc[k])) || !Array.isArray(doc.drawings) || doc.drawings.length > 10000) throw new TypeError('invalid drawing document');
  const ids = new Set();
  for (const d of doc.drawings) {
    if (!d || !identity(d.id) || ids.has(d.id) || !TYPES.has(d.type) || !Array.isArray(d.anchors) || d.anchors.length !== TYPES.get(d.type)) throw new TypeError('invalid drawing');
    ids.add(d.id);
    for (const a of d.anchors) if (!a || !Number.isFinite(a.time) || !Number.isFinite(a.price)) throw new TypeError('invalid anchor');
    if (d.text !== undefined && (typeof d.text !== 'string' || d.text.length > 10000)) throw new TypeError('invalid text');
  }
  return doc;
}
export class DrawingDocument {
  #state; #undo = []; #redo = []; #limit;
  constructor(state, { historyLimit = 100 } = {}) {
    if (!Number.isInteger(historyLimit) || historyLimit < 1 || historyLimit > 1000) throw new RangeError('invalid history limit');
    this.#state = clone(validateDocument(state)); this.#limit = historyLimit;
  }
  snapshot() { return clone(this.#state); }
  #commit(next) {
    validateDocument(next);
    if (JSON.stringify(next) === JSON.stringify(this.#state)) return false;
    this.#undo.push(this.#state); if (this.#undo.length > this.#limit) this.#undo.shift();
    this.#state = next; this.#redo = []; return true;
  }
  upsert(drawing) {
    const next = this.snapshot(), index = next.drawings.findIndex(d => d.id === drawing.id);
    if (index < 0) next.drawings.push(clone(drawing)); else next.drawings[index] = clone(drawing);
    return this.#commit(next);
  }
  remove(id) { const next = this.snapshot(); next.drawings = next.drawings.filter(d => d.id !== id); return this.#commit(next); }
  undo() { if (!this.#undo.length) return false; this.#redo.push(this.#state); this.#state = this.#undo.pop(); return true; }
  redo() { if (!this.#redo.length) return false; this.#undo.push(this.#state); this.#state = this.#redo.pop(); return true; }
  serialize() { return JSON.stringify(this.#state); }
  static parse(json, expectedOwner) {
    const state = validateDocument(JSON.parse(json));
    if (!identity(expectedOwner) || state.ownerId !== expectedOwner) throw new Error('owner mismatch');
    return new DrawingDocument(state);
  }
}
