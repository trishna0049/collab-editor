const { OTServer, TextOperation } = require('./otEngine');

describe('OT engine', () => {
  test('applies retain/insert operation to a document', () => {
    const doc = 'hello world';
    const op = new TextOperation().retain(6).insert('beautiful ').retain(5);

    expect(op.apply(doc)).toBe('hello beautiful world');
  });

  test('transforms concurrent inserts to converge to same document', () => {
    const doc = 'abc';
    const opA = new TextOperation().retain(1).insert('X').retain(2);
    const opB = new TextOperation().retain(1).insert('Y').retain(2);

    const [aPrime, bPrime] = TextOperation.transform(opA, opB);

    const resultFromAThenB = bPrime.apply(opA.apply(doc));
    const resultFromBThenA = aPrime.apply(opB.apply(doc));

    expect(resultFromAThenB).toBe(resultFromBThenA);
    expect(resultFromAThenB).toBe('aXYbc');
  });

  test('server transforms stale revision operations correctly', () => {
    const server = new OTServer('abc');

    const op1 = new TextOperation().retain(1).insert('X').retain(2);
    server.receiveOperation(0, op1.toJSON());

    const op2FromOldRevision = new TextOperation().retain(1).delete(1).retain(1);
    server.receiveOperation(0, op2FromOldRevision.toJSON());

    expect(server.document).toBe('aXc');
    expect(server.getRevision()).toBe(2);
  });
});
