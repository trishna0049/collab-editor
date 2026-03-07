/**
 * Client-side OT state machine.
 * States: Synchronized → Awaiting → AwaitingWithBuffer
 */

class TextOperation {
  constructor(ops = [], baseLen = 0, targetLen = 0) {
    this.ops = ops;
    this.baseLen = baseLen;
    this.targetLen = targetLen;
  }

  static fromJSON(data) {
    return new TextOperation(data.ops, data.baseLen, data.targetLen);
  }

  toJSON() { return { ops: this.ops, baseLen: this.baseLen, targetLen: this.targetLen }; }

  apply(doc) {
    let result = '';
    let idx = 0;
    for (const op of this.ops) {
      if (typeof op === 'string') { result += op; }
      else if (op > 0) { result += doc.slice(idx, idx + op); idx += op; }
      else { idx -= op; }
    }
    return result;
  }

  compose(other) {
    const composed = new TextOperation();
    let i = 0, j = 0;
    const opsA = this.ops.slice();
    const opsB = other.ops.slice();

    while (i < opsA.length || j < opsB.length) {
      const a = opsA[i], b = opsB[j];
      if (typeof b === 'string') { composed.ops.push(b); j++; continue; }
      if (typeof a === 'number' && a < 0) { composed.ops.push(a); i++; continue; }
      if (!a || !b) break;
      const lenA = typeof a === 'string' ? a.length : Math.abs(a);
      const lenB = Math.abs(b);
      const min = Math.min(lenA, lenB);
      if (typeof a === 'string' && b > 0) { composed.ops.push(a.slice(0, min)); }
      else if (typeof a === 'number' && a > 0 && b > 0) { composed.ops.push(min); }
      else if (typeof a === 'number' && a > 0 && b < 0) { composed.ops.push(-min); }
      if (lenA === min) i++; else opsA[i] = typeof a === 'string' ? a.slice(min) : (a > 0 ? a - min : a + min);
      if (lenB === min) j++; else opsB[j] = b > 0 ? b - min : b + min;
    }
    composed.baseLen = this.baseLen;
    composed.targetLen = other.targetLen;
    return composed;
  }

  static transform(a, b) {
    const a1 = new TextOperation(), b1 = new TextOperation();
    let ia = 0, ib = 0;
    const opsA = a.ops.slice(), opsB = b.ops.slice();
    const opLen = (op) => typeof op === 'string' ? op.length : Math.abs(op);

    while (ia < opsA.length || ib < opsB.length) {
      const opA = opsA[ia], opB = opsB[ib];
      if (typeof opA === 'string') { a1.ops.push(opA); b1.ops.push(opA.length); ia++; continue; }
      if (typeof opB === 'string') { a1.ops.push(opB.length); b1.ops.push(opB); ib++; continue; }
      if (ia >= opsA.length || ib >= opsB.length) break;
      const min = Math.min(opLen(opA), opLen(opsB[ib]));
      if (opA > 0 && opB > 0) { a1.ops.push(min); b1.ops.push(min); }
      else if (opA < 0 && opB < 0) { /* both delete, cancel */ }
      else if (opA < 0 && opB > 0) { a1.ops.push(-min); }
      else if (opA > 0 && opB < 0) { b1.ops.push(-min); }
      if (opLen(opA) === min) ia++; else opsA[ia] = opA > 0 ? opA - min : opA + min;
      if (opLen(opB) === min) ib++; else opsB[ib] = opB > 0 ? opB - min : opB + min;
    }
    a1.baseLen = a.baseLen; a1.targetLen = a.targetLen;
    b1.baseLen = b.baseLen; b1.targetLen = b.targetLen;
    return [a1, b1];
  }
}

const STATE = { SYNC: 'synchronized', AWAITING: 'awaiting', BUFFERED: 'awaiting-with-buffer' };

export class OTClient {
  constructor(revision) {
    this.revision = revision;
    this.state = STATE.SYNC;
    this.outstanding = null; // op sent, awaiting ack
    this.buffer = null;      // op typed while waiting for ack
    this.onSend = null;
    this.onApply = null;
  }

  // Called when user types
  applyClient(op) {
    if (this.state === STATE.SYNC) {
      this._send(op);
      this.state = STATE.AWAITING;
      this.outstanding = op;
    } else if (this.state === STATE.AWAITING) {
      this.buffer = op;
      this.state = STATE.BUFFERED;
    } else {
      this.buffer = this.buffer.compose(op);
    }
  }

  // Called when server broadcasts an op
  applyServer(op) {
    const operation = TextOperation.fromJSON(op);
    if (this.state === STATE.SYNC) {
      this.revision++;
      this.onApply && this.onApply(operation);
    } else if (this.state === STATE.AWAITING) {
      const [newOut, transformed] = TextOperation.transform(this.outstanding, operation);
      this.outstanding = newOut;
      this.revision++;
      this.onApply && this.onApply(transformed);
    } else {
      const [newOut, t1] = TextOperation.transform(this.outstanding, operation);
      const [newBuf, transformed] = TextOperation.transform(this.buffer, t1);
      this.outstanding = newOut;
      this.buffer = newBuf;
      this.revision++;
      this.onApply && this.onApply(transformed);
    }
  }

  // Called when server acknowledges our op
  serverAck() {
    this.revision++;
    if (this.state === STATE.AWAITING) {
      this.outstanding = null;
      this.state = STATE.SYNC;
    } else if (this.state === STATE.BUFFERED) {
      this._send(this.buffer);
      this.outstanding = this.buffer;
      this.buffer = null;
      this.state = STATE.AWAITING;
    }
  }

  _send(op) {
    this.onSend && this.onSend(this.revision, op.toJSON());
  }
}

export { TextOperation };
