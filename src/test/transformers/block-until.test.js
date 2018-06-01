// @flow
import { expect } from 'chai';
import { Transform } from 'stream';
import { ReadableMock, WritableMock } from 'stream-mock';
import e2p from 'event-to-promise';
import _ from 'lodash';
import { BlockUntil } from 'transformers';

describe('block until', () => {
  it('should be an instance of Transform stream', () => {
    const blocker = new BlockUntil(_.identity);
    expect(blocker).to.be.an.instanceOf(Transform);
  });

  it('should be inclusive by default', () => {
    let blocker = new BlockUntil(_.identity);
    expect(blocker.inclusive).to.be.true;
    blocker = new BlockUntil(_.identity, {});
    expect(blocker.inclusive).to.be.true;
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
      const blocker = new BlockUntil(gte50, opt);
      source.pipe(blocker).pipe(sink);
      await drained();
      const expected = _.range(50, 100);
      expect(sink.data).to.have.members(expected);
    });

    it('should be exclusive if defined', async () => {
      const gte50 = v => v >= 50;
      const blocker = new BlockUntil(gte50, false, opt);
      source.pipe(blocker).pipe(sink);
      await drained();
      const expected = _.range(51, 100);
      expect(sink.data).to.have.members(expected);
    });
  });

  context('normal (Buffer) mode', () => {
    const data = 'Hello World!';
    let source: ReadableMock, sink: WritableMock;

    const drained = async () => {
      e2p(sink, 'finish');
    };

    beforeEach(() => {
      source = new ReadableMock(data);
      sink = new WritableMock();
    });

    it('should block data until condition is met', async () => {
      const space = v => v.toString() === ' ';
      const blocker = new BlockUntil(space);
      source.pipe(blocker).pipe(sink);
      await drained();
      const expected = ' World!';
      expect(sink.data.join('')).to.equals(expected);
    });

    it('should be exclusive if defined', async () => {
      const space = v => v.toString() === ' ';
      const blocker = new BlockUntil(space, false);
      source.pipe(blocker).pipe(sink);
      await drained();
      const expected = 'World!';
      expect(sink.data.join('')).to.equals(expected);
    });
  });
});
