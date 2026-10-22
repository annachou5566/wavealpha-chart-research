// Original implementation from this project's behavior specification.
// This controls UI actions only. Server authorization remains mandatory.
export class ActionGate {
  #read; #prompt; #opening = null;
  constructor({ readAccess, openLogin }) {
    if (typeof readAccess !== 'function' || typeof openLogin !== 'function') throw new TypeError('access adapters required');
    this.#read = readAccess; this.#prompt = openLogin;
  }
  async run({ feature, contextKey, execute }) {
    if (!['drawing', 'indicator', 'workspace'].includes(feature) || typeof execute !== 'function') throw new TypeError('invalid action');
    const access = this.#read();
    if (!access?.verified || !access.userId) {
      if (!this.#opening) {
        this.#opening = Promise.resolve().then(() => this.#prompt({ feature }));
        const current = this.#opening;
        current.then(() => { if (this.#opening === current) this.#opening = null; }, () => { if (this.#opening === current) this.#opening = null; });
      }
      await this.#opening;
      // Login never automatically replays a tool selection into another chart.
      return { status: 'login-required' };
    }
    if (access.contextKey !== contextKey) return { status: 'context-changed' };
    if (access.durableReady !== true) return { status: 'storage-pending' };
    // The action receives an owner/context fence to recheck at its mutation boundary.
    const fence = () => {
      const now = this.#read();
      return now?.verified === true && now.userId === access.userId && now.contextKey === contextKey && now.durableReady === true;
    };
    if (!fence()) return { status: 'context-changed' };
    return { status: 'executed', value: await execute({ userId: access.userId, contextKey, fence }) };
  }
}
