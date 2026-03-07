/**
 * Simple Operational Transformation engine.
 * Uses string-based operations: retain(n), insert(s), delete(n)
 * Compatible with the client-side otClient.js
 */

class TextOperation {
  constructor() {
    this.ops = [];   // array of: number (retain/delete) | string (insert)
    this.baseLen = 0;
    this.targetLen = 0;
  }

  retain(n) {
    if (n === 0) return this;
    this.baseLen += n;
    this.targetLen += n;
    if (typeof this.ops[this.ops.length - 1] === 'number' && this.ops[this.ops.length - 1] > 0) {
      this.ops[this.ops.length - 1] += n;
    } else {
      this.ops.push(n);
    }
    return this;
  }

  insert(str) {
    if (str === '') return this;
    this.targetLen += str.length;
    const last = this.ops[this.ops.length - 1];
    if (typeof last === 'string') {
      this.ops[this.ops.length - 1] += str;
    } else {
      this.ops.push(str);
    }
    return this;
  }

  delete(n) {
    if (n === 0) return this;
    this.baseLen += n;
    if (typeof this.ops[this.ops.length - 1] === 'number' && this.ops[this.ops.length - 1] < 0) {
      this.ops[this.ops.length - 1] -= n;
    } else {
      this.ops.push(-n);
    }
    return this;
  }

  apply(doc) {
    if (doc.length !== this.baseLen) throw new Error('Apply: doc length mismatch');
    let result = '';
    let idx = 0;
    for (const op of this.ops) {
      if (typeof op === 'string') {
        result += op;
      } else if (op > 0) {
        result += doc.slice(idx, idx + op);
        idx += op;
      } else {
        idx -= op;
      }
    }
    return result;
  }

  // Transform op A against op B (both applied to same document)
  static transform(a, b) {
    const a1 = new TextOperation();
    const b1 = new TextOperation();
    let ia = 0, ib = 0;
    const opsA = a.ops.slice();
    const opsB = b.ops.slice();

    function opLen(op) { return typeof op === 'string' ? op.length : Math.abs(op); }

    while (ia < opsA.length || ib < opsB.length) {
      const opA = opsA[ia];
      const opB = opsB[ib];

      // Insert from A
      if (typeof opA === 'string') { a1.insert(opA); b1.retain(opA.length); ia++; continue; }
      // Insert from B
      if (typeof opB === 'string') { a1.retain(opB.length); b1.insert(opB); ib++; continue; }

      if (ia >= opsA.length || ib >= opsB.length) break;

      const lenA = opLen(opA);
      const lenB = opLen(opB);
      const minLen = Math.min(lenA, lenB);

      if (opA > 0 && opB > 0) {
        // Both retain
        a1.retain(minLen); b1.retain(minLen);
      } else if (opA < 0 && opB < 0) {
        // Both delete — no-op in transform
      } else if (opA < 0 && opB > 0) {
        // A deletes, B retains
        a1.delete(minLen);
      } else if (opA > 0 && opB < 0) {
        // A retains, B deletes
        b1.delete(minLen);
      }

      if (lenA === minLen) ia++;
      else opsA[ia] = opA > 0 ? opA - minLen : opA + minLen;
      if (lenB === minLen) ib++;
      else opsB[ib] = opB > 0 ? opB - minLen : opB + minLen;
    }

    return [a1, b1];
  }

  toJSON() { return { ops: this.ops, baseLen: this.baseLen, targetLen: this.targetLen }; }

  static fromJSON(data) {
    const op = new TextOperation();
    op.ops = data.ops;
    op.baseLen = data.baseLen;
    op.targetLen = data.targetLen;
    return op;
  }
}

class OTServer {
  constructor(content = '') {
    this.document = content;
    this.operations = [];
  }

  receiveOperation(revision, operationData) {
    const operation = TextOperation.fromJSON(operationData);

    // Transform against all operations since this revision
    let op = operation;
    for (let i = revision; i < this.operations.length; i++) {
      [op] = TextOperation.transform(op, this.operations[i]);
    }

    this.document = op.apply(this.document);
    this.operations.push(op);
    return op;
  }

  getRevision() { return this.operations.length; }
}

module.exports = { OTServer, TextOperation };
