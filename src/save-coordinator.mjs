// Independent client CAS contract. This is not an existing WaveAlpha API adapter.
// connect() accepts an already authenticated snapshot. No tokens are handled here.
export class SaveCoordinator {
  #send; #id; #epoch = 0; #owner = null; #revision = 0; #latest = null; #acked = null;
  #pending = null; #flight = null; #status = 'disconnected';
  constructor({ send, operationId }) {
    if (typeof send !== 'function' || typeof operationId !== 'function') throw new TypeError('save adapters required');
    this.#send = send; this.#id = operationId;
  }
  connect({ ownerId, revision, snapshot }) {
    if (typeof ownerId !== 'string' || !ownerId || !Number.isSafeInteger(revision) || revision < 0) throw new TypeError('invalid server snapshot');
    const body = JSON.stringify(snapshot);
    if (body === undefined) throw new TypeError('snapshot required');
    ++this.#epoch; this.#owner = ownerId; this.#revision = revision;
    this.#latest = body; this.#acked = body; this.#pending = null; this.#flight = null; this.#status = 'saved';
  }
  disconnect() {
    ++this.#epoch; this.#owner = null; this.#latest = this.#acked = this.#pending = this.#flight = null; this.#status = 'disconnected';
  }
  stage(snapshot) {
    if (!this.#owner) throw new Error('not connected');
    const body = JSON.stringify(snapshot); if (body === undefined) throw new TypeError('snapshot required');
    this.#latest = body;
    if (this.#status !== 'conflict') this.#status = this.#pending || body !== this.#acked ? 'dirty' : 'saved';
  }
  state() { return { status: this.#status, revision: this.#revision, dirty: !!this.#owner && (this.#latest !== this.#acked || !!this.#pending), ownerId: this.#owner }; }
  flush() {
    if (!this.#owner) return Promise.resolve({ status: 'disconnected' });
    if (this.#status === 'conflict') return Promise.resolve({ status: 'conflict' });
    if (this.#flight) return this.#flight;
    const epoch = this.#epoch;
    // Publish the single-flight promise before user supplied adapters can reenter.
    const task = Promise.resolve().then(() => this.#drain(epoch));
    this.#flight = task;
    task.then(() => { if (this.#flight === task) this.#flight = null; }, () => { if (this.#flight === task) this.#flight = null; });
    return task;
  }
  async #drain(epoch) {
    while (epoch === this.#epoch && this.#owner && (this.#pending || this.#latest !== this.#acked)) {
      if (!this.#pending) {
        const id = this.#id(); if (typeof id !== 'string' || !id || id.length > 200) throw new Error('secure operation ID required');
        this.#pending = Object.freeze({ ownerId: this.#owner, expectedRevision: this.#revision, operationId: id, body: this.#latest });
      }
      const op = this.#pending; this.#status = 'saving';
      let response;
      try { response = await this.#send(Object.freeze({ ...op, snapshot: JSON.parse(op.body) })); }
      catch { if (epoch !== this.#epoch) return { status: 'stale' }; this.#status = 'retry-pending'; return this.state(); }
      if (epoch !== this.#epoch) return { status: 'stale' };
      if (response?.status === 409) { this.#status = 'conflict'; return this.state(); }
      if (response?.ok !== true || response.operationId !== op.operationId || !Number.isSafeInteger(response.revision) || response.revision !== op.expectedRevision + 1) {
        this.#status = 'retry-pending'; return this.state();
      }
      this.#revision = response.revision; this.#acked = op.body; this.#pending = null;
    }
    if (epoch !== this.#epoch) return { status: 'stale' };
    this.#status = 'saved'; return this.state();
  }
}
