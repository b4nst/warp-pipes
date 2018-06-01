// @flow
import { expect } from 'chai';
import { Transform } from 'stream';
import { ReadableMock, WritableMock } from 'stream-mock';
import e2p from 'event-to-promise';
import _ from 'lodash';
import { PassUntil } from 'transformers';

describe('pass until', () => {
  it('should be an instance of Transform stream', () => {
    const pass = new PassUntil(_.identity);
    expect(pass).to.be.an.instanceOf(Transform);
  });

  it('should be inclusive by default', () => {
    let pass = new PassUntil(_.identity);
    expect(pass.inclusive).to.be.true;
    pass = new PassUntil(_.identity, {});
    expect(pass.inclusive).to.be.true;
  });

  context('object mode', () => {
    const opt = { objectMode: true };
    const data = _.range(100);
    let source: ReadableMock, sink: WritableMock;

    const drained = async () => e2p(sink, 'finish');

    beforeEach(() => {
      source = new ReadableMock(data, opt);
      sink = new WritableMock(opt);
    });

    it('should block data until condition is met', async () => {
      const gte50 = v => v >= 50;
      const pass = new PassUntil(gte50, opt);
      source.pipe(pass).pipe(sink);
      await drained();
      const expected = _.range(51); // 0 to 50
      expect(sink.data).to.have.members(expected);
    });

    it('should be exclusive if defined', async () => {
      const gte50 = v => v >= 50;
      const pass = new PassUntil(gte50, false, opt);
      source.pipe(pass).pipe(sink);
      await drained();
      const expected = _.range(50); // 0 to 49
      expect(sink.data).to.have.members(expected);
    });
  });

  context('normal (Buffer) mode', () => {
    const data = 'Hello World!';
    let source: ReadableMock, sink: WritableMock;

    const drained = async () => e2p(sink, 'finish');

    beforeEach(() => {
      source = new ReadableMock(data);
      sink = new WritableMock();
    });

    it('should block data until condition is met', async () => {
      const space = v => v.toString() === ' ';
      const pass = new PassUntil(space);
      source.pipe(pass).pipe(sink);
      await drained();
      const expected = 'Hello ';
      expect(sink.data.toString()).to.equals(expected);
    });

    it('should be exclusive if defined', async () => {
      const space = v => v.toString() === ' ';
      const pass = new PassUntil(space, false);
      source.pipe(pass).pipe(sink);
      await drained();
      const expected = 'Hello';
      expect(sink.data.toString()).to.equals(expected);
    });
  });
});
